/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import {
  GET as getSpecialDates,
  POST as createSpecialDate,
} from '@/app/api/business/special-dates/route'
import { getCurrentUser } from '@/lib/auth/get-user'
import {
  resolveReadableBusinessContext,
  resolveWritableBusinessContext,
} from '@/lib/auth/business-route-utils'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/auth/get-user', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('@/lib/auth/business-route-utils', () => ({
  resolveReadableBusinessContext: jest.fn(),
  resolveWritableBusinessContext: jest.fn(),
}))

jest.mock('@/lib/auth/business-access', () => ({
  businessAuthErrorResponse: jest.fn(() => undefined),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    specialDate: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/validation/business', () => ({
  createSpecialDateSchema: {
    safeParse: jest.fn((body: unknown) => ({ success: true, data: body })),
  },
}))

const mockedGetCurrentUser = getCurrentUser as jest.Mock
const mockedResolveReadableBusinessContext = resolveReadableBusinessContext as jest.Mock
const mockedResolveWritableBusinessContext = resolveWritableBusinessContext as jest.Mock

const mockedPrisma = prisma as unknown as {
  specialDate: {
    findMany: jest.Mock
    findUnique: jest.Mock
    create: jest.Mock
  }
}

function createRequest(
  path: string,
  body?: unknown,
  init?: ConstructorParameters<typeof NextRequest>[1]
) {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      'user-agent': 'test-agent',
      'x-forwarded-for': '127.0.0.1',
      ...(init?.headers || {}),
    },
    ...init,
  })
}

const authUser = {
  id: 'user-1',
  email: 'user@example.com',
  emailVerified: true,
  mfaEnabled: false,
  role: 'USER',
}

const businessContext = {
  userId: 'user-1',
  businessId: 'business-1',
  role: 'OWNER',
  isOwner: true,
  business: {
    id: 'business-1',
    name: 'Business One',
    slug: 'business-one',
    ownerId: 'user-1',
    settings: {},
  },
}

describe('business special dates routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockedGetCurrentUser.mockResolvedValue(authUser)
    mockedResolveReadableBusinessContext.mockResolvedValue(businessContext)
    mockedResolveWritableBusinessContext.mockResolvedValue(businessContext)
  })

  it('GET /api/business/special-dates returns 401 when unauthenticated', async () => {
    mockedGetCurrentUser.mockResolvedValue(null)

    const response = await getSpecialDates(createRequest('/api/business/special-dates'))
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.success).toBe(false)
    expect(mockedResolveReadableBusinessContext).not.toHaveBeenCalled()
  })

  it('GET /api/business/special-dates uses readable business context', async () => {
    mockedPrisma.specialDate.findMany.mockResolvedValue([])

    const response = await getSpecialDates(
      createRequest('/api/business/special-dates?businessId=business-1&upcoming=true')
    )

    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(mockedResolveReadableBusinessContext).toHaveBeenCalledWith('user-1', 'business-1')

    expect(mockedPrisma.specialDate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          businessId: 'business-1',
          date: expect.objectContaining({
            gte: expect.any(Date),
          }),
        }),
      })
    )
  })

  it('GET /api/business/special-dates rejects invalid year', async () => {
    const response = await getSpecialDates(
      createRequest('/api/business/special-dates?year=not-a-year')
    )

    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.success).toBe(false)
    expect(mockedPrisma.specialDate.findMany).not.toHaveBeenCalled()
  })

  it('POST /api/business/special-dates requires writable business context', async () => {
    mockedPrisma.specialDate.findUnique.mockResolvedValue(null)
    mockedPrisma.specialDate.create.mockResolvedValue({
      id: 'special-date-1',
      businessId: 'business-1',
      date: new Date('2026-12-25'),
      name: 'Christmas Day',
      isClosed: true,
      openTime: null,
      closeTime: null,
      notes: null,
      isRecurring: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const response = await createSpecialDate(
      createRequest('/api/business/special-dates', {
        businessId: 'business-1',
        date: '2026-12-25',
        name: 'Christmas Day',
        isClosed: true,
        openTime: null,
        closeTime: null,
        notes: null,
        isRecurring: true,
      })
    )

    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.success).toBe(true)
    expect(mockedResolveWritableBusinessContext).toHaveBeenCalledWith('user-1', 'business-1')

    expect(mockedPrisma.specialDate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          businessId: 'business-1',
          name: 'Christmas Day',
          isClosed: true,
          openTime: null,
          closeTime: null,
        }),
      })
    )
  })

  it('POST /api/business/special-dates returns 409 for duplicate special date', async () => {
    mockedPrisma.specialDate.findUnique.mockResolvedValue({
      id: 'existing-special-date',
    })

    const response = await createSpecialDate(
      createRequest('/api/business/special-dates', {
        businessId: 'business-1',
        date: '2026-12-25',
        name: 'Christmas Day',
        isClosed: true,
        openTime: null,
        closeTime: null,
        notes: null,
        isRecurring: true,
      })
    )

    const json = await response.json()

    expect(response.status).toBe(409)
    expect(json.success).toBe(false)
    expect(mockedPrisma.specialDate.create).not.toHaveBeenCalled()
  })
})
