import {
  AppointmentStatus,
  CancellationSource,
  Prisma,
  PushNotificationEventType,
} from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { sendAppointmentStatusEmail } from '@/lib/services/email'
import { logger } from '@/lib/observability/logger'
import { deliverPushOutboxSafely } from '@/lib/push/delivery'
import { enqueueBookingPushNotification } from '@/lib/push/outbox'

export const VALID_APPOINTMENT_TRANSITIONS: Readonly<
  Record<AppointmentStatus, readonly AppointmentStatus[]>
> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'],
  RESCHEDULED: [],
  CANCELLED: [],
  COMPLETED: [],
  NO_SHOW: [],
}

export type AppointmentTransitionActor = 'USER' | 'CUSTOMER' | 'SYSTEM'

export class AppointmentTransitionError extends Error {
  constructor(
    message: string,
    public code: 'NOT_FOUND' | 'INVALID_TRANSITION' | 'CONCURRENT_UPDATE'
  ) {
    super(message)
    this.name = 'AppointmentTransitionError'
  }
}

export function canTransitionAppointment(
  fromStatus: AppointmentStatus,
  toStatus: AppointmentStatus
): boolean {
  return VALID_APPOINTMENT_TRANSITIONS[fromStatus].includes(toStatus)
}

export function assertAppointmentTransition(
  fromStatus: AppointmentStatus,
  toStatus: AppointmentStatus
): void {
  if (!canTransitionAppointment(fromStatus, toStatus)) {
    throw new AppointmentTransitionError(
      `Cannot change status from ${fromStatus} to ${toStatus}`,
      'INVALID_TRANSITION'
    )
  }
}

interface TransitionAppointmentInput {
  appointmentId: string
  businessId: string
  toStatus: AppointmentStatus
  changedBy?: string
  changedByType: AppointmentTransitionActor
  reason?: string
  notes?: string
  cancellationSource?: CancellationSource
  cancellationDetails?: string
  notifyCustomer?: boolean
  metadata?: Prisma.InputJsonValue
}

export async function transitionAppointment(input: TransitionAppointmentInput) {
  const changedAt = new Date()
  logger.info('booking.transition.started', {
    bookingId: input.appointmentId,
    businessId: input.businessId,
    toStatus: input.toStatus,
  })

  const transactionResult = await prisma.$transaction(async tx => {
    const current = await tx.appointment.findFirst({
      where: { id: input.appointmentId, businessId: input.businessId },
    })

    if (!current) {
      throw new AppointmentTransitionError('Appointment not found', 'NOT_FOUND')
    }

    assertAppointmentTransition(current.status, input.toStatus)

    const updateData: Prisma.AppointmentUpdateManyMutationInput = {
      status: input.toStatus,
      previousStatus: current.status,
    }

    if (
      current.status === AppointmentStatus.PENDING &&
      current.approvalExpiresAt &&
      (input.toStatus === AppointmentStatus.CONFIRMED ||
        input.toStatus === AppointmentStatus.CANCELLED)
    ) {
      updateData.approvalExpiresAt = null
      updateData.approvalRespondedAt = changedAt
    }

    if (input.toStatus === 'CONFIRMED') {
      updateData.confirmedAt = changedAt
      updateData.confirmedBy = input.changedBy
    } else if (input.toStatus === 'COMPLETED') {
      updateData.completedAt = changedAt
    } else if (input.toStatus === 'CANCELLED') {
      updateData.cancelledAt = changedAt
      updateData.cancelledBy = input.changedBy
      updateData.cancellationSource = input.cancellationSource || 'BUSINESS'
      updateData.cancellationReason = input.reason
      updateData.cancellationDetails = input.cancellationDetails
    } else if (input.toStatus === 'RESCHEDULED') {
      updateData.rescheduledAt = changedAt
      updateData.rescheduledBy = input.changedBy
      updateData.rescheduleReason = input.reason
    }

    if (input.notes) {
      const entry = `[${changedAt.toISOString()}] ${input.notes}`
      updateData.businessNotes = current.businessNotes
        ? `${current.businessNotes}\n\n${entry}`
        : entry
    }

    const updated = await tx.appointment.updateMany({
      where: {
        id: input.appointmentId,
        businessId: input.businessId,
        status: current.status,
      },
      data: updateData,
    })

    if (updated.count !== 1) {
      throw new AppointmentTransitionError(
        'Appointment status changed while the request was being processed',
        'CONCURRENT_UPDATE'
      )
    }

    if (input.toStatus === 'COMPLETED') {
      await tx.customer.update({
        where: { id: current.customerId },
        data: {
          completedBookings: { increment: 1 },
          totalSpent: { increment: current.totalAmount },
          lastBookingAt: changedAt,
        },
      })
    } else if (input.toStatus === 'NO_SHOW') {
      await tx.customer.update({
        where: { id: current.customerId },
        data: { noShowCount: { increment: 1 } },
      })
    } else if (input.toStatus === 'CANCELLED') {
      await tx.customer.update({
        where: { id: current.customerId },
        data: { cancelledBookings: { increment: 1 } },
      })
    }

    await tx.appointmentStatusTransition.create({
      data: {
        appointmentId: current.id,
        businessId: current.businessId,
        fromStatus: current.status,
        toStatus: input.toStatus,
        changedBy: input.changedBy,
        changedByType: input.changedByType,
        reason: input.reason,
        metadata: input.metadata,
        changedAt,
      },
    })

    const appointment = await tx.appointment.findUniqueOrThrow({
      where: { id: current.id },
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

    const pushOutbox =
      input.toStatus === 'CANCELLED' && input.cancellationSource !== 'SYSTEM'
        ? await enqueueBookingPushNotification(tx, {
            eventType: PushNotificationEventType.BOOKING_CANCELLED,
            eventKey: `booking:${appointment.id}:cancelled:${changedAt.toISOString()}`,
            businessId: input.businessId,
            appointmentId: appointment.id,
            customerName: appointment.customerName,
            serviceName: appointment.service.name,
            startTime: appointment.startTime,
            timezone: appointment.business.timezone,
          })
        : null

    return {
      appointment,
      pushOutboxId: pushOutbox?.id,
    }
  })
  const { appointment, pushOutboxId } = transactionResult

  logger.info('booking.transition.database_succeeded', {
    bookingId: appointment.id,
    businessId: input.businessId,
    fromStatus: appointment.previousStatus,
    toStatus: appointment.status,
  })

  const pushDelivery = pushOutboxId ? deliverPushOutboxSafely(pushOutboxId) : Promise.resolve(null)
  let notificationSent = false
  if (input.notifyCustomer) {
    logger.info('booking.transition.email_started', {
      bookingId: appointment.id,
      businessId: input.businessId,
    })
    const [emailResult] = await Promise.all([
      sendAppointmentStatusEmail({
        to: appointment.customerEmail,
        customerName: appointment.customerName,
        businessName: appointment.business.name,
        serviceName: appointment.service.name,
        startTime: appointment.startTime,
        timezone: appointment.business.timezone,
        fromStatus: appointment.previousStatus || input.toStatus,
        toStatus: appointment.status,
        reason: input.reason,
      }),
      pushDelivery,
    ])
    notificationSent = emailResult.success
    logger[notificationSent ? 'info' : 'warn']('booking.transition.email_completed', {
      bookingId: appointment.id,
      businessId: input.businessId,
      sent: notificationSent,
    })
  } else {
    await pushDelivery
  }

  logger.info('booking.transition.completed', {
    bookingId: appointment.id,
    businessId: input.businessId,
    notificationSent,
  })
  return { appointment, notificationSent, changedAt }
}
