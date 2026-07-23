/** @jest-environment node */

import { BookingPaymentStatus, BookingRefundStatus } from '@prisma/client'
import { NextRequest } from 'next/server'

import { requireAppointmentRole } from '@/lib/auth/appointment-access'
import { getCurrentUser } from '@/lib/auth/get-user'
import {
  recordRetainedBookingDeposit,
  requestBookingDepositRefund,
} from '@/lib/booking-protection/operations'
import { prisma } from '@/lib/prisma'
import { transitionAppointment } from '@/lib/services/appointment-state'
import { POST } from '../route'

jest.mock('@/lib/auth/get-user', () => ({ getCurrentUser: jest.fn() }))
jest.mock('@/lib/auth/appointment-access', () => ({ requireAppointmentRole: jest.fn() }))
jest.mock('@/lib/auth/business-access', () => ({ businessAuthErrorResponse: jest.fn() }))
jest.mock('@/lib/services/appointment-state', () => ({
  AppointmentTransitionError: class AppointmentTransitionError extends Error {},
  transitionAppointment: jest.fn(),
}))
jest.mock('@/lib/booking-protection/operations', () => ({
  requestBookingDepositRefund: jest.fn(),
  recordRetainedBookingDeposit: jest.fn(),
}))
jest.mock('@/lib/prisma', () => ({
  prisma: { bookingPayment: { findFirst: jest.fn() } },
}))
jest.mock('@/lib/observability/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}))

const mockedUser = getCurrentUser as jest.Mock
const mockedRequireRole = requireAppointmentRole as jest.Mock
const mockedTransition = transitionAppointment as jest.Mock
const mockedRefund = requestBookingDepositRefund as jest.Mock
const mockedRetain = recordRetainedBookingDeposit as jest.Mock
const mockedPaymentFind = prisma.bookingPayment.findFirst as jest.Mock

function request(body: unknown, origin = 'https://onprez.test') {
  return new NextRequest('https://onprez.test/api/dashboard/bookings/appointment-1/cancel', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify(body),
  })
}

const access = {
  appointment: {
    id: 'appointment-1',
    businessId: 'business-1',
    startTime: new Date('2026-08-10T10:00:00.000Z'),
  },
}
const paidDeposit = {
  id: 'payment-1',
  amount: 10,
  refundedAmount: 0,
  status: BookingPaymentStatus.SUCCEEDED,
  refundStatus: BookingRefundStatus.NOT_REQUESTED,
  policySnapshot: { cancellationWindowHours: 24 },
}

describe('POST dashboard booking cancellation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers().setSystemTime(new Date('2026-08-01T10:00:00.000Z'))
    mockedUser.mockResolvedValue({ id: 'user-1', email: 'owner@example.com' })
    mockedRequireRole.mockResolvedValue(access)
    mockedPaymentFind.mockResolvedValue(paidDeposit)
    mockedTransition.mockResolvedValue({
      appointment: { id: 'appointment-1', status: 'CANCELLED' },
      notificationSent: true,
    })
    mockedRefund.mockResolvedValue({
      status: 'SUCCEEDED',
      refundableAmount: 10,
      refundedAmount: 10,
    })
    mockedRetain.mockResolvedValue(true)
  })

  afterEach(() => jest.useRealTimers())

  it('rejects cross-origin financial mutations', async () => {
    const response = await POST(request({ reason: 'CUSTOMER_REQUEST' }, 'https://attacker.test'), {
      params: Promise.resolve({ id: 'appointment-1' }),
    })

    expect(response.status).toBe(403)
    expect(mockedUser).not.toHaveBeenCalled()
  })

  it('forces a refund for business-caused cancellations', async () => {
    const response = await POST(request({ reason: 'BUSINESS_UNAVAILABLE', refundDeposit: false }), {
      params: Promise.resolve({ id: 'appointment-1' }),
    })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mockedTransition).toHaveBeenCalled()
    expect(mockedRefund).toHaveBeenCalledWith(
      expect.objectContaining({ appointmentId: 'appointment-1', businessId: 'business-1' })
    )
    expect(mockedRetain).not.toHaveBeenCalled()
    expect(body.data.deposit).toMatchObject({ decision: 'REFUND', forced: true })
  })

  it('retains the deposit under the no-show policy', async () => {
    const response = await POST(request({ reason: 'NO_SHOW_POLICY', refundDeposit: true }), {
      params: Promise.resolve({ id: 'appointment-1' }),
    })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mockedRetain).toHaveBeenCalled()
    expect(mockedRefund).not.toHaveBeenCalled()
    expect(body.data.deposit).toMatchObject({ decision: 'RETAIN', forced: true })
  })

  it('keeps cancellation successful when Stripe refunding fails', async () => {
    mockedRefund.mockResolvedValue({
      status: 'FAILED',
      refundableAmount: 10,
      refundedAmount: 0,
      error: 'Stripe unavailable',
    })

    const response = await POST(request({ reason: 'BUSINESS_UNAVAILABLE' }), {
      params: Promise.resolve({ id: 'appointment-1' }),
    })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.appointment.status).toBe('CANCELLED')
    expect(body.data.deposit.status).toBe('FAILED')
  })
})
