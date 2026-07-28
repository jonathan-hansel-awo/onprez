/** @jest-environment node */

import { AppointmentStatus } from '@prisma/client'
import { NextRequest } from 'next/server'

import { requireAppointmentRole } from '@/lib/auth/appointment-access'
import { getCurrentUser } from '@/lib/auth/get-user'
import { requestBookingDepositRefund } from '@/lib/booking-protection/operations'
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
}))
jest.mock('@/lib/observability/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}))

const mockedUser = getCurrentUser as jest.Mock
const mockedRole = requireAppointmentRole as jest.Mock
const mockedTransition = transitionAppointment as jest.Mock
const mockedRefund = requestBookingDepositRefund as jest.Mock

function request(decision: 'APPROVE' | 'REJECT') {
  return new NextRequest('https://onprez.test/api/dashboard/bookings/appointment-1/approval', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://onprez.test' },
    body: JSON.stringify({ decision }),
  })
}

describe('booking approval endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedUser.mockResolvedValue({ id: 'user-1', email: 'owner@example.com' })
    mockedRole.mockResolvedValue({
      appointment: {
        id: 'appointment-1',
        businessId: 'business-1',
        status: AppointmentStatus.PENDING,
        requiresDeposit: true,
        depositPaid: true,
        approvalExpiresAt: new Date(Date.now() + 3_600_000),
      },
    })
    mockedTransition.mockResolvedValue({
      appointment: { id: 'appointment-1', status: AppointmentStatus.CONFIRMED },
      notificationSent: true,
    })
  })

  it('approves a pending request without refunding', async () => {
    const response = await POST(request('APPROVE'), {
      params: Promise.resolve({ id: 'appointment-1' }),
    })

    expect(response.status).toBe(200)
    expect(mockedTransition).toHaveBeenCalledWith(
      expect.objectContaining({ toStatus: AppointmentStatus.CONFIRMED })
    )
    expect(mockedRefund).not.toHaveBeenCalled()
  })

  it('rejects a pending request and always requests its deposit refund', async () => {
    mockedTransition.mockResolvedValue({
      appointment: { id: 'appointment-1', status: AppointmentStatus.CANCELLED },
      notificationSent: true,
    })
    mockedRefund.mockResolvedValue({
      status: 'SUCCEEDED',
      refundableAmount: 10,
      refundedAmount: 10,
    })

    const response = await POST(request('REJECT'), {
      params: Promise.resolve({ id: 'appointment-1' }),
    })

    expect(response.status).toBe(200)
    expect(mockedTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        toStatus: AppointmentStatus.CANCELLED,
        reason: 'PROFESSIONAL_REJECTED',
      })
    )
    expect(mockedRefund).toHaveBeenCalledWith(
      expect.objectContaining({ appointmentId: 'appointment-1' })
    )
  })

  it('does not approve a deposit booking before Stripe confirms payment', async () => {
    mockedRole.mockResolvedValue({
      appointment: {
        id: 'appointment-1',
        businessId: 'business-1',
        status: AppointmentStatus.PENDING,
        requiresDeposit: true,
        depositPaid: false,
        approvalExpiresAt: new Date(Date.now() + 3_600_000),
      },
    })

    const response = await POST(request('APPROVE'), {
      params: Promise.resolve({ id: 'appointment-1' }),
    })

    expect(response.status).toBe(409)
    expect(mockedTransition).not.toHaveBeenCalled()
  })
})
