import { Prisma, PushNotificationEventType } from '@prisma/client'
import { createHash } from 'crypto'
import { syncAppointmentToGoogleCalendar } from '@/lib/integrations/google-calendar'
import { prisma } from '@/lib/prisma'
import {
  isSlotAvailable,
  SlotGenerationConfig,
  DEFAULT_SLOT_CONFIG,
} from '@/lib/utils/availability'
import { DEFAULT_BUSINESS_SETTINGS } from '@/types/business'
import {
  addCalendarDays,
  DEFAULT_TIMEZONE,
  getDateInTimezone,
  zonedDateTimeToUtc,
} from '@/lib/utils/timezone'
import { AppointmentTransitionError, transitionAppointment } from '@/lib/services/appointment-state'
import { sendAppointmentStatusEmail } from '@/lib/services/email'
import { logger } from '@/lib/observability/logger'
import { deliverPushOutboxSafely } from '@/lib/push/delivery'
import { enqueueBookingPushNotification } from '@/lib/push/outbox'
import {
  bookingRequiresApproval,
  calculateApprovalExpiry,
  readBookingApprovalSettings,
} from '@/lib/booking-protection/approval'

export { zonedDateTimeToUtc } from '@/lib/utils/timezone'

export interface ConflictCheckResult {
  available: boolean
  reason?: string
  conflicts?: {
    appointmentId: string
    startTime: string
    endTime: string
    customerName: string
    serviceName: string
  }[]
}

export interface BookingResult {
  success: boolean
  appointment?: Awaited<ReturnType<typeof prisma.appointment.create>>
  error?: string
  conflicts?: ConflictCheckResult['conflicts']
  replayed?: boolean
  idempotencyConflict?: boolean
  pushOutboxId?: string
}

const BLOCKING_APPOINTMENT_STATUSES = ['PENDING', 'CONFIRMED'] as const
const BOOKING_LOCK_NAMESPACE = 1
const IDEMPOTENCY_WINDOW_MS = 24 * 60 * 60 * 1000

type BookingDbClient = typeof prisma | Prisma.TransactionClient

export function bookingRequestHash(input: unknown): string {
  return createHash('sha256').update(JSON.stringify(input)).digest('hex')
}

export async function lockBusinessBookingSchedule(
  tx: Prisma.TransactionClient,
  businessId: string
) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${businessId}, ${BOOKING_LOCK_NAMESPACE}))`
}

/**
 * Check for booking conflicts
 */
export async function checkBookingConflicts(
  businessId: string,
  date: string,
  startTime: string,
  duration: number,
  bufferTime: number,
  timezone: string,
  excludeAppointmentId?: string,
  db: BookingDbClient = prisma
): Promise<ConflictCheckResult> {
  const requestedStart = zonedDateTimeToUtc(date, startTime, timezone)
  const requestedEnd = new Date(requestedStart.getTime() + duration * 60_000)
  const searchStart = new Date(requestedStart.getTime() - 24 * 60 * 60_000)
  const searchEnd = new Date(requestedEnd.getTime() + 24 * 60 * 60_000)

  const existingAppointments = await db.appointment.findMany({
    where: {
      businessId,
      startTime: { lt: searchEnd },
      endTime: { gt: searchStart },
      status: { in: [...BLOCKING_APPOINTMENT_STATUSES] },
      ...(excludeAppointmentId && { id: { not: excludeAppointmentId } }),
    },
    include: {
      service: { select: { name: true, bufferTime: true } },
    },
  })

  const conflicts: ConflictCheckResult['conflicts'] = []

  for (const appt of existingAppointments) {
    const apptStartTime = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(appt.startTime)

    const apptEndTime = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(appt.endTime)

    const requestedBuffer = bufferTime * 60_000
    const existingBuffer = (appt.service.bufferTime || 0) * 60_000
    const overlaps =
      requestedStart.getTime() < appt.endTime.getTime() + existingBuffer &&
      requestedEnd.getTime() + requestedBuffer > appt.startTime.getTime()

    if (overlaps) {
      conflicts.push({
        appointmentId: appt.id,
        startTime: apptStartTime,
        endTime: apptEndTime,
        customerName: appt.customerName,
        serviceName: appt.service.name,
      })
    }
  }

  if (conflicts.length > 0) {
    return {
      available: false,
      reason:
        conflicts.length === 1
          ? `Conflicts with appointment at ${conflicts[0].startTime}`
          : `Conflicts with ${conflicts.length} existing appointments`,
      conflicts,
    }
  }

  return { available: true }
}

/**
 * Validate booking against business hours and special dates
 */
export async function validateBookingTime(
  businessId: string,
  date: string,
  startTime: string,
  duration: number
): Promise<{ valid: boolean; reason?: string }> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      businessHours: { orderBy: { dayOfWeek: 'asc' } },
      specialDates: true,
    },
  })

  if (!business) {
    return { valid: false, reason: 'Business not found' }
  }

  const settings = { ...DEFAULT_BUSINESS_SETTINGS, ...((business.settings as object) || {}) }
  const timezone = business.timezone || DEFAULT_TIMEZONE

  const config: SlotGenerationConfig = {
    serviceDuration: duration,
    bufferTime: settings.bufferTime ?? DEFAULT_SLOT_CONFIG.bufferTime,
    slotInterval: 15,
    advanceBookingDays: settings.advanceBookingDays ?? DEFAULT_SLOT_CONFIG.advanceBookingDays,
    sameDayBooking: settings.sameDayBooking ?? DEFAULT_SLOT_CONFIG.sameDayBooking,
    sameDayLeadTime: DEFAULT_SLOT_CONFIG.sameDayLeadTime,
  }

  // Check if date is within booking window
  const today = new Date()
  const todayString = getDateInTimezone(today, timezone)
  const maxDateString = addCalendarDays(todayString, config.advanceBookingDays)

  if (date < todayString) {
    return { valid: false, reason: 'Cannot book in the past' }
  }

  if (date > maxDateString) {
    return {
      valid: false,
      reason: `Cannot book more than ${config.advanceBookingDays} days in advance`,
    }
  }

  // Check same-day booking
  if (date === todayString && !config.sameDayBooking) {
    return { valid: false, reason: 'Same-day booking is not available' }
  }

  // Check slot availability using existing utility
  try {
    zonedDateTimeToUtc(date, startTime, timezone)
  } catch (error) {
    return {
      valid: false,
      reason: error instanceof Error ? error.message : 'Invalid booking time',
    }
  }

  const result = isSlotAvailable(
    date,
    startTime,
    business.businessHours,
    business.specialDates,
    [],
    config,
    timezone
  )

  return { valid: result.available, reason: result.reason }
}

/**
 * Create a new booking with conflict checking
 */
export async function createBooking(
  businessId: string,
  serviceId: string,
  date: string,
  startTime: string,
  customerData: {
    name: string
    email: string
    phone?: string | null
    notes?: string | null
  },
  options?: {
    customerId?: string
    businessNotes?: string | null
    status?: 'PENDING' | 'CONFIRMED'
    bookingSource?: string
    bookingIp?: string
    idempotencyKey?: string
    deposit?: {
      amount: number
      policyVersion: string
      policyAcceptedAt: Date
      policySnapshot: Prisma.InputJsonValue
    }
    metadata?: Prisma.InputJsonValue
    countCustomerBooking?: boolean
    approvalExpiresAt?: Date | null
  }
): Promise<BookingResult> {
  logger.info('booking.creation.started', { businessId, serviceId })

  // Get service details
  const service = await prisma.service.findUnique({
    where: { id: serviceId, businessId },
  })

  if (!service) {
    logger.warn('booking.creation.rejected', { businessId, serviceId, reason: 'service_not_found' })
    return { success: false, error: 'Service not found' }
  }

  if (!service.active) {
    logger.warn('booking.creation.rejected', { businessId, serviceId, reason: 'service_inactive' })
    return { success: false, error: 'This service is not currently available' }
  }

  // Get business details
  const business = await prisma.business.findUnique({
    where: { id: businessId },
  })

  if (!business) {
    logger.warn('booking.creation.rejected', {
      businessId,
      serviceId,
      reason: 'business_not_found',
    })
    return { success: false, error: 'Business not found' }
  }

  const settings = { ...DEFAULT_BUSINESS_SETTINGS, ...((business.settings as object) || {}) }
  const timezone = business.timezone || 'Europe/London'
  const bufferTime = service.bufferTime || settings.bufferTime || 0
  const normalizedCustomerEmail = customerData.email.toLowerCase().trim()

  // Validate booking time
  const timeValidation = await validateBookingTime(businessId, date, startTime, service.duration)
  if (!timeValidation.valid) {
    logger.warn('booking.creation.rejected', {
      businessId,
      serviceId,
      reason: 'time_validation_failed',
      validationReason: timeValidation.reason,
    })
    return { success: false, error: timeValidation.reason }
  }

  const result: BookingResult = await prisma.$transaction(async tx => {
    logger.info('booking.database.transaction_started', { businessId, serviceId })
    await lockBusinessBookingSchedule(tx, businessId)

    const requestHash = options?.idempotencyKey
      ? bookingRequestHash({
          businessId,
          serviceId,
          date,
          startTime,
          customerId: options.customerId || null,
          customerEmail: normalizedCustomerEmail,
          customerName: customerData.name,
          customerPhone: customerData.phone || null,
          customerNotes: customerData.notes || null,
          businessNotes: options.businessNotes || null,
          status: options.status || null,
          depositAmount: options.deposit?.amount || null,
          policyVersion: options.deposit?.policyVersion || null,
        })
      : null

    if (options?.idempotencyKey && requestHash) {
      await tx.bookingIdempotencyKey.deleteMany({
        where: {
          businessId,
          key: options.idempotencyKey,
          expiresAt: { lte: new Date() },
        },
      })

      const existingKey = await tx.bookingIdempotencyKey.findUnique({
        where: { businessId_key: { businessId, key: options.idempotencyKey } },
        include: {
          appointment: {
            include: {
              service: true,
              customer: true,
              business: {
                select: { name: true, email: true, phone: true, timezone: true },
              },
            },
          },
        },
      })

      if (existingKey) {
        if (existingKey.requestHash !== requestHash) {
          logger.warn('booking.creation.rejected', {
            businessId,
            serviceId,
            reason: 'idempotency_conflict',
          })
          return {
            success: false,
            error: 'Idempotency key has already been used for a different booking request',
            idempotencyConflict: true,
          }
        }

        logger.info('booking.creation.replayed', {
          businessId,
          serviceId,
          bookingId: existingKey.appointment.id,
        })
        return { success: true, appointment: existingKey.appointment, replayed: true }
      }
    }

    const conflictCheck = await checkBookingConflicts(
      businessId,
      date,
      startTime,
      service.duration,
      bufferTime,
      timezone,
      undefined,
      tx
    )

    if (!conflictCheck.available) {
      logger.warn('booking.creation.rejected', {
        businessId,
        serviceId,
        reason: 'schedule_conflict',
        conflictCount: conflictCheck.conflicts?.length || 0,
      })
      return {
        success: false,
        error: conflictCheck.reason,
        conflicts: conflictCheck.conflicts,
      }
    }

    const startDateTime = zonedDateTimeToUtc(date, startTime, timezone)
    const endDateTime = new Date(startDateTime.getTime() + service.duration * 60_000)
    let customerId = options?.customerId

    if (!customerId) {
      const existingCustomer = await tx.customer.findUnique({
        where: {
          businessId_email: {
            businessId,
            email: normalizedCustomerEmail,
          },
        },
      })

      if (existingCustomer) {
        customerId = existingCustomer.id

        // Update customer info if needed
        await tx.customer.update({
          where: { id: customerId },
          data: {
            name: customerData.name,
            phone: customerData.phone || existingCustomer.phone,
            ...(options?.countCustomerBooking !== false && {
              totalBookings: { increment: 1 },
            }),
          },
        })
      } else {
        const newCustomer = await tx.customer.create({
          data: {
            businessId,
            email: normalizedCustomerEmail,
            name: customerData.name,
            phone: customerData.phone,
            totalBookings: options?.countCustomerBooking === false ? 0 : 1,
            firstBookingAt: options?.countCustomerBooking === false ? null : new Date(),
          },
        })
        customerId = newCustomer.id
      }
    }

    // Determine initial status
    const requiresApproval = bookingRequiresApproval(service.requiresApproval, business.settings)
    const status = options?.status || (requiresApproval ? 'PENDING' : 'CONFIRMED')
    const approvalSettings = readBookingApprovalSettings(business.settings)
    const approvalExpiresAt =
      status === 'PENDING' && requiresApproval
        ? (options?.approvalExpiresAt ??
          calculateApprovalExpiry(startDateTime, approvalSettings.approvalWindowHours))
        : null

    // Create appointment
    const appointment = await tx.appointment.create({
      data: {
        businessId,
        serviceId,
        customerId,
        startTime: startDateTime,
        endTime: endDateTime,
        duration: service.duration,
        timezone,
        status,
        customerName: customerData.name,
        customerEmail: normalizedCustomerEmail,
        customerPhone: customerData.phone,
        customerNotes: customerData.notes,
        businessNotes: options?.businessNotes,
        totalAmount: service.price,
        requiresDeposit: Boolean(options?.deposit),
        depositAmount: options?.deposit?.amount ?? null,
        cancellationPolicyVersion: options?.deposit?.policyVersion ?? null,
        cancellationPolicyAcceptedAt: options?.deposit?.policyAcceptedAt ?? null,
        cancellationPolicySnapshot: options?.deposit?.policySnapshot ?? undefined,
        metadata: options?.metadata,
        bookingSource: options?.bookingSource || 'website',
        bookingIp: options?.bookingIp,
        confirmedAt: status === 'CONFIRMED' ? new Date() : null,
        approvalExpiresAt,
      },
      include: {
        service: true,
        customer: true,
        business: {
          select: {
            name: true,
            email: true,
            phone: true,
            address: true,
            timezone: true,
          },
        },
      },
    })

    if (options?.idempotencyKey && requestHash) {
      await tx.bookingIdempotencyKey.create({
        data: {
          businessId,
          key: options.idempotencyKey,
          requestHash,
          appointmentId: appointment.id,
          expiresAt: new Date(Date.now() + IDEMPOTENCY_WINDOW_MS),
        },
      })
    }

    if (options?.countCustomerBooking !== false) {
      await tx.customer.update({
        where: { id: customerId },
        data: { lastBookingAt: new Date() },
      })
    }

    logger.info('booking.database.appointment_created', {
      businessId,
      serviceId,
      bookingId: appointment.id,
    })
    return { success: true, appointment }
  })

  if (!result.success || !result.appointment || result.replayed || options?.deposit) {
    return result
  }

  // Push alerts are an optional delivery enhancement. Queue them only after the
  // booking transaction commits so an unavailable or not-yet-migrated outbox
  // cannot roll back a valid customer booking.
  try {
    const pushOutbox = await enqueueBookingPushNotification(prisma, {
      eventType: PushNotificationEventType.NEW_BOOKING,
      eventKey: `booking:${result.appointment.id}:created`,
      businessId,
      appointmentId: result.appointment.id,
      customerName: customerData.name,
      serviceName: service.name,
      startTime: result.appointment.startTime,
      timezone,
    })

    return { ...result, pushOutboxId: pushOutbox.id }
  } catch (error) {
    logger.warn('booking.push_notification_enqueue_failed', {
      businessId,
      serviceId,
      bookingId: result.appointment.id,
      error: error instanceof Error ? error.message : 'Unknown push outbox error',
    })
  }

  return result
}

/**
 * Reschedule an existing appointment
 */
export async function rescheduleAppointment(
  appointmentId: string,
  businessId: string,
  newDate: string,
  newStartTime: string,
  reason?: string,
  rescheduledBy?: string,
  notifyCustomer = true
): Promise<BookingResult> {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, businessId },
    include: { service: true },
  })

  if (!appointment) {
    return { success: false, error: 'Appointment not found' }
  }

  if (['COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'].includes(appointment.status)) {
    return { success: false, error: 'Cannot reschedule a completed or cancelled appointment' }
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
  })

  if (!business) {
    return { success: false, error: 'Business not found' }
  }

  const settings = { ...DEFAULT_BUSINESS_SETTINGS, ...((business.settings as object) || {}) }
  const timezone = business.timezone || 'Europe/London'
  const bufferTime = appointment.service.bufferTime || settings.bufferTime || 0

  // Validate new time
  const timeValidation = await validateBookingTime(
    businessId,
    newDate,
    newStartTime,
    appointment.duration
  )

  if (!timeValidation.valid) {
    return { success: false, error: timeValidation.reason }
  }

  const result = await prisma.$transaction(async tx => {
    await lockBusinessBookingSchedule(tx, businessId)
    const conflictCheck = await checkBookingConflicts(
      businessId,
      newDate,
      newStartTime,
      appointment.duration,
      bufferTime,
      timezone,
      appointmentId,
      tx
    )

    if (!conflictCheck.available) {
      return {
        success: false,
        error: conflictCheck.reason,
        conflicts: conflictCheck.conflicts,
      }
    }

    const newStartDateTime = zonedDateTimeToUtc(newDate, newStartTime, timezone)
    const newEndDateTime = new Date(newStartDateTime.getTime() + appointment.duration * 60_000)
    const originalStartTime = appointment.startTime.toISOString()

    const updatedAppointment = await tx.appointment.update({
      where: { id: appointmentId },
      data: {
        startTime: newStartDateTime,
        endTime: newEndDateTime,
        rescheduledFrom: originalStartTime,
        rescheduledTo: newStartDateTime.toISOString(),
        rescheduledBy,
        rescheduledAt: new Date(),
        rescheduleReason: reason,
      },
      include: {
        service: true,
        customer: true,
        business: {
          select: {
            name: true,
            email: true,
            phone: true,
            timezone: true,
          },
        },
      },
    })

    const rescheduledAt = updatedAppointment.rescheduledAt || new Date()
    const pushOutbox = await enqueueBookingPushNotification(tx, {
      eventType: PushNotificationEventType.BOOKING_RESCHEDULED,
      eventKey: `booking:${updatedAppointment.id}:rescheduled:${rescheduledAt.toISOString()}`,
      businessId,
      appointmentId: updatedAppointment.id,
      customerName: updatedAppointment.customerName,
      serviceName: updatedAppointment.service.name,
      startTime: updatedAppointment.startTime,
      timezone: updatedAppointment.business.timezone,
    })

    return {
      success: true,
      appointment: updatedAppointment,
      pushOutboxId: pushOutbox.id,
    }
  })

  await Promise.all([
    result.pushOutboxId ? deliverPushOutboxSafely(result.pushOutboxId) : Promise.resolve(null),
    result.appointment?.status === 'CONFIRMED'
      ? syncAppointmentToGoogleCalendar(result.appointment.id)
      : Promise.resolve({ success: true, skipped: true }),
    notifyCustomer && result.appointment
      ? sendAppointmentStatusEmail({
          to: result.appointment.customerEmail,
          customerName: result.appointment.customerName,
          businessName: result.appointment.business.name,
          serviceName: result.appointment.service.name,
          bookingId: result.appointment.id,
          startTime: result.appointment.startTime,
          endTime: result.appointment.endTime,
          timezone: result.appointment.business.timezone,
          businessAddress: result.appointment.business.address,
          fromStatus: result.appointment.status,
          toStatus: 'RESCHEDULED',
          reason,
        })
      : Promise.resolve(null),
  ])

  return result
}

/**
 * Cancel an appointment
 */
export async function cancelAppointment(
  appointmentId: string,
  businessId: string,
  cancelledBy: 'CUSTOMER' | 'BUSINESS' | 'SYSTEM',
  reason?: string,
  actorId?: string
): Promise<BookingResult> {
  try {
    const result = await transitionAppointment({
      appointmentId,
      businessId,
      toStatus: 'CANCELLED',
      changedBy: actorId,
      changedByType:
        cancelledBy === 'CUSTOMER' ? 'CUSTOMER' : cancelledBy === 'SYSTEM' ? 'SYSTEM' : 'USER',
      reason,
      cancellationSource: cancelledBy,
      notifyCustomer: true,
    })

    return { success: true, appointment: result.appointment }
  } catch (error) {
    if (error instanceof AppointmentTransitionError) {
      return { success: false, error: error.message }
    }
    throw error
  }
}
