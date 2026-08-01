/** @jest-environment node */

import { NextRequest } from 'next/server'
import { DataLifecycleRequestStatus } from '@prisma/client'
import { getCurrentUser } from '@/lib/auth/get-user'
import { recordLifecycleAction } from '@/lib/data-lifecycle/audit'
import {
  enforceLifecycleRateLimit,
  verifyLifecyclePassword,
} from '@/lib/data-lifecycle/verification'
import { prisma } from '@/lib/prisma'
import { DELETE, GET, POST } from '../route'

jest.mock('@/lib/auth/get-user', () => ({ getCurrentUser: jest.fn() }))
jest.mock('@/lib/data-lifecycle/audit', () => ({ recordLifecycleAction: jest.fn() }))
jest.mock('@/lib/data-lifecycle/verification', () => ({
  enforceLifecycleRateLimit: jest.fn(),
  verifyLifecyclePassword: jest.fn(),
}))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    dataLifecycleRequest: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    business: { findMany: jest.fn() },
    appointment: { count: jest.fn() },
    bookingPayment: { count: jest.fn() },
  },
}))

const mockedUser = getCurrentUser as jest.Mock
const mockedRateLimit = enforceLifecycleRateLimit as jest.Mock
const mockedPassword = verifyLifecyclePassword as jest.Mock
const mockedAudit = recordLifecycleAction as jest.Mock
const mockedFindRequest = prisma.dataLifecycleRequest.findFirst as jest.Mock
const mockedCreateRequest = prisma.dataLifecycleRequest.create as jest.Mock
const mockedUpdateRequest = prisma.dataLifecycleRequest.update as jest.Mock
const mockedFindBusinesses = prisma.business.findMany as jest.Mock
const mockedAppointmentCount = prisma.appointment.count as jest.Mock
const mockedPaymentCount = prisma.bookingPayment.count as jest.Mock

function request(method: 'POST' | 'DELETE', password = 'correct-password') {
  return new NextRequest('https://onprez.test/api/account/deletion-request', {
    method,
    headers: { 'content-type': 'application/json', origin: 'https://onprez.test' },
    body: JSON.stringify({ password }),
  })
}

const createdRequest = {
  id: 'request-1',
  status: DataLifecycleRequestStatus.REVIEW_REQUIRED,
  scheduledFor: new Date('2026-08-15T12:00:00.000Z'),
  holdReason: 'Owned records require review.',
  requestedAt: new Date('2026-08-01T12:00:00.000Z'),
  cancelledAt: null,
}

describe('account deletion request API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
    mockedUser.mockResolvedValue({ id: 'user-1' })
    mockedRateLimit.mockResolvedValue(null)
    mockedPassword.mockResolvedValue(true)
    mockedFindRequest.mockResolvedValue(null)
    mockedFindBusinesses.mockResolvedValue([{ id: 'business-1' }])
    mockedAppointmentCount.mockResolvedValue(2)
    mockedPaymentCount.mockResolvedValue(3)
    mockedCreateRequest.mockResolvedValue(createdRequest)
    mockedUpdateRequest.mockResolvedValue({})
    mockedAudit.mockResolvedValue(undefined)
  })

  it('returns the latest request and owner-exportable businesses without caching', async () => {
    mockedFindRequest.mockResolvedValue(createdRequest)
    mockedFindBusinesses.mockResolvedValue([{ id: 'business-1', name: 'Aurelia', slug: 'aurelia' }])

    const response = await GET()
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toContain('no-store')
    expect(payload.data.deletionRequest.canCancel).toBe(true)
    expect(payload.data.ownedBusinesses).toHaveLength(1)
  })

  it('requires current-password verification before creating a request', async () => {
    mockedPassword.mockResolvedValue(false)

    const response = await POST(request('POST', 'wrong-password'))

    expect(response.status).toBe(401)
    expect(mockedCreateRequest).not.toHaveBeenCalled()
    expect(mockedAudit).not.toHaveBeenCalled()
  })

  it('places owned business, future booking, and payment records into retention review', async () => {
    const response = await POST(request('POST'))

    expect(response.status).toBe(201)
    expect(mockedCreateRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: DataLifecycleRequestStatus.REVIEW_REQUIRED,
          requestedByUserId: 'user-1',
          subjectUserId: 'user-1',
          holdReason: expect.stringContaining('retention and ownership review'),
          metadata: expect.objectContaining({
            ownedBusinessCount: 1,
            futureBookingCount: 2,
            retainedPaymentCount: 3,
          }),
        }),
      })
    )
    expect(mockedAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'account_deletion_requested', userId: 'user-1' })
    )
  })

  it('does not create a second active account deletion request', async () => {
    mockedFindRequest.mockResolvedValue(createdRequest)

    const response = await POST(request('POST'))

    expect(response.status).toBe(409)
    expect(mockedCreateRequest).not.toHaveBeenCalled()
  })

  it('allows a password-verified active request to be cancelled', async () => {
    mockedFindRequest.mockResolvedValue(createdRequest)

    const response = await DELETE(request('DELETE'))

    expect(response.status).toBe(200)
    expect(mockedUpdateRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'request-1' },
        data: expect.objectContaining({ status: DataLifecycleRequestStatus.CANCELLED }),
      })
    )
    expect(mockedAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'account_deletion_cancelled' })
    )
  })
})
