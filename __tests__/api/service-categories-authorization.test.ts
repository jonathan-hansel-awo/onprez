/** @jest-environment node */

import { NextRequest } from 'next/server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { requireBusinessAccess, requireBusinessRole } from '@/lib/auth/business-access'

import { GET as categoriesGET, POST as categoriesPOST } from '@/app/api/service-categories/route'

import {
  GET as categoryGET,
  PUT as categoryPUT,
  DELETE as categoryDELETE,
} from '@/app/api/service-categories/[id]/route'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    serviceCategory: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
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

const mockedPrisma = prisma as unknown as {
  serviceCategory: {
    findMany: jest.Mock
    findFirst: jest.Mock
    findUnique: jest.Mock
    create: jest.Mock
    update: jest.Mock
    deleteMany: jest.Mock
  }
}

const mockedGetCurrentUser = getCurrentUser as jest.Mock
const mockedRequireBusinessAccess = requireBusinessAccess as jest.Mock
const mockedRequireBusinessRole = requireBusinessRole as jest.Mock

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

const businessContext = {
  userId: 'user-1',
  businessId: 'business-1',
  role: 'OWNER',
  isOwner: true,
  business: {
    id: 'business-1',
    name: 'Test Business',
    slug: 'test-business',
    ownerId: 'user-1',
  },
}

describe('service categories API authorization', () => {
  beforeEach(() => {
    jest.resetAllMocks()

    mockedGetCurrentUser.mockResolvedValue(authUser)
    mockedRequireBusinessAccess.mockResolvedValue(businessContext)
    mockedRequireBusinessRole.mockResolvedValue(businessContext)
  })

  describe('GET /api/service-categories', () => {
    it('requires business access and scopes category listing to the authorized business', async () => {
      mockedPrisma.serviceCategory.findMany.mockResolvedValue([
        {
          id: 'category-1',
          businessId: 'business-1',
          name: 'Hair',
          order: 0,
          _count: { services: 2 },
        },
      ])

      const response = await categoriesGET(
        createRequest('/api/service-categories?businessId=business-1')
      )

      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)

      expect(mockedRequireBusinessAccess).toHaveBeenCalledWith('user-1', 'business-1')

      expect(mockedPrisma.serviceCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            businessId: 'business-1',
          },
        })
      )
    })

    it('rejects requests without a businessId', async () => {
      const response = await categoriesGET(createRequest('/api/service-categories'))

      expect(response.status).toBe(400)
      expect(mockedRequireBusinessAccess).not.toHaveBeenCalled()
      expect(mockedPrisma.serviceCategory.findMany).not.toHaveBeenCalled()
    })
  })

  describe('POST /api/service-categories', () => {
    it('requires writable business role before creating a category', async () => {
      mockedPrisma.serviceCategory.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ order: 2 })

      mockedPrisma.serviceCategory.create.mockResolvedValue({
        id: 'category-1',
        businessId: 'business-1',
        name: 'Hair',
        order: 3,
        _count: { services: 0 },
      })

      const response = await categoriesPOST(
        jsonRequest('/api/service-categories', {
          businessId: 'business-1',
          name: 'Hair',
          description: 'Hair services',
          color: '#000000',
          icon: 'scissors',
        })
      )

      expect(response.status).toBe(201)

      expect(mockedRequireBusinessRole).toHaveBeenCalledWith('user-1', 'business-1', [
        'ADMIN',
        'MANAGER',
      ])

      expect(mockedPrisma.serviceCategory.findFirst).toHaveBeenNthCalledWith(1, {
        where: {
          businessId: 'business-1',
          name: {
            equals: 'Hair',
            mode: 'insensitive',
          },
        },
        select: { id: true },
      })

      expect(mockedPrisma.serviceCategory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            businessId: 'business-1',
            name: 'Hair',
            order: 3,
          }),
        })
      )
    })

    it('rejects duplicate category names within the same business', async () => {
      mockedPrisma.serviceCategory.findFirst.mockResolvedValueOnce({
        id: 'existing-category',
      })

      const response = await categoriesPOST(
        jsonRequest('/api/service-categories', {
          businessId: 'business-1',
          name: 'Hair',
        })
      )

      expect(response.status).toBe(400)
      expect(mockedPrisma.serviceCategory.create).not.toHaveBeenCalled()
    })
  })

  describe('GET /api/service-categories/[id]', () => {
    it('requires access to the category business before returning it', async () => {
      mockedPrisma.serviceCategory.findUnique.mockResolvedValue({
        id: 'category-1',
        businessId: 'business-1',
        name: 'Hair',
        _count: { services: 2 },
      })

      const response = await categoryGET(createRequest('/api/service-categories/category-1'), {
        params: Promise.resolve({ id: 'category-1' }),
      })

      expect(response.status).toBe(200)

      expect(mockedRequireBusinessAccess).toHaveBeenCalledWith('user-1', 'business-1')
    })
  })

  describe('PUT /api/service-categories/[id]', () => {
    it('requires writable business role and checks duplicate names within the category business', async () => {
      mockedPrisma.serviceCategory.findUnique.mockResolvedValue({
        id: 'category-1',
        businessId: 'business-1',
      })

      mockedPrisma.serviceCategory.findFirst.mockResolvedValue(null)

      mockedPrisma.serviceCategory.update.mockResolvedValue({
        id: 'category-1',
        businessId: 'business-1',
        name: 'Updated Hair',
        _count: { services: 0 },
      })

      const response = await categoryPUT(
        jsonRequest(
          '/api/service-categories/category-1',
          {
            name: 'Updated Hair',
            description: 'Updated description',
            color: '#ffffff',
            icon: 'sparkles',
          },
          'PUT'
        ),
        {
          params: Promise.resolve({ id: 'category-1' }),
        }
      )

      expect(response.status).toBe(200)

      expect(mockedRequireBusinessRole).toHaveBeenCalledWith('user-1', 'business-1', [
        'ADMIN',
        'MANAGER',
      ])

      expect(mockedPrisma.serviceCategory.findFirst).toHaveBeenCalledWith({
        where: {
          businessId: 'business-1',
          name: {
            equals: 'Updated Hair',
            mode: 'insensitive',
          },
          id: {
            not: 'category-1',
          },
        },
        select: { id: true },
      })

      expect(mockedPrisma.serviceCategory.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'category-1' },
          data: expect.objectContaining({
            name: 'Updated Hair',
          }),
        })
      )
    })
  })

  describe('DELETE /api/service-categories/[id]', () => {
    it('requires writable business role and blocks deleting categories with services', async () => {
      mockedPrisma.serviceCategory.findUnique.mockResolvedValue({
        id: 'category-1',
        businessId: 'business-1',
        _count: { services: 2 },
      })

      const response = await categoryDELETE(createRequest('/api/service-categories/category-1'), {
        params: Promise.resolve({ id: 'category-1' }),
      })

      expect(response.status).toBe(400)

      expect(mockedRequireBusinessRole).toHaveBeenCalledWith('user-1', 'business-1', [
        'ADMIN',
        'MANAGER',
      ])

      expect(mockedPrisma.serviceCategory.deleteMany).not.toHaveBeenCalled()
    })

    it('deletes only the category scoped to its business', async () => {
      mockedPrisma.serviceCategory.findUnique.mockResolvedValue({
        id: 'category-1',
        businessId: 'business-1',
        _count: { services: 0 },
      })

      mockedPrisma.serviceCategory.deleteMany.mockResolvedValue({ count: 1 })

      const response = await categoryDELETE(createRequest('/api/service-categories/category-1'), {
        params: Promise.resolve({ id: 'category-1' }),
      })

      expect(response.status).toBe(200)

      expect(mockedPrisma.serviceCategory.deleteMany).toHaveBeenCalledWith({
        where: {
          id: 'category-1',
          businessId: 'business-1',
        },
      })
    })
  })
})
