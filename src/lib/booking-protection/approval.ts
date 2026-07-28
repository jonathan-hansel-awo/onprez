import { AppointmentStatus } from '@prisma/client'

import { requestBookingDepositRefund } from '@/lib/booking-protection/operations'
import { logger } from '@/lib/observability/logger'
import { prisma } from '@/lib/prisma'
import { AppointmentTransitionError, transitionAppointment } from '@/lib/services/appointment-state'

export const DEFAULT_APPROVAL_WINDOW_HOURS = 24
export const MIN_APPROVAL_WINDOW_HOURS = 1
export const MAX_APPROVAL_WINDOW_HOURS = 168

type SettingsRecord = Record<string, unknown>

function record(value: unknown): SettingsRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as SettingsRecord)
    : {}
}

export function readBookingApprovalSettings(settings: unknown): {
  requireApproval: boolean
  approvalWindowHours: number
} {
  const root = record(settings)
  const booking = record(root.booking)
  const requireApproval =
    typeof booking.requireApproval === 'boolean'
      ? booking.requireApproval
      : root.requireApproval === true
  const configuredWindow = booking.approvalWindowHours
  const approvalWindowHours =
    typeof configuredWindow === 'number' &&
    Number.isFinite(configuredWindow) &&
    configuredWindow >= MIN_APPROVAL_WINDOW_HOURS &&
    configuredWindow <= MAX_APPROVAL_WINDOW_HOURS
      ? configuredWindow
      : DEFAULT_APPROVAL_WINDOW_HOURS

  return { requireApproval, approvalWindowHours }
}

export function bookingRequiresApproval(
  serviceRequiresApproval: boolean,
  businessSettings: unknown
): boolean {
  return serviceRequiresApproval || readBookingApprovalSettings(businessSettings).requireApproval
}

export function calculateApprovalExpiry(
  startTime: Date,
  approvalWindowHours: number,
  now = new Date()
): Date {
  const configuredExpiry = new Date(now.getTime() + approvalWindowHours * 3_600_000)
  return configuredExpiry < startTime ? configuredExpiry : startTime
}

export interface ApprovalExpiryResult {
  selected: number
  expired: number
  refundPending: number
  refundFailed: number
  skipped: number
  errors: number
}

export async function expirePendingBookingApprovals(
  now = new Date(),
  limit = 100
): Promise<ApprovalExpiryResult> {
  const appointments = await prisma.appointment.findMany({
    where: {
      status: AppointmentStatus.PENDING,
      approvalExpiresAt: { lte: now },
      OR: [{ requiresDeposit: false }, { depositPaid: true }],
    },
    orderBy: { approvalExpiresAt: 'asc' },
    take: Math.min(Math.max(limit, 1), 500),
    select: { id: true, businessId: true },
  })
  const result: ApprovalExpiryResult = {
    selected: appointments.length,
    expired: 0,
    refundPending: 0,
    refundFailed: 0,
    skipped: 0,
    errors: 0,
  }

  for (const appointment of appointments) {
    try {
      await transitionAppointment({
        appointmentId: appointment.id,
        businessId: appointment.businessId,
        toStatus: AppointmentStatus.CANCELLED,
        changedByType: 'SYSTEM',
        reason: 'APPROVAL_EXPIRED',
        cancellationSource: 'SYSTEM',
        notes: 'Booking request expired because it was not approved before the deadline.',
        notifyCustomer: true,
        metadata: { approvalExpiredAt: now.toISOString() },
      })
      result.expired += 1

      const refund = await requestBookingDepositRefund({
        appointmentId: appointment.id,
        businessId: appointment.businessId,
        requestedBy: 'SYSTEM',
        reason: 'Booking approval deadline expired',
      })
      if (refund.status === 'PENDING') result.refundPending += 1
      if (refund.status === 'FAILED') result.refundFailed += 1
    } catch (error) {
      if (
        error instanceof AppointmentTransitionError &&
        (error.code === 'INVALID_TRANSITION' || error.code === 'CONCURRENT_UPDATE')
      ) {
        result.skipped += 1
        continue
      }
      result.errors += 1
      logger.error('booking.approval.expiry_failed', {
        bookingId: appointment.id,
        businessId: appointment.businessId,
        error,
      })
    }
  }

  logger.info('booking.approval.expiry_completed', { ...result })
  return result
}
