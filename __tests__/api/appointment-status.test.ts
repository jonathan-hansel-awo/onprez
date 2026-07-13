/** @jest-environment node */

import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { requireAppointmentRole } from '@/lib/auth/appointment-access'
import { AppointmentTransitionError, transitionAppointment } from '@/lib/services/appointment-state'
import { PATCH } from '@/app/api/dashboard/bookings/[id]/status/route'

jest.mock('@/lib/auth/get-user', () => ({ getCurrentUser: jest.fn() }))
jest.mock('@/lib/auth/appointment-access', () => ({ requireAppointmentRole: jest.fn() }))
jest.mock('@/lib/auth/business-access', () => ({
  businessAuthErrorResponse: jest.fn(() => undefined),
}))
jest.mock('@/lib/services/appointment-state', () => {
  class MockTransitionError extends Error {
    constructor(
      message: string,
      public code: 'NOT_FOUND' | 'INVALID_TRANSITION' | 'CONCURRENT_UPDATE'
    ) {
      super(message)
      this.name = 'AppointmentTransitionError'
    }
  }

  return {
    transitionAppointment: jest.fn(),
    AppointmentTransitionError: MockTransitionError,
  }
})

const mockedGetCurrentUser = getCurrentUser as jest.Mock
const mockedRequireAppointmentRole = requireAppointmentRole as jest.Mock
const mockedTransitionAppointment = transitionAppointment as jest.Mock

function request(body: unknown) {
  return new NextRequest('http://localhost/api/dashboard/bookings/appointment-1/status', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

describe('appointment status endpoint', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockedGetCurrentUser.mockResolvedValue({ id: 'user-1', email: 'owner@example.com' })
    mockedRequireAppointmentRole.mockResolvedValue({
      appointment: { id: 'appointment-1', businessId: 'business-1' },
    })
  })

  it('delegates mutations and customer notification to the state service', async () => {
    mockedTransitionAppointment.mockResolvedValue({
      appointment: {
        id: 'appointment-1',
        status: 'CONFIRMED',
        previousStatus: 'PENDING',
        confirmedAt: new Date(),
        completedAt: null,
        cancelledAt: null,
        service: { id: 'service-1', name: 'Consultation' },
        customer: { id: 'customer-1', name: 'Alex' },
      },
      notificationSent: true,
    })

    const response = await PATCH(
      request({ status: 'CONFIRMED', reason: 'Approved', notifyCustomer: true }),
      { params: Promise.resolve({ id: 'appointment-1' }) }
    )

    expect(response.status).toBe(200)
    expect(mockedTransitionAppointment).toHaveBeenCalledWith({
      appointmentId: 'appointment-1',
      businessId: 'business-1',
      toStatus: 'CONFIRMED',
      changedBy: 'user-1',
      changedByType: 'USER',
      reason: 'Approved',
      notes: undefined,
      cancellationSource: 'BUSINESS',
      notifyCustomer: true,
    })
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: { status: 'CONFIRMED', previousStatus: 'PENDING', notificationSent: true },
    })
  })

  it('returns a client error for an invalid terminal-state transition', async () => {
    mockedTransitionAppointment.mockRejectedValue(
      new AppointmentTransitionError(
        'Cannot change status from COMPLETED to PENDING',
        'INVALID_TRANSITION'
      )
    )

    const response = await PATCH(request({ status: 'PENDING' }), {
      params: Promise.resolve({ id: 'appointment-1' }),
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: 'Cannot change status from COMPLETED to PENDING',
    })
  })
})
