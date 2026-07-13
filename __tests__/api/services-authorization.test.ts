/** @jest-environment node */

import { NextRequest } from 'next/server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { requireBusinessAccess, requireBusinessRole } from '@/lib/auth/business-access'
import {
  requireServiceAccess,
  requireServiceRole,
  requireServiceVariantRole,
} from '@/lib/auth/service-access'

import { GET as listServicesGET, POST as createServicePOST } from '@/app/api/services/route'
import {
  GET as serviceGET,
  PUT as servicePUT,
  DELETE as serviceDELETE,
} from '@/app/api/services/[id]/route'
import { PATCH as toggleServicePATCH } from '@/app/api/services/[id]/toggle/route'
import { GET as serviceStatsGET } from '@/app/api/services/stats/route'
import { POST as bulkServicesPOST } from '@/app/api/services/bulk/route'
import { PUT as reorderServicesPUT } from '@/app/api/services/reorder/route'
import { POST as duplicateServicePOST } from '@/app/api/services/[id]/duplicate/route'
import {
  GET as serviceVariantsGET,
  POST as serviceVariantsPOST,
} from '@/app/api/services/[id]/variants/route'
import {
  PUT as serviceVariantPUT,
  DELETE as serviceVariantDELETE,
} from '@/app/api/services/[id]/variants/[variantId]/route'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    business: {
      findFirst: jest.fn(),
    },
    service: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    serviceCategory: {
      findFirst: jest.fn(),
    },
    serviceVariant: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    appointment: {
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

jest.mock('@/lib/auth/get-user', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('@/lib/auth/business-access', () => ({
  requireBusinessAccess: jest.fn(),
  requireBusinessRole: jest.fn(),
  businessAuthErrorResponse: jest.fn(() => undefined),
  BusinessAuthError: class BusinessAuthError extends Error {
    constructor(
      message: string,
      public status: number,
      public code: string
    ) {
      super(message)
      this.name = 'BusinessAuthError'
    }
  },
}))

jest.mock('@/lib/auth/service-access', () => ({
  requireServiceAccess: jest.fn(),
  requireServiceRole: jest.fn(),
  requireServiceVariantRole: jest.fn(),
}))

const mockedPrisma = prisma as unknown as {
  business: {
    findFirst: jest.Mock
  }
  service: {
    findMany: jest.Mock
    findFirst: jest.Mock
    create: jest.Mock
    update: jest.Mock
    updateMany: jest.Mock
    deleteMany: jest.Mock
    count: jest.Mock
  }
  serviceVariant: {
    findMany: jest.Mock
    findFirst: jest.Mock
    create: jest.Mock
    createMany: jest.Mock
    updateMany: jest.Mock
    update: jest.Mock
    deleteMany: jest.Mock
  }
  serviceCategory: {
    findFirst: jest.Mock
  }
  appointment: {
    count: jest.Mock
    aggregate: jest.Mock
    groupBy: jest.Mock
  }
  $transaction: jest.Mock
}

const mockedGetCurrentUser = getCurrentUser as jest.Mock
const mockedRequireBusinessAccess = requireBusinessAccess as jest.Mock
const mockedRequireBusinessRole = requireBusinessRole as jest.Mock
const mockedRequireServiceAccess = requireServiceAccess as jest.Mock
const mockedRequireServiceRole = requireServiceRole as jest.Mock
const mockedRequireServiceVariantRole = requireServiceVariantRole as jest.Mock

function createRequest(path: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(`http://localhost:3000${path}`, init)
}

function jsonRequest(path: string, body: unknown, method = 'POST') {
  return createRequest(path, {
    method,
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
    },
  })
}

const authUser = {
  id: 'user-1',
  email: 'owner@example.com',
  role: 'USER',
  emailVerified: true,
  mfaEnabled: false,
}

describe('services API authorization', () => {
  beforeEach(() => {
    jest.resetAllMocks()

    mockedGetCurrentUser.mockResolvedValue(authUser)
  })

  describe('GET /api/services', () => {
    it('allows public active service listing without auth', async () => {
      mockedPrisma.business.findFirst.mockResolvedValue({ id: 'business-1' })
      mockedPrisma.service.findMany.mockResolvedValue([
        {
          id: 'service-1',
          name: 'Haircut',
          price: 25,
          priceRangeMin: null,
          priceRangeMax: null,
          depositAmount: null,
        },
      ])

      const response = await listServicesGET(createRequest('/api/services?slug=test-business'))
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
      expect(mockedGetCurrentUser).not.toHaveBeenCalled()
      expect(mockedRequireBusinessAccess).not.toHaveBeenCalled()

      expect(mockedPrisma.service.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            businessId: 'business-1',
            active: true,
          },
        })
      )
    })

    it('requires business access before listing inactive services', async () => {
      mockedPrisma.business.findFirst.mockResolvedValue({ id: 'business-1' })
      mockedRequireBusinessAccess.mockResolvedValue({ businessId: 'business-1' })
      mockedPrisma.service.findMany.mockResolvedValue([])

      const response = await listServicesGET(
        createRequest('/api/services?businessId=business-1&active=false')
      )

      expect(response.status).toBe(200)
      expect(mockedGetCurrentUser).toHaveBeenCalled()
      expect(mockedRequireBusinessAccess).toHaveBeenCalledWith('user-1', 'business-1')

      expect(mockedPrisma.service.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            businessId: 'business-1',
          },
        })
      )
    })

    it('returns 401 when inactive services are requested without a user', async () => {
      mockedGetCurrentUser.mockResolvedValue(null)
      mockedPrisma.business.findFirst.mockResolvedValue({ id: 'business-1' })

      const response = await listServicesGET(
        createRequest('/api/services?businessId=business-1&active=false')
      )

      expect(response.status).toBe(401)
      expect(mockedRequireBusinessAccess).not.toHaveBeenCalled()
      expect(mockedPrisma.service.findMany).not.toHaveBeenCalled()
    })
  })

  describe('POST /api/services', () => {
    it('requires writable business role and scopes category lookup to the business', async () => {
      mockedRequireBusinessRole.mockResolvedValue({ businessId: 'business-1' })
      mockedPrisma.serviceCategory.findFirst.mockResolvedValue({ id: 'category-1' })
      mockedPrisma.service.findFirst.mockResolvedValue({ order: 2 })
      mockedPrisma.service.create.mockResolvedValue({
        id: 'service-1',
        businessId: 'business-1',
        name: 'Haircut',
      })

      const response = await createServicePOST(
        jsonRequest('/api/services', {
          businessId: 'business-1',
          name: 'Haircut',
          price: '25',
          duration: '30',
          categoryId: 'category-1',
        })
      )

      expect(response.status).toBe(201)
      expect(mockedRequireBusinessRole).toHaveBeenCalledWith('user-1', 'business-1', [
        'ADMIN',
        'MANAGER',
      ])

      expect(mockedPrisma.serviceCategory.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'category-1',
          businessId: 'business-1',
        },
        select: { id: true },
      })

      expect(mockedPrisma.service.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            businessId: 'business-1',
            price: 25,
            duration: 30,
            order: 3,
          }),
        })
      )
    })

    it('rejects create requests without a businessId', async () => {
      const response = await createServicePOST(
        jsonRequest('/api/services', {
          name: 'Haircut',
          price: '25',
          duration: '30',
        })
      )

      expect(response.status).toBe(400)
      expect(mockedRequireBusinessRole).not.toHaveBeenCalled()
      expect(mockedPrisma.service.create).not.toHaveBeenCalled()
    })
  })

  describe('/api/services/[id]', () => {
    it('requires service access for reading a service', async () => {
      mockedRequireServiceAccess.mockResolvedValue({
        service: {
          id: 'service-1',
          businessId: 'business-1',
        },
      })

      mockedPrisma.service.findFirst.mockResolvedValue({
        id: 'service-1',
        businessId: 'business-1',
        name: 'Haircut',
      })

      const response = await serviceGET(createRequest('/api/services/service-1'), {
        params: Promise.resolve({ id: 'service-1' }),
      })

      expect(response.status).toBe(200)
      expect(mockedRequireServiceAccess).toHaveBeenCalledWith('user-1', 'service-1')

      expect(mockedPrisma.service.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'service-1',
            businessId: 'business-1',
          },
        })
      )
    })

    it('requires service role for updating a service', async () => {
      mockedRequireServiceRole.mockResolvedValue({
        service: {
          id: 'service-1',
          businessId: 'business-1',
        },
      })

      mockedPrisma.serviceCategory.findFirst.mockResolvedValue({ id: 'category-1' })
      mockedPrisma.service.update.mockResolvedValue({
        id: 'service-1',
        name: 'Updated haircut',
      })

      const response = await servicePUT(
        jsonRequest(
          '/api/services/service-1',
          {
            name: 'Updated haircut',
            price: '30',
            duration: '45',
            categoryId: 'category-1',
          },
          'PUT'
        ),
        {
          params: Promise.resolve({ id: 'service-1' }),
        }
      )

      expect(response.status).toBe(200)
      expect(mockedRequireServiceRole).toHaveBeenCalledWith('user-1', 'service-1', [
        'ADMIN',
        'MANAGER',
      ])

      expect(mockedPrisma.serviceCategory.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'category-1',
          businessId: 'business-1',
        },
        select: { id: true },
      })

      expect(mockedPrisma.service.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'service-1' },
          data: expect.objectContaining({
            name: 'Updated haircut',
            price: 30,
            duration: 45,
          }),
        })
      )
    })

    it('requires service role and scopes deletion to the service business', async () => {
      mockedRequireServiceRole.mockResolvedValue({
        service: {
          id: 'service-1',
          businessId: 'business-1',
        },
      })

      mockedPrisma.service.deleteMany.mockResolvedValue({ count: 1 })

      const response = await serviceDELETE(createRequest('/api/services/service-1'), {
        params: Promise.resolve({ id: 'service-1' }),
      })

      expect(response.status).toBe(200)
      expect(mockedRequireServiceRole).toHaveBeenCalledWith('user-1', 'service-1', [
        'ADMIN',
        'MANAGER',
      ])

      expect(mockedPrisma.service.deleteMany).toHaveBeenCalledWith({
        where: {
          id: 'service-1',
          businessId: 'business-1',
        },
      })
    })
  })

  describe('PATCH /api/services/[id]/toggle', () => {
    it('requires service role before toggling active state', async () => {
      mockedRequireServiceRole.mockResolvedValue({
        service: {
          id: 'service-1',
          businessId: 'business-1',
          active: true,
        },
      })

      mockedPrisma.service.update.mockResolvedValue({
        id: 'service-1',
        name: 'Haircut',
        active: false,
        updatedAt: new Date(),
      })

      const response = await toggleServicePATCH(createRequest('/api/services/service-1/toggle'), {
        params: Promise.resolve({ id: 'service-1' }),
      })

      expect(response.status).toBe(200)
      expect(mockedRequireServiceRole).toHaveBeenCalledWith('user-1', 'service-1', [
        'ADMIN',
        'MANAGER',
      ])

      expect(mockedPrisma.service.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'service-1' },
          data: { active: false },
        })
      )
    })
  })

  describe('GET /api/services/stats', () => {
    it('requires business access and scopes all stats to the authorized business', async () => {
      mockedRequireBusinessAccess.mockResolvedValue({ businessId: 'business-1' })

      mockedPrisma.service.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1)

      mockedPrisma.appointment.count.mockResolvedValue(10)
      mockedPrisma.appointment.aggregate.mockResolvedValue({
        _sum: { totalAmount: 250 },
      })
      mockedPrisma.appointment.groupBy.mockResolvedValue([
        {
          serviceId: 'service-1',
          _count: { id: 5 },
        },
      ])
      mockedPrisma.service.findMany.mockResolvedValue([
        {
          id: 'service-1',
          name: 'Haircut',
          price: 25,
        },
      ])

      const response = await serviceStatsGET(
        createRequest('/api/services/stats?businessId=business-1')
      )
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
      expect(mockedRequireBusinessAccess).toHaveBeenCalledWith('user-1', 'business-1')

      expect(mockedPrisma.service.count).toHaveBeenNthCalledWith(1, {
        where: { businessId: 'business-1' },
      })
      expect(mockedPrisma.service.count).toHaveBeenNthCalledWith(2, {
        where: { businessId: 'business-1', active: true },
      })
      expect(mockedPrisma.service.count).toHaveBeenNthCalledWith(3, {
        where: { businessId: 'business-1', featured: true },
      })

      expect(mockedPrisma.appointment.count).toHaveBeenCalledWith({
        where: { businessId: 'business-1' },
      })
    })
  })

  describe('POST /api/services/bulk', () => {
    it('rejects bulk actions when one or more services are missing', async () => {
      mockedPrisma.service.findMany.mockResolvedValue([
        {
          id: 'service-1',
          businessId: 'business-1',
        },
      ])

      const response = await bulkServicesPOST(
        jsonRequest('/api/services/bulk', {
          serviceIds: ['service-1', 'service-2'],
          action: 'deactivate',
        })
      )

      expect(response.status).toBe(404)
      expect(mockedRequireBusinessRole).not.toHaveBeenCalled()
      expect(mockedPrisma.service.updateMany).not.toHaveBeenCalled()
      expect(mockedPrisma.service.deleteMany).not.toHaveBeenCalled()
    })

    it('requires writable role for each affected business and scopes updateMany', async () => {
      mockedPrisma.service.findMany.mockResolvedValue([
        {
          id: 'service-1',
          businessId: 'business-1',
        },
        {
          id: 'service-2',
          businessId: 'business-2',
        },
      ])

      mockedRequireBusinessRole.mockResolvedValue({ businessId: 'business-1' })
      mockedPrisma.service.updateMany.mockResolvedValue({ count: 2 })

      const response = await bulkServicesPOST(
        jsonRequest('/api/services/bulk', {
          serviceIds: ['service-1', 'service-2'],
          action: 'deactivate',
        })
      )

      expect(response.status).toBe(200)

      expect(mockedRequireBusinessRole).toHaveBeenCalledWith('user-1', 'business-1', [
        'ADMIN',
        'MANAGER',
      ])
      expect(mockedRequireBusinessRole).toHaveBeenCalledWith('user-1', 'business-2', [
        'ADMIN',
        'MANAGER',
      ])

      expect(mockedPrisma.service.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['service-1', 'service-2'] },
          businessId: { in: ['business-1', 'business-2'] },
        },
        data: { active: false },
      })
    })
  })

  describe('PUT /api/services/reorder', () => {
    it('rejects reorder requests across multiple businesses', async () => {
      mockedPrisma.service.findMany.mockResolvedValue([
        {
          id: 'service-1',
          businessId: 'business-1',
        },
        {
          id: 'service-2',
          businessId: 'business-2',
        },
      ])

      const response = await reorderServicesPUT(
        jsonRequest(
          '/api/services/reorder',
          {
            serviceIds: ['service-1', 'service-2'],
          },
          'PUT'
        )
      )

      expect(response.status).toBe(400)
      expect(mockedRequireBusinessRole).not.toHaveBeenCalled()
      expect(mockedPrisma.$transaction).not.toHaveBeenCalled()
    })

    it('requires writable business role and scopes each reorder update', async () => {
      mockedPrisma.service.findMany
        .mockResolvedValueOnce([
          {
            id: 'service-1',
            businessId: 'business-1',
          },
          {
            id: 'service-2',
            businessId: 'business-1',
          },
        ])
        .mockResolvedValueOnce([
          { id: 'service-1', order: 0 },
          { id: 'service-2', order: 1 },
          { id: 'service-3', order: 2 },
        ])

      mockedRequireBusinessRole.mockResolvedValue({ businessId: 'business-1' })
      mockedPrisma.service.updateMany.mockReturnValue({})
      mockedPrisma.$transaction.mockResolvedValue([])

      const response = await reorderServicesPUT(
        jsonRequest(
          '/api/services/reorder',
          {
            serviceIds: ['service-1', 'service-2'],
          },
          'PUT'
        )
      )

      expect(response.status).toBe(200)
      expect(mockedRequireBusinessRole).toHaveBeenCalledWith('user-1', 'business-1', [
        'ADMIN',
        'MANAGER',
      ])

      expect(mockedPrisma.service.updateMany).toHaveBeenNthCalledWith(1, {
        where: {
          id: 'service-1',
          businessId: 'business-1',
        },
        data: { order: 6 },
      })

      expect(mockedPrisma.service.updateMany).toHaveBeenNthCalledWith(2, {
        where: {
          id: 'service-2',
          businessId: 'business-1',
        },
        data: { order: 7 },
      })

      expect(mockedPrisma.service.updateMany).toHaveBeenNthCalledWith(3, {
        where: {
          id: 'service-3',
          businessId: 'business-1',
        },
        data: { order: 8 },
      })

      expect(mockedPrisma.service.updateMany).toHaveBeenNthCalledWith(4, {
        where: {
          id: 'service-1',
          businessId: 'business-1',
        },
        data: { order: 0 },
      })

      expect(mockedPrisma.service.updateMany).toHaveBeenNthCalledWith(5, {
        where: {
          id: 'service-2',
          businessId: 'business-1',
        },
        data: { order: 1 },
      })

      expect(mockedPrisma.service.updateMany).toHaveBeenNthCalledWith(6, {
        where: {
          id: 'service-3',
          businessId: 'business-1',
        },
        data: { order: 2 },
      })

      expect(mockedPrisma.$transaction).toHaveBeenCalled()
    })
  })
})

describe('POST /api/services/[id]/duplicate', () => {
  it('requires service role and duplicates the service within the authorized business', async () => {
    mockedRequireServiceRole.mockResolvedValue({
      service: {
        id: 'service-1',
        businessId: 'business-1',
      },
    })

    mockedPrisma.service.findFirst
      .mockResolvedValueOnce({
        id: 'service-1',
        businessId: 'business-1',
        name: 'Haircut',
        description: null,
        tagline: null,
        price: 25,
        priceType: 'FIXED',
        priceRangeMin: null,
        priceRangeMax: null,
        currency: 'GBP',
        duration: 30,
        bufferTime: 0,
        categoryId: null,
        imageUrl: null,
        galleryImages: [],
        requiresApproval: false,
        requiresDeposit: false,
        depositAmount: null,
        maxAdvanceBookingDays: null,
        useBusinessHours: true,
        customAvailability: null,
        availableDays: [1, 2, 3, 4, 5],
        preparationNotes: null,
        aftercareNotes: null,
        variants: [
          {
            name: 'Long hair',
            description: null,
            priceAdjustment: 5,
            durationAdjustment: 10,
            type: 'OPTION',
            isDefault: false,
            active: true,
          },
        ],
      })
      .mockResolvedValueOnce({ order: 3 })

    mockedPrisma.service.create.mockResolvedValue({
      id: 'service-copy',
      businessId: 'business-1',
      name: 'Haircut (Copy)',
    })

    mockedPrisma.serviceVariant.createMany.mockResolvedValue({ count: 1 })

    const response = await duplicateServicePOST(
      createRequest('/api/services/service-1/duplicate'),
      {
        params: Promise.resolve({ id: 'service-1' }),
      }
    )

    expect(response.status).toBe(200)
    expect(mockedRequireServiceRole).toHaveBeenCalledWith('user-1', 'service-1', [
      'ADMIN',
      'MANAGER',
    ])

    expect(mockedPrisma.service.findFirst).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: {
          id: 'service-1',
          businessId: 'business-1',
        },
      })
    )

    expect(mockedPrisma.service.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          businessId: 'business-1',
          name: 'Haircut (Copy)',
          featured: false,
          active: false,
          order: 4,
        }),
      })
    )

    expect(mockedPrisma.serviceVariant.createMany).toHaveBeenCalled()
  })
})

describe('GET /api/services/[id]/variants', () => {
  it('requires readable service access before returning variants', async () => {
    mockedRequireServiceAccess.mockResolvedValue({
      service: {
        id: 'service-1',
        businessId: 'business-1',
      },
    })

    mockedPrisma.serviceVariant.findMany.mockResolvedValue([
      {
        id: 'variant-1',
        serviceId: 'service-1',
        name: 'Long hair',
        priceAdjustment: 5,
      },
    ])

    const response = await serviceVariantsGET(createRequest('/api/services/service-1/variants'), {
      params: Promise.resolve({ id: 'service-1' }),
    })

    expect(response.status).toBe(200)
    expect(mockedRequireServiceAccess).toHaveBeenCalledWith('user-1', 'service-1')
    expect(mockedPrisma.serviceVariant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { serviceId: 'service-1' },
      })
    )
  })
})

describe('POST /api/services/[id]/variants', () => {
  it('requires service role before creating a variant', async () => {
    mockedRequireServiceRole.mockResolvedValue({
      service: {
        id: 'service-1',
        businessId: 'business-1',
      },
    })

    mockedPrisma.serviceVariant.findFirst.mockResolvedValue({ order: 2 })
    mockedPrisma.serviceVariant.create.mockResolvedValue({
      id: 'variant-1',
      serviceId: 'service-1',
      name: 'Long hair',
    })

    const response = await serviceVariantsPOST(
      jsonRequest(
        '/api/services/service-1/variants',
        {
          name: 'Long hair',
          priceAdjustment: 5,
          durationAdjustment: 10,
          type: 'OPTION',
          isDefault: true,
        },
        'POST'
      ),
      {
        params: Promise.resolve({ id: 'service-1' }),
      }
    )

    expect(response.status).toBe(201)
    expect(mockedRequireServiceRole).toHaveBeenCalledWith('user-1', 'service-1', [
      'ADMIN',
      'MANAGER',
    ])

    expect(mockedPrisma.serviceVariant.updateMany).toHaveBeenCalledWith({
      where: {
        serviceId: 'service-1',
        type: 'OPTION',
        isDefault: true,
      },
      data: { isDefault: false },
    })

    expect(mockedPrisma.serviceVariant.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          serviceId: 'service-1',
          name: 'Long hair',
          order: 3,
          isDefault: true,
        }),
      })
    )
  })
})

describe('PUT /api/services/[id]/variants/[variantId]', () => {
  it('requires service variant role and scopes default reset to the URL serviceId', async () => {
    mockedRequireServiceVariantRole.mockResolvedValue({
      variant: {
        id: 'variant-1',
        serviceId: 'service-1',
        type: 'OPTION',
      },
    })

    mockedPrisma.serviceVariant.update.mockResolvedValue({
      id: 'variant-1',
      serviceId: 'service-1',
      name: 'Updated variant',
    })

    const response = await serviceVariantPUT(
      jsonRequest(
        '/api/services/service-1/variants/variant-1',
        {
          name: 'Updated variant',
          priceAdjustment: 10,
          durationAdjustment: 15,
          type: 'OPTION',
          isDefault: true,
          active: true,
        },
        'PUT'
      ),
      {
        params: Promise.resolve({ id: 'service-1', variantId: 'variant-1' }),
      }
    )

    expect(response.status).toBe(200)
    expect(mockedRequireServiceVariantRole).toHaveBeenCalledWith(
      'user-1',
      'service-1',
      'variant-1',
      ['ADMIN', 'MANAGER']
    )

    expect(mockedPrisma.serviceVariant.updateMany).toHaveBeenCalledWith({
      where: {
        serviceId: 'service-1',
        type: 'OPTION',
        isDefault: true,
        id: { not: 'variant-1' },
      },
      data: { isDefault: false },
    })

    expect(mockedPrisma.serviceVariant.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'variant-1' },
        data: expect.objectContaining({
          name: 'Updated variant',
          priceAdjustment: 10,
          durationAdjustment: 15,
          type: 'OPTION',
          isDefault: true,
          active: true,
        }),
      })
    )
  })
})

describe('DELETE /api/services/[id]/variants/[variantId]', () => {
  it('requires service variant role and deletes only when variant belongs to the URL service', async () => {
    mockedRequireServiceVariantRole.mockResolvedValue({
      variant: {
        id: 'variant-1',
        serviceId: 'service-1',
      },
    })

    mockedPrisma.serviceVariant.deleteMany.mockResolvedValue({ count: 1 })

    const response = await serviceVariantDELETE(
      createRequest('/api/services/service-1/variants/variant-1'),
      {
        params: Promise.resolve({ id: 'service-1', variantId: 'variant-1' }),
      }
    )

    expect(response.status).toBe(200)
    expect(mockedRequireServiceVariantRole).toHaveBeenCalledWith(
      'user-1',
      'service-1',
      'variant-1',
      ['ADMIN', 'MANAGER']
    )

    expect(mockedPrisma.serviceVariant.deleteMany).toHaveBeenCalledWith({
      where: {
        id: 'variant-1',
        serviceId: 'service-1',
      },
    })
  })
})
