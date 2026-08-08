/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/dashboard/bookings/month/route'
import { getCurrentUser } from '@/lib/auth/get-user'
import { resolveReadableBusinessContext } from '@/lib/auth/business-route-utils'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/auth/get-user', () => ({ getCurrentUser: jest.fn() }))
jest.mock('@/lib/auth/business-route-utils', () => ({ resolveReadableBusinessContext: jest.fn() }))
jest.mock('@/lib/auth/business-access', () => ({ businessAuthErrorResponse: jest.fn() }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    appointment: { findMany: jest.fn() },
    specialDate: { findMany: jest.fn() },
  },
}))

const mockedGetCurrentUser = getCurrentUser as jest.Mock
const mockedResolveReadableBusinessContext = resolveReadableBusinessContext as jest.Mock
const mockedPrisma = prisma as unknown as {
  appointment: { findMany: jest.Mock }
  specialDate: { findMany: jest.Mock }
}

describe('dashboard month calendar route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedGetCurrentUser.mockResolvedValue({ id: 'user-1' })
    mockedResolveReadableBusinessContext.mockResolvedValue({
      businessId: 'business-1',
      business: { timezone: 'Europe/London' },
    })
    mockedPrisma.appointment.findMany.mockResolvedValue([
      { startTime: new Date('2026-08-14T09:00:00.000Z'), status: 'CONFIRMED' },
      { startTime: new Date('2026-08-14T11:00:00.000Z'), status: 'PENDING' },
      { startTime: new Date('2026-08-17T09:00:00.000Z'), status: 'CONFIRMED' },
    ])
    mockedPrisma.specialDate.findMany.mockResolvedValue([
      {
        id: 'special-date-1',
        date: new Date('2025-08-15T00:00:00.000Z'),
        name: 'Annual closure',
        isClosed: true,
        openTime: null,
        closeTime: null,
        notes: null,
        isRecurring: true,
      },
    ])
  })

  it('returns booking counts and projects recurring closures into the requested month', async () => {
    const response = await GET(
      new NextRequest('http://localhost:3000/api/dashboard/bookings/month?month=2026-08')
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.bookingCounts).toEqual({
      '2026-08-14': 2,
      '2026-08-17': 1,
    })
    expect(json.data.specialDates[0]).toEqual(
      expect.objectContaining({ id: 'special-date-1', date: '2026-08-15', isClosed: true })
    )
    expect(mockedPrisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          businessId: 'business-1',
          status: { in: ['PENDING', 'CONFIRMED'] },
        }),
      })
    )
  })

  it('rejects an invalid month before querying the calendar', async () => {
    const response = await GET(
      new NextRequest('http://localhost:3000/api/dashboard/bookings/month?month=August')
    )

    expect(response.status).toBe(400)
    expect(mockedPrisma.appointment.findMany).not.toHaveBeenCalled()
  })
})
