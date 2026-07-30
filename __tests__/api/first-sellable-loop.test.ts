/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/dashboard/first-sellable-loop/route'
import { getCurrentUser } from '@/lib/auth/get-user'
import { resolveReadableBusinessContext } from '@/lib/auth/business-route-utils'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/auth/get-user', () => ({ getCurrentUser: jest.fn() }))
jest.mock('@/lib/auth/business-route-utils', () => ({
  resolveReadableBusinessContext: jest.fn(),
}))
jest.mock('@/lib/auth/business-access', () => ({
  businessAuthErrorResponse: jest.fn(() => undefined),
}))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    business: {
      findUnique: jest.fn(),
    },
  },
}))

const mockedGetCurrentUser = getCurrentUser as jest.Mock
const mockedResolveReadableBusinessContext = resolveReadableBusinessContext as jest.Mock
const mockedBusiness = prisma.business as unknown as {
  findUnique: jest.Mock
}

const user = { id: 'user-1', email: 'owner@example.com' }
const context = { businessId: 'business-1', role: 'OWNER', isOwner: true }

function request() {
  return new NextRequest('http://localhost:3000/api/dashboard/first-sellable-loop')
}

describe('first sellable loop analytics API', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockedGetCurrentUser.mockResolvedValue(user)
    mockedResolveReadableBusinessContext.mockResolvedValue(context)
  })

  it('rejects unauthenticated requests before resolving a business', async () => {
    mockedGetCurrentUser.mockResolvedValue(null)

    const response = await GET(request())

    expect(response.status).toBe(401)
    expect(mockedResolveReadableBusinessContext).not.toHaveBeenCalled()
    expect(mockedBusiness.findUnique).not.toHaveBeenCalled()
  })

  it('returns tenant-scoped completion analytics for every loop milestone', async () => {
    mockedBusiness.findUnique.mockResolvedValue({
      createdAt: new Date('2026-07-30T10:00:00.000Z'),
      publishedAt: new Date('2026-07-30T10:03:00.000Z'),
      settings: {
        onboarding: {
          sharedAt: '2026-07-30T10:03:30.000Z',
        },
      },
      services: [{ createdAt: new Date('2026-07-30T10:01:00.000Z') }],
      businessHours: [{ createdAt: new Date('2026-07-30T10:02:00.000Z') }],
      pages: [
        {
          createdAt: new Date('2026-07-30T10:02:30.000Z'),
          publishedAt: new Date('2026-07-30T10:03:00.000Z'),
        },
      ],
      appointments: [{ createdAt: new Date('2026-07-30T10:06:00.000Z') }],
      appointmentTransitions: [{ changedAt: new Date('2026-07-30T10:08:30.000Z') }],
    })

    const response = await GET(request())
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(mockedResolveReadableBusinessContext).toHaveBeenCalledWith(
      'user-1',
      expect.any(NextRequest)
    )
    expect(mockedBusiness.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'business-1' } })
    )
    expect(result.data.firstSellableLoop).toMatchObject({
      completedCount: 7,
      totalCount: 7,
      percent: 100,
      isComplete: true,
      elapsedSeconds: 510,
      withinTarget: true,
    })
    expect(result.data.firstSellableLoop.steps).toHaveLength(7)
    expect(result.data.firstSellableLoop.steps[6]).toMatchObject({
      id: 'manage-booking',
      eventName: 'first_sellable_loop.manage_booking.completed',
      status: 'completed',
    })
  })

  it('does not treat an automatic booking state as owner management', async () => {
    mockedBusiness.findUnique.mockResolvedValue({
      createdAt: new Date('2026-07-30T10:00:00.000Z'),
      publishedAt: new Date('2026-07-30T10:03:00.000Z'),
      settings: { onboarding: { sharedAt: '2026-07-30T10:03:30.000Z' } },
      services: [{ createdAt: new Date('2026-07-30T10:01:00.000Z') }],
      businessHours: [{ createdAt: new Date('2026-07-30T10:02:00.000Z') }],
      pages: [],
      appointments: [{ createdAt: new Date('2026-07-30T10:06:00.000Z') }],
      appointmentTransitions: [],
    })

    const response = await GET(request())
    const result = await response.json()

    expect(result.data.firstSellableLoop.isComplete).toBe(false)
    expect(result.data.firstSellableLoop.nextStep.id).toBe('manage-booking')
  })
})
