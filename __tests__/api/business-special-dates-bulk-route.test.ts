/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/business/special-dates/bulk/route'
import { getCurrentUser } from '@/lib/auth/get-user'
import { resolveWritableBusinessContext } from '@/lib/auth/business-route-utils'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/auth/get-user', () => ({ getCurrentUser: jest.fn() }))
jest.mock('@/lib/auth/business-route-utils', () => ({ resolveWritableBusinessContext: jest.fn() }))
jest.mock('@/lib/auth/business-access', () => ({ businessAuthErrorResponse: jest.fn() }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    specialDate: {
      findMany: jest.fn(),
      createMany: jest.fn(),
    },
  },
}))

const mockedGetCurrentUser = getCurrentUser as jest.Mock
const mockedResolveWritableBusinessContext = resolveWritableBusinessContext as jest.Mock
const mockedPrisma = prisma as unknown as {
  specialDate: { findMany: jest.Mock; createMany: jest.Mock }
}

function request(body: unknown) {
  return new NextRequest('http://localhost:3000/api/business/special-dates/bulk', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('bulk special-date closure route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedGetCurrentUser.mockResolvedValue({ id: 'user-1' })
    mockedResolveWritableBusinessContext.mockResolvedValue({ businessId: 'business-1' })
    mockedPrisma.specialDate.findMany.mockResolvedValue([])
    mockedPrisma.specialDate.createMany.mockResolvedValue({ count: 3 })
  })

  it('creates all selected dates as non-recurring all-day closures', async () => {
    const response = await POST(
      request({
        dates: ['2026-08-14', '2026-08-15', '2026-08-17'],
        name: 'Time off',
        notes: null,
      })
    )
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.data.count).toBe(3)
    expect(mockedResolveWritableBusinessContext).toHaveBeenCalledWith('user-1', expect.anything())
    expect(mockedPrisma.specialDate.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          businessId: 'business-1',
          date: new Date('2026-08-14T00:00:00.000Z'),
          name: 'Time off',
          isClosed: true,
          isRecurring: false,
        }),
      ]),
    })
  })

  it('returns conflicting dates without creating a partial batch', async () => {
    mockedPrisma.specialDate.findMany.mockResolvedValue([
      { date: new Date('2026-08-15T00:00:00.000Z') },
    ])

    const response = await POST(request({ dates: ['2026-08-14', '2026-08-15'], name: 'Time off' }))
    const json = await response.json()

    expect(response.status).toBe(409)
    expect(json.data.conflictingDates).toEqual(['2026-08-15'])
    expect(mockedPrisma.specialDate.createMany).not.toHaveBeenCalled()
  })
})
