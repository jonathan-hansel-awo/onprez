/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET as getBusinessById } from '@/app/api/business/[businessId]/route'
import { PUT as updateBusinessTheme } from '@/app/api/business/[businessId]/theme/route'
import { getCurrentUser } from '@/lib/auth/get-user'
import { requireBusinessAccess, requireBusinessRole } from '@/lib/auth/business-access'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/auth/get-user', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('@/lib/auth/business-access', () => {
  class BusinessAuthError extends Error {
    constructor(
      message: string,
      public status: number,
      public code: string
    ) {
      super(message)
    }
  }

  return {
    BusinessAuthError,
    requireBusinessAccess: jest.fn(),
    requireBusinessRole: jest.fn(),
    businessAuthErrorResponse: jest.fn((error: unknown) => {
      if (error instanceof BusinessAuthError) {
        return Response.json(
          {
            success: false,
            message: error.message,
          },
          { status: error.status }
        )
      }

      return undefined
    }),
  }
})

jest.mock('@/lib/prisma', () => ({
  prisma: {
    business: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

const mockedGetCurrentUser = getCurrentUser as jest.Mock
const mockedRequireBusinessAccess = requireBusinessAccess as jest.Mock
const mockedRequireBusinessRole = requireBusinessRole as jest.Mock

const mockedPrisma = prisma as unknown as {
  business: {
    findUnique: jest.Mock
    update: jest.Mock
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

describe('business [businessId] routes', () => {
  beforeEach(() => {
    jest.resetAllMocks()

    mockedGetCurrentUser.mockResolvedValue(authUser)
    mockedRequireBusinessAccess.mockResolvedValue(businessContext)
    mockedRequireBusinessRole.mockResolvedValue(businessContext)
  })

  it('GET /api/business/[businessId] returns 401 when unauthenticated', async () => {
    mockedGetCurrentUser.mockResolvedValue(null)

    const response = await getBusinessById(createRequest('/api/business/business-1'), {
      params: Promise.resolve({ businessId: 'business-1' }),
    })

    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.success).toBe(false)
    expect(mockedRequireBusinessAccess).not.toHaveBeenCalled()
  })

  it('GET /api/business/[businessId] requires access to the exact businessId', async () => {
    mockedPrisma.business.findUnique.mockResolvedValue({
      id: 'business-1',
      name: 'Business One',
      slug: 'business-one',
      category: 'Beauty',
      description: '',
      tagline: null,
      phone: null,
      email: null,
      address: null,
      city: null,
      state: null,
      zipCode: null,
      country: null,
      website: null,
      timezone: 'Europe/London',
      logoUrl: null,
      coverImageUrl: null,
      socialLinks: {},
      settings: {},
      branding: {},
      isPublished: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const response = await getBusinessById(createRequest('/api/business/business-1'), {
      params: Promise.resolve({ businessId: 'business-1' }),
    })

    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)

    expect(mockedRequireBusinessAccess).toHaveBeenCalledWith('user-1', 'business-1')
    expect(mockedPrisma.business.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'business-1' },
      })
    )
  })

  it('PUT /api/business/[businessId]/theme returns 401 when unauthenticated', async () => {
    mockedGetCurrentUser.mockResolvedValue(null)

    const response = await updateBusinessTheme(
      createRequest('/api/business/business-1/theme', {
        theme: {
          primaryColor: '#000000',
        },
      }),
      {
        params: Promise.resolve({ businessId: 'business-1' }),
      }
    )

    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.success).toBe(false)
    expect(mockedRequireBusinessRole).not.toHaveBeenCalled()
  })

  it('PUT /api/business/[businessId]/theme rejects missing theme payload', async () => {
    const response = await updateBusinessTheme(
      createRequest('/api/business/business-1/theme', {}),
      {
        params: Promise.resolve({ businessId: 'business-1' }),
      }
    )

    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.success).toBe(false)
    expect(mockedRequireBusinessRole).not.toHaveBeenCalled()
  })

  it('PUT /api/business/[businessId]/theme requires writable access to the exact businessId', async () => {
    mockedPrisma.business.findUnique.mockResolvedValue({
      id: 'business-1',
      name: 'Business One',
      slug: 'business-one',
      settings: {
        booking: {
          slotInterval: 30,
        },
      },
    })

    mockedPrisma.business.update.mockResolvedValue({
      id: 'business-1',
      name: 'Business One',
      slug: 'business-one',
      settings: {
        booking: {
          slotInterval: 30,
        },
        theme: {
          primaryColor: '#000000',
        },
      },
      updatedAt: new Date(),
    })

    const response = await updateBusinessTheme(
      createRequest('/api/business/business-1/theme', {
        theme: {
          primaryColor: '#000000',
        },
      }),
      {
        params: Promise.resolve({ businessId: 'business-1' }),
      }
    )

    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)

    expect(mockedRequireBusinessRole).toHaveBeenCalledWith('user-1', 'business-1', [
      'ADMIN',
      'MANAGER',
    ])

    expect(mockedPrisma.business.update).toHaveBeenCalledWith({
      where: { id: 'business-1' },
      data: {
        settings: {
          booking: {
            slotInterval: 30,
          },
          theme: {
            primaryColor: '#000000',
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        settings: true,
        updatedAt: true,
      },
    })
  })

  it('PUT /api/business/[businessId]/theme returns 404 when authorized business is missing', async () => {
    mockedPrisma.business.findUnique.mockResolvedValue(null)

    const response = await updateBusinessTheme(
      createRequest('/api/business/business-1/theme', {
        theme: {
          primaryColor: '#000000',
        },
      }),
      {
        params: Promise.resolve({ businessId: 'business-1' }),
      }
    )

    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.success).toBe(false)
    expect(mockedPrisma.business.update).not.toHaveBeenCalled()
  })
})
