import { prisma } from '@/lib/prisma'
import {
  generateDayAvailability,
  isSlotAvailable,
  timeToMinutes,
  minutesToTime,
  SlotGenerationConfig,
  DEFAULT_SLOT_CONFIG,
} from '@/lib/utils/availability'
import { DEFAULT_BUSINESS_SETTINGS } from '@/types/business'

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
  excludeAppointmentId?: string
): Promise<ConflictCheckResult> {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = startMinutes + duration

  // Get appointments for the day
  const dayStart = new Date(date + 'T00:00:00')
  const dayEnd = new Date(date + 'T23:59:59')

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      businessId,
      startTime: { gte: dayStart, lte: dayEnd },
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      ...(excludeAppointmentId && { id: { not: excludeAppointmentId } }),
    },
    include: {
      service: { select: { name: true } },
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

    const apptStart = timeToMinutes(apptStartTime)
    const apptEnd = timeToMinutes(apptEndTime)

    // Check direct overlap
    const hasDirectOverlap = startMinutes < apptEnd && endMinutes > apptStart

    // Check buffer overlap
    const startWithBuffer = startMinutes - bufferTime
    const endWithBuffer = endMinutes + bufferTime
    const hasBufferOverlap = startWithBuffer < apptEnd && endWithBuffer > apptStart

    if (hasDirectOverlap || hasBufferOverlap) {
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
  const timezone = business.timezone || 'Europe/London'

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
  const bookingDate = new Date(date)
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + config.advanceBookingDays)

  if (bookingDate < today) {
    return { valid: false, reason: 'Cannot book in the past' }
  }

  if (bookingDate > maxDate) {
    return {
      valid: false,
      reason: `Cannot book more than ${config.advanceBookingDays} days in advance`,
    }
  }

  // Check same-day booking
  const todayString = today.toISOString().split('T')[0]
  if (date === todayString && !config.sameDayBooking) {
    return { valid: false, reason: 'Same-day booking is not available' }
  }

  // Check slot availability using existing utility
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
    skipConflictCheck?: boolean
    bookingSource?: string
    bookingIp?: string
  }
): Promise<BookingResult> {
  // Get service details
  const service = await prisma.service.findUnique({
    where: { id: serviceId, businessId },
  })

  if (!service) {
    return { success: false, error: 'Service not found' }
  }

  if (!service.active) {
    return { success: false, error: 'This service is not currently available' }
  }

  // Get business details
  const business = await prisma.business.findUnique({
    where: { id: businessId },
  })

  if (!business) {
    return { success: false, error: 'Business not found' }
  }

  const settings = { ...DEFAULT_BUSINESS_SETTINGS, ...((business.settings as object) || {}) }
  const timezone = business.timezone || 'Europe/London'
  const bufferTime = service.bufferTime || settings.bufferTime || 0

  // Validate booking time
  const timeValidation = await validateBookingTime(businessId, date, startTime, service.duration)
  if (!timeValidation.valid) {
    return { success: false, error: timeValidation.reason }
  }

  // Check for conflicts (unless skipped)
  if (!options?.skipConflictCheck) {
    const conflictCheck = await checkBookingConflicts(
      businessId,
      date,
      startTime,
      service.duration,
      bufferTime,
      timezone
    )

    if (!conflictCheck.available) {
      return {
        success: false,
        error: conflictCheck.reason,
        conflicts: conflictCheck.conflicts,
      }
    }
  }

  // Calculate end time
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = startMinutes + service.duration
  const endTime = minutesToTime(endMinutes)

  // Create start and end DateTime
  const startDateTime = new Date(`${date}T${startTime}:00`)
  const endDateTime = new Date(`${date}T${endTime}:00`)

  // Find or create customer
  let customerId = options?.customerId

  if (!customerId) {
    const existingCustomer = await prisma.customer.findUnique({
      where: {
        businessId_email: {
          businessId,
          email: customerData.email,
        },
      },
    })

    if (existingCustomer) {
      customerId = existingCustomer.id

      // Update customer info if needed
      await prisma.customer.update({
        where: { id: customerId },
        data: {
          name: customerData.name,
          phone: customerData.phone || existingCustomer.phone,
          totalBookings: { increment: 1 },
        },
      })
    } else {
      const newCustomer = await prisma.customer.create({
        data: {
          businessId,
          email: customerData.email,
          name: customerData.name,
          phone: customerData.phone,
          totalBookings: 1,
          firstBookingAt: new Date(),
        },
      })
      customerId = newCustomer.id
    }
  }

  // Determine initial status
  const requiresApproval = service.requiresApproval || settings.requireApproval
  const status = options?.status || (requiresApproval ? 'PENDING' : 'CONFIRMED')

  // Create appointment
  const appointment = await prisma.appointment.create({
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
      customerEmail: customerData.email,
      customerPhone: customerData.phone,
      customerNotes: customerData.notes,
      businessNotes: options?.businessNotes,
      totalAmount: service.price,
      requiresDeposit: service.requiresDeposit,
      depositAmount: service.depositAmount,
      bookingSource: options?.bookingSource || 'website',
      bookingIp: options?.bookingIp,
      confirmedAt: status === 'CONFIRMED' ? new Date() : null,
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

  // Update customer's last booking date
  await prisma.customer.update({
    where: { id: customerId },
    data: { lastBookingAt: new Date() },
  })

  return { success: true, appointment }
}

/**
 * Reschedule an existing appointment
 */
export async function rescheduleAppointment(
  appointmentId: string,
  businessId: string,
  newDate: string,
  newStartTime: string,
  reason?: string
): Promise<BookingResult> {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, businessId },
    include: { service: true },
  })

  if (!appointment) {
    return { success: false, error: 'Appointment not found' }
  }

  if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appointment.status)) {
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

  // Check for conflicts (excluding current appointment)
  const conflictCheck = await checkBookingConflicts(
    businessId,
    newDate,
    newStartTime,
    appointment.duration,
    bufferTime,
    timezone,
    appointmentId
  )

  if (!conflictCheck.available) {
    return {
      success: false,
      error: conflictCheck.reason,
      conflicts: conflictCheck.conflicts,
    }
  }

  // Calculate new end time
  const startMinutes = timeToMinutes(newStartTime)
  const endMinutes = startMinutes + appointment.duration
  const newEndTime = minutesToTime(endMinutes)

  const newStartDateTime = new Date(`${newDate}T${newStartTime}:00`)
  const newEndDateTime = new Date(`${newDate}T${newEndTime}:00`)

  // Store original time for reference
  const originalStartTime = appointment.startTime.toISOString()

  // Update appointment
  const updatedAppointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      startTime: newStartDateTime,
      endTime: newEndDateTime,
      status: 'CONFIRMED',
      previousStatus: appointment.status,
      rescheduledFrom: originalStartTime,
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

  return { success: true, appointment: updatedAppointment }
}

/**
 * Cancel an appointment
 */
export async function cancelAppointment(
  appointmentId: string,
  businessId: string,
  cancelledBy: 'CUSTOMER' | 'BUSINESS' | 'SYSTEM',
  reason?: string
): Promise<BookingResult> {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, businessId },
  })

  if (!appointment) {
    return { success: false, error: 'Appointment not found' }
  }

  if (['COMPLETED', 'CANCELLED'].includes(appointment.status)) {
    return { success: false, error: 'Appointment is already completed or cancelled' }
  }

  const updatedAppointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: 'CANCELLED',
      previousStatus: appointment.status,
      cancelledAt: new Date(),
      cancellationSource: cancelledBy,
      cancellationReason: reason,
    },
    include: {
      service: true,
      customer: true,
      business: {
        select: {
          name: true,
          email: true,
          timezone: true,
        },
      },
    },
  })

  // Update customer stats
  await prisma.customer.update({
    where: { id: appointment.customerId },
    data: {
      cancelledBookings: { increment: 1 },
    },
  })

  return { success: true, appointment: updatedAppointment }
}
