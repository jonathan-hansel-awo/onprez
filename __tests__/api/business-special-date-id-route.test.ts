/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import {
  GET as getSpecialDate,
  PUT as updateSpecialDate,
  DELETE as deleteSpecialDate,
} from '@/app/api/business/special-dates/[id]/route'
import { getCurrentUser } from '@/lib/auth/get-user'
import { requireBusinessAccess, requireBusinessRole } from '@/lib/auth/business-access'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/auth/get-user', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('@/lib/auth/business-access', () => ({
  requireBusinessAccess: jest.fn(),
  requireBusinessRole: jest.fn(),
  businessAuthErrorResponse: jest.fn(() => undefined),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    specialDate: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}))

jest.mock('@/lib/validation/business', () => ({
  specialDateSchema: {
    partial: jest.fn(() => ({
      safeParse: jest.fn((body: unknown) => ({ success: true, data: body })),
    })),
  },
}))

const mockedGetCurrentUser = getCurrentUser as jest.Mock
const mockedRequireBusinessAccess = requireBusinessAccess as jest.Mock
const mockedRequireBusinessRole = requireBusinessRole as jest.Mock

const mockedPrisma = prisma as unknown as {
  specialDate: {
    findUnique: jest.Mock
    findFirst: jest.Mock
    update: jest.Mock
    deleteMany: jest.Mock
  }
}

function createRequest(
  path: string,
  body?: unknown,
  init?: ConstructorParameters<typeof NextRequest>[1]
) {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: body === undefined ? 'GET' : 'PUT',
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

const existingSpecialDate = {
  id: 'special-date-1',
  businessId: 'business-1',
  date: new Date('2026-12-25T00:00:00.000Z'),
}

describe('business special date [id] route', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockedGetCurrentUser.mockResolvedValue(authUser)
    mockedRequireBusinessAccess.mockResolvedValue({})
    mockedRequireBusinessRole.mockResolvedValue({})
  })

  it('GET returns 401 when unauthenticated', async () => {
    mockedGetCurrentUser.mockResolvedValue(null)

    const response = await getSpecialDate(
      createRequest('/api/business/special-dates/special-date-1'),
      {
        params: Promise.resolve({ id: 'special-date-1' }),
      }
    )

    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.success).toBe(false)
    expect(mockedRequireBusinessAccess).not.toHaveBeenCalled()
  })

  it('GET requires business access for the special date business', async () => {
    mockedPrisma.specialDate.findUnique.mockResolvedValue(existingSpecialDate)

    mockedPrisma.specialDate.findFirst.mockResolvedValue({
      ...existingSpecialDate,
      name: 'Christmas Day',
      isClosed: true,
      openTime: null,
      closeTime: null,
      notes: null,
      isRecurring: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const response = await getSpecialDate(
      createRequest('/api/business/special-dates/special-date-1'),
      {
        params: Promise.resolve({ id: 'special-date-1' }),
      }
    )

    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)

    expect(mockedRequireBusinessAccess).toHaveBeenCalledWith('user-1', 'business-1')
    expect(mockedPrisma.specialDate.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'special-date-1',
          businessId: 'business-1',
        },
      })
    )
  })

  it('PUT requires writable business role for the special date business', async () => {
    mockedPrisma.specialDate.findUnique
      .mockResolvedValueOnce(existingSpecialDate)
      .mockResolvedValueOnce(null)

    mockedPrisma.specialDate.update.mockResolvedValue({
      ...existingSpecialDate,
      name: 'Boxing Day',
      isClosed: true,
      openTime: null,
      closeTime: null,
      notes: null,
      isRecurring: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const response = await updateSpecialDate(
      createRequest('/api/business/special-dates/special-date-1', {
        name: 'Boxing Day',
        isClosed: true,
      }),
      {
        params: Promise.resolve({ id: 'special-date-1' }),
      }
    )

    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)

    expect(mockedRequireBusinessRole).toHaveBeenCalledWith('user-1', 'business-1', [
      'ADMIN',
      'MANAGER',
    ])

    expect(mockedPrisma.specialDate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'special-date-1' },
      })
    )
  })

  it('PUT returns 409 when changing to a conflicting date', async () => {
    mockedPrisma.specialDate.findUnique
      .mockResolvedValueOnce(existingSpecialDate)
      .mockResolvedValueOnce({ id: 'other-special-date' })

    const response = await updateSpecialDate(
      createRequest('/api/business/special-dates/special-date-1', {
        date: '2026-12-26',
      }),
      {
        params: Promise.resolve({ id: 'special-date-1' }),
      }
    )

    const json = await response.json()

    expect(response.status).toBe(409)
    expect(json.success).toBe(false)
    expect(mockedPrisma.specialDate.update).not.toHaveBeenCalled()
  })

  it('DELETE requires writable business role and deletes only the scoped special date', async () => {
    mockedPrisma.specialDate.findUnique.mockResolvedValue(existingSpecialDate)
    mockedPrisma.specialDate.deleteMany.mockResolvedValue({ count: 1 })

    const response = await deleteSpecialDate(
      createRequest('/api/business/special-dates/special-date-1', undefined, {
        method: 'DELETE',
      }),
      {
        params: Promise.resolve({ id: 'special-date-1' }),
      }
    )

    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)

    expect(mockedRequireBusinessRole).toHaveBeenCalledWith('user-1', 'business-1', [
      'ADMIN',
      'MANAGER',
    ])

    expect(mockedPrisma.specialDate.deleteMany).toHaveBeenCalledWith({
      where: {
        id: 'special-date-1',
        businessId: 'business-1',
      },
    })
  })

  it('DELETE returns 404 when scoped delete does not affect a row', async () => {
    mockedPrisma.specialDate.findUnique.mockResolvedValue(existingSpecialDate)
    mockedPrisma.specialDate.deleteMany.mockResolvedValue({ count: 0 })

    const response = await deleteSpecialDate(
      createRequest('/api/business/special-dates/special-date-1', undefined, {
        method: 'DELETE',
      }),
      {
        params: Promise.resolve({ id: 'special-date-1' }),
      }
    )

    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.success).toBe(false)
  })
})
