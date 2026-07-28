/** @jest-environment node */

import { AppointmentStatus } from '@prisma/client'

import {
  bookingRequiresApproval,
  calculateApprovalExpiry,
  expirePendingBookingApprovals,
  readBookingApprovalSettings,
} from '@/lib/booking-protection/approval'
import { requestBookingDepositRefund } from '@/lib/booking-protection/operations'
import { prisma } from '@/lib/prisma'
import { transitionAppointment } from '@/lib/services/appointment-state'

jest.mock('@/lib/prisma', () => ({
  prisma: { appointment: { findMany: jest.fn() } },
}))
jest.mock('@/lib/services/appointment-state', () => ({
  AppointmentTransitionError: class AppointmentTransitionError extends Error {},
  transitionAppointment: jest.fn(),
}))
jest.mock('@/lib/booking-protection/operations', () => ({
  requestBookingDepositRefund: jest.fn(),
}))
jest.mock('@/lib/observability/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}))

const findMany = prisma.appointment.findMany as jest.Mock
const mockedTransition = transitionAppointment as jest.Mock
const mockedRefund = requestBookingDepositRefund as jest.Mock

describe('booking approval lifecycle', () => {
  beforeEach(() => jest.clearAllMocks())

  it('honours nested business-wide approval settings and their deadline', () => {
    const settings = { booking: { requireApproval: true, approvalWindowHours: 48 } }

    expect(bookingRequiresApproval(false, settings)).toBe(true)
    expect(readBookingApprovalSettings(settings)).toEqual({
      requireApproval: true,
      approvalWindowHours: 48,
    })
  })

  it('caps the approval deadline at the appointment start', () => {
    const now = new Date('2026-07-28T12:00:00.000Z')
    const startTime = new Date('2026-07-28T18:00:00.000Z')

    expect(calculateApprovalExpiry(startTime, 24, now)).toEqual(startTime)
  })

  it('expires an unanswered paid request, releases its slot, and requests a refund', async () => {
    findMany.mockResolvedValue([{ id: 'appointment-1', businessId: 'business-1' }])
    mockedTransition.mockResolvedValue({ appointment: { status: AppointmentStatus.CANCELLED } })
    mockedRefund.mockResolvedValue({
      status: 'SUCCEEDED',
      refundableAmount: 10,
      refundedAmount: 10,
    })
    const now = new Date('2026-07-29T12:00:00.000Z')

    const result = await expirePendingBookingApprovals(now)

    expect(mockedTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        appointmentId: 'appointment-1',
        toStatus: AppointmentStatus.CANCELLED,
        reason: 'APPROVAL_EXPIRED',
        changedByType: 'SYSTEM',
      })
    )
    expect(mockedRefund).toHaveBeenCalledWith(
      expect.objectContaining({
        appointmentId: 'appointment-1',
        reason: 'Booking approval deadline expired',
      })
    )
    expect(result).toEqual(
      expect.objectContaining({ selected: 1, expired: 1, refundFailed: 0, errors: 0 })
    )
  })
})
