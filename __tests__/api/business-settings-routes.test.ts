/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET as getCurrentBusiness } from '@/app/api/business/current/route'
import {
  GET as getBusinessSettings,
  PUT as updateBusinessSettings,
} from '@/app/api/business/settings/route'
import {
  GET as getBusinessFeatures,
  PUT as updateBusinessFeatures,
} from '@/app/api/business/features/route'
import { GET as getBusinessHours, PUT as updateBusinessHours } from '@/app/api/business/hours/route'
import {
  GET as getBookingSettings,
  PUT as updateBookingSettings,
} from '@/app/api/business/settings/booking/route'
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
    businessHours: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
    securityLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

jest.mock('@/lib/validation/business', () => ({
  businessSettingsQuerySchema: {
    safeParse: jest.fn(() => ({ success: true, data: { section: 'all' } })),
  },
  updateBusinessSchema: {
    safeParse: jest.fn((body: unknown) => ({ success: true, data: body })),
  },
  bookingSettingsSchema: {
    safeParse: jest.fn((body: unknown) => ({ success: true, data: body })),
  },
}))

jest.mock('@/types/business', () => ({
  DEFAULT_BUSINESS_SETTINGS: {
    booking: {},
  },
}))

const mockedGetCurrentUser = getCurrentUser as jest.Mock
const mockedResolveReadableBusinessContext = resolveReadableBusinessContext as jest.Mock
const mockedResolveWritableBusinessContext = resolveWritableBusinessContext as jest.Mock

const mockedPrisma = prisma as unknown as {
  business: {
    findUnique: jest.Mock
    update: jest.Mock
  }
  businessHours: {
    deleteMany: jest.Mock
    createMany: jest.Mock
    findMany: jest.Mock
  }
  securityLog: {
    create: jest.Mock
  }
  $transaction: jest.Mock
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

describe('business settings routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockedGetCurrentUser.mockResolvedValue(authUser)
    mockedResolveReadableBusinessContext.mockResolvedValue(businessContext)
    mockedResolveWritableBusinessContext.mockResolvedValue(businessContext)
  })

  it('GET /api/business/current returns 401 when unauthenticated', async () => {
    mockedGetCurrentUser.mockResolvedValue(null)

    const response = await getCurrentBusiness()
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.success).toBe(false)
    expect(mockedResolveReadableBusinessContext).not.toHaveBeenCalled()
  })

  it('GET /api/business/current uses centralized readable business context', async () => {
    mockedPrisma.business.findUnique.mockResolvedValue({
      id: 'business-1',
      name: 'Business One',
      slug: 'business-one',
      category: 'Beauty',
      description: '',
      tagline: null,
      email: null,
      phone: null,
      website: null,
      address: null,
      city: null,
      state: null,
      zipCode: null,
      country: null,
      timezone: 'Europe/London',
      logoUrl: null,
      coverImageUrl: null,
      branding: {},
      socialLinks: {},
      settings: {},
      isPublished: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const response = await getCurrentBusiness()
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(mockedResolveReadableBusinessContext).toHaveBeenCalledWith('user-1')
    expect(mockedPrisma.business.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'business-1' },
      })
    )
  })

  it('GET /api/business/settings supports explicit businessId and requires access', async () => {
    mockedPrisma.business.findUnique.mockResolvedValue({
      id: 'business-2',
      name: 'Business Two',
      slug: 'business-two',
      category: 'Beauty',
      description: '',
      tagline: null,
      email: null,
      phone: null,
      website: null,
      address: null,
      city: null,
      state: null,
      zipCode: null,
      country: null,
      timezone: 'Europe/London',
      isPublished: false,
      branding: {},
      logoUrl: null,
      coverImageUrl: null,
      socialLinks: {},
      settings: {},
      businessHours: [],
    })

    const response = await getBusinessSettings(
      createRequest('/api/business/settings?businessId=business-2&section=all')
    )

    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(mockedResolveReadableBusinessContext).toHaveBeenCalledWith('user-1', 'business-2')
  })

  it('PUT /api/business/settings requires writable business context', async () => {
    mockedPrisma.business.findUnique.mockResolvedValue({
      id: 'business-1',
      settings: {},
      socialLinks: {},
      branding: {},
    })

    mockedPrisma.business.update.mockResolvedValue({
      id: 'business-1',
      name: 'Updated Business',
      slug: 'business-one',
      settings: {},
    })

    mockedPrisma.securityLog.create.mockResolvedValue({})

    const response = await updateBusinessSettings(
      createRequest('/api/business/settings', {
        businessId: 'business-1',
        profile: {
          name: 'Updated Business',
        },
      })
    )

    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(mockedResolveWritableBusinessContext).toHaveBeenCalledWith('user-1', 'business-1')
    expect(mockedPrisma.business.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'business-1' },
      })
    )
  })

  it('GET /api/business/features uses readable business context', async () => {
    mockedPrisma.business.findUnique.mockResolvedValue({
      id: 'business-1',
      settings: {
        faqEnabled: true,
        inquiryEnabled: true,
      },
    })

    const response = await getBusinessFeatures(
      createRequest('/api/business/features?businessId=business-1')
    )

    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(mockedResolveReadableBusinessContext).toHaveBeenCalledWith('user-1', 'business-1')
  })

  it('PUT /api/business/features requires writable business context', async () => {
    mockedPrisma.business.findUnique.mockResolvedValue({
      id: 'business-1',
      settings: {},
    })

    mockedPrisma.business.update.mockResolvedValue({})

    const response = await updateBusinessFeatures(
      createRequest('/api/business/features', {
        businessId: 'business-1',
        faqEnabled: true,
        inquiryEnabled: true,
        inquiryNotificationEmail: null,
        inquiryAutoReply: null,
      })
    )

    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(mockedResolveWritableBusinessContext).toHaveBeenCalledWith('user-1', 'business-1')
  })

  it('PUT /api/business/hours updates only the authorized business hours in a transaction', async () => {
    mockedPrisma.businessHours.deleteMany.mockReturnValue('delete-hours')
    mockedPrisma.businessHours.createMany.mockReturnValue('create-hours')
    mockedPrisma.$transaction.mockResolvedValue([])
    mockedPrisma.businessHours.findMany.mockResolvedValue([])

    const hours = Array.from({ length: 7 }, (_, dayOfWeek) => ({
      dayOfWeek,
      openTime: '09:00',
      closeTime: '17:00',
      isClosed: false,
      notes: null,
    }))

    const response = await updateBusinessHours(
      createRequest('/api/business/hours', {
        businessId: 'business-1',
        hours,
      })
    )

    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(mockedResolveWritableBusinessContext).toHaveBeenCalledWith('user-1', 'business-1')

    expect(mockedPrisma.businessHours.deleteMany).toHaveBeenCalledWith({
      where: { businessId: 'business-1' },
    })

    expect(mockedPrisma.$transaction).toHaveBeenCalledWith(['delete-hours', 'create-hours'])
  })

  it('GET /api/business/settings/booking no longer uses raw verifyToken path and uses readable context', async () => {
    mockedPrisma.business.findUnique.mockResolvedValue({
      id: 'business-1',
      name: 'Business One',
      settings: {
        booking: {
          slotInterval: 30,
        },
      },
    })

    const response = await getBookingSettings(
      createRequest('/api/business/settings/booking?businessId=business-1')
    )

    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.settings.slotInterval).toBe(30)
    expect(mockedResolveReadableBusinessContext).toHaveBeenCalledWith('user-1', 'business-1')
  })

  it('PUT /api/business/settings/booking requires writable context', async () => {
    mockedPrisma.business.findUnique.mockResolvedValue({
      id: 'business-1',
      name: 'Business One',
      settings: {
        booking: {},
      },
    })

    mockedPrisma.business.update.mockResolvedValue({
      id: 'business-1',
      name: 'Business One',
      settings: {
        booking: {
          slotInterval: 30,
        },
      },
    })

    const response = await updateBookingSettings(
      createRequest('/api/business/settings/booking', {
        businessId: 'business-1',
        slotInterval: 30,
      })
    )

    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(mockedResolveWritableBusinessContext).toHaveBeenCalledWith('user-1', 'business-1')
  })
})
