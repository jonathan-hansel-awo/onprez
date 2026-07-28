/** @jest-environment node */

import { NextRequest } from 'next/server'

import { requireAppointmentRole } from '@/lib/auth/appointment-access'
import { getCurrentUser } from '@/lib/auth/get-user'
import { transitionAppointment } from '@/lib/services/appointment-state'
import { PATCH } from '../route'

jest.mock('@/lib/auth/get-user', () => ({ getCurrentUser: jest.fn() }))
jest.mock('@/lib/auth/appointment-access', () => ({ requireAppointmentRole: jest.fn() }))
jest.mock('@/lib/auth/business-access', () => ({ businessAuthErrorResponse: jest.fn() }))
jest.mock('@/lib/services/appointment-state', () => ({
  AppointmentTransitionError: class AppointmentTransitionError extends Error {},
  transitionAppointment: jest.fn(),
}))
jest.mock('@/lib/api/error-response', () => ({ logApiError: jest.fn() }))
jest.mock('@/lib/observability/logger', () => ({
  withRequestLogging: (_request: NextRequest, handler: () => unknown) => handler(),
}))

describe('booking status endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' })
    ;(requireAppointmentRole as jest.Mock).mockResolvedValue({
      appointment: {
        id: 'appointment-1',
        businessId: 'business-1',
        status: 'PENDING',
        approvalExpiresAt: null,
      },
    })
  })

  it('cannot bypass deposit refund rules by setting CANCELLED directly', async () => {
    const response = await PATCH(
      new NextRequest('https://onprez.test/api/dashboard/bookings/appointment-1/status', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      }),
      { params: Promise.resolve({ id: 'appointment-1' }) }
    )

    expect(response.status).toBe(400)
    expect(transitionAppointment).not.toHaveBeenCalled()
  })

  it('cannot bypass the approval deadline or deposit checks by confirming directly', async () => {
    ;(requireAppointmentRole as jest.Mock).mockResolvedValue({
      appointment: {
        id: 'appointment-1',
        businessId: 'business-1',
        status: 'PENDING',
        approvalExpiresAt: new Date(Date.now() + 3_600_000),
      },
    })

    const response = await PATCH(
      new NextRequest('https://onprez.test/api/dashboard/bookings/appointment-1/status', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMED' }),
      }),
      { params: Promise.resolve({ id: 'appointment-1' }) }
    )

    expect(response.status).toBe(400)
    expect(transitionAppointment).not.toHaveBeenCalled()
  })
})
