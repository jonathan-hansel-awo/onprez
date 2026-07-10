/** @jest-environment node */

import { NextRequest } from 'next/server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { requireBusinessAccess, requireBusinessRole } from '@/lib/auth/business-access'

import {
  GET as faqsGET,
  POST as faqsPOST,
  PUT as faqsPUT,
  DELETE as faqsDELETE,
} from '@/app/api/faqs/route'

import { POST as faqsReorderPOST } from '@/app/api/faqs/reorder/route'
import { POST as faqsBulkPOST } from '@/app/api/faqs/bulk/route'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    fAQ: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
      updateMany: jest.fn(),
      createMany: jest.fn(),
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

const mockedPrisma = prisma as unknown as {
  fAQ: {
    findMany: jest.Mock
    findFirst: jest.Mock
    create: jest.Mock
    update: jest.Mock
    deleteMany: jest.Mock
    updateMany: jest.Mock
    createMany: jest.Mock
  }
  $transaction: jest.Mock
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

const businessId = 'business-1'

const authUser = {
  id: 'user-1',
  email: 'owner@example.com',
  role: 'USER',
  emailVerified: true,
  mfaEnabled: false,
}

const businessContext = {
  userId: 'user-1',
  businessId,
  role: 'OWNER',
  isOwner: true,
  business: {
    id: businessId,
    name: 'Test Business',
    slug: 'test-business',
    ownerId: 'user-1',
  },
}

describe('FAQ API authorization', () => {
  beforeEach(() => {
    jest.resetAllMocks()

    mockedGetCurrentUser.mockResolvedValue(authUser)
    mockedRequireBusinessAccess.mockResolvedValue(businessContext)
    mockedRequireBusinessRole.mockResolvedValue(businessContext)

    mockedPrisma.$transaction.mockImplementation(async input => {
      if (typeof input === 'function') {
        return input({
          fAQ: {
            deleteMany: mockedPrisma.fAQ.deleteMany,
            createMany: mockedPrisma.fAQ.createMany,
          },
        })
      }

      return Promise.all(input)
    })
  })

  describe('GET /api/faq', () => {
    it('requires business access and scopes FAQ listing to that business', async () => {
      mockedPrisma.fAQ.findMany.mockResolvedValue([
        {
          id: 'faq-1',
          businessId,
          question: 'Question?',
          answer: 'Answer.',
          order: 0,
          isActive: true,
        },
      ])

      const response = await faqsGET(createRequest(`/api/faq?businessId=${businessId}`))
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)

      expect(mockedRequireBusinessAccess).toHaveBeenCalledWith('user-1', businessId)

      expect(mockedPrisma.fAQ.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { businessId },
          orderBy: { order: 'asc' },
        })
      )
    })
  })

  describe('POST /api/faq', () => {
    it('requires owner/admin/manager role before creating a FAQ', async () => {
      mockedPrisma.fAQ.findFirst.mockResolvedValue({ order: 1 })

      mockedPrisma.fAQ.create.mockResolvedValue({
        id: 'faq-1',
        businessId,
        question: 'Question?',
        answer: 'Answer.',
        order: 2,
        isActive: true,
      })

      const response = await faqsPOST(
        jsonRequest('/api/faq', {
          businessId,
          question: 'Question?',
          answer: 'Answer.',
        })
      )

      expect(response.status).toBe(201)

      expect(mockedRequireBusinessRole).toHaveBeenCalledWith('user-1', businessId, [
        'ADMIN',
        'MANAGER',
      ])

      expect(mockedPrisma.fAQ.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            businessId,
            question: 'Question?',
            answer: 'Answer.',
            order: 2,
            isActive: true,
          }),
        })
      )
    })
  })

  describe('PUT /api/faq', () => {
    it('requires owner/admin/manager role and updates only a FAQ belonging to the business', async () => {
      mockedPrisma.fAQ.findFirst.mockResolvedValue({
        id: 'faq-1',
      })

      mockedPrisma.fAQ.update.mockResolvedValue({
        id: 'faq-1',
        businessId,
        question: 'Updated?',
        answer: 'Updated answer.',
        order: 0,
        isActive: false,
      })

      const response = await faqsPUT(
        jsonRequest(
          '/api/faq',
          {
            faqId: 'faq-1',
            businessId,
            question: 'Updated?',
            answer: 'Updated answer.',
            isActive: false,
          },
          'PUT'
        )
      )

      expect(response.status).toBe(200)

      expect(mockedRequireBusinessRole).toHaveBeenCalledWith('user-1', businessId, [
        'ADMIN',
        'MANAGER',
      ])

      expect(mockedPrisma.fAQ.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'faq-1',
          businessId,
        },
        select: { id: true },
      })

      expect(mockedPrisma.fAQ.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'faq-1' },
          data: expect.objectContaining({
            question: 'Updated?',
            answer: 'Updated answer.',
            isActive: false,
          }),
        })
      )
    })

    it('does not update a FAQ outside the authorized business', async () => {
      mockedPrisma.fAQ.findFirst.mockResolvedValue(null)

      const response = await faqsPUT(
        jsonRequest(
          '/api/faq',
          {
            faqId: 'faq-other',
            businessId,
            question: 'Updated?',
          },
          'PUT'
        )
      )

      expect(response.status).toBe(404)
      expect(mockedPrisma.fAQ.update).not.toHaveBeenCalled()
    })
  })

  describe('DELETE /api/faq', () => {
    it('deletes only a FAQ scoped to the authorized business', async () => {
      mockedPrisma.fAQ.deleteMany.mockResolvedValue({ count: 1 })

      const response = await faqsDELETE(
        createRequest(`/api/faq?businessId=${businessId}&faqId=faq-1`, {
          method: 'DELETE',
        })
      )

      expect(response.status).toBe(200)

      expect(mockedRequireBusinessRole).toHaveBeenCalledWith('user-1', businessId, [
        'ADMIN',
        'MANAGER',
      ])

      expect(mockedPrisma.fAQ.deleteMany).toHaveBeenCalledWith({
        where: {
          id: 'faq-1',
          businessId,
        },
      })
    })

    it('returns 404 when the FAQ is not in the authorized business', async () => {
      mockedPrisma.fAQ.deleteMany.mockResolvedValue({ count: 0 })

      const response = await faqsDELETE(
        createRequest(`/api/faq?businessId=${businessId}&faqId=faq-other`, {
          method: 'DELETE',
        })
      )

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/faq/reorder', () => {
    it('requires owner/admin/manager and verifies all FAQ IDs belong to the business before reordering', async () => {
      mockedPrisma.fAQ.findMany.mockResolvedValue([{ id: 'faq-1' }, { id: 'faq-2' }])
      mockedPrisma.fAQ.updateMany.mockResolvedValue({ count: 1 })

      const response = await faqsReorderPOST(
        jsonRequest('/api/faq/reorder', {
          businessId,
          faqIds: ['faq-1', 'faq-2'],
        })
      )

      expect(response.status).toBe(200)

      expect(mockedRequireBusinessRole).toHaveBeenCalledWith('user-1', businessId, [
        'ADMIN',
        'MANAGER',
      ])

      expect(mockedPrisma.fAQ.findMany).toHaveBeenCalledWith({
        where: {
          businessId,
          id: {
            in: ['faq-1', 'faq-2'],
          },
        },
        select: {
          id: true,
        },
      })

      expect(mockedPrisma.fAQ.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'faq-1',
          businessId,
        },
        data: { order: 0 },
      })

      expect(mockedPrisma.fAQ.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'faq-2',
          businessId,
        },
        data: { order: 1 },
      })
    })

    it('rejects reorder if any FAQ ID is outside the business', async () => {
      mockedPrisma.fAQ.findMany.mockResolvedValue([{ id: 'faq-1' }])

      const response = await faqsReorderPOST(
        jsonRequest('/api/faq/reorder', {
          businessId,
          faqIds: ['faq-1', 'faq-other'],
        })
      )

      expect(response.status).toBe(404)
      expect(mockedPrisma.fAQ.updateMany).not.toHaveBeenCalled()
    })

    it('rejects duplicate FAQ IDs', async () => {
      const response = await faqsReorderPOST(
        jsonRequest('/api/faq/reorder', {
          businessId,
          faqIds: ['faq-1', 'faq-1'],
        })
      )

      expect(response.status).toBe(400)
      expect(mockedPrisma.fAQ.findMany).not.toHaveBeenCalled()
    })
  })

  describe('POST /api/faq/bulk', () => {
    it('requires owner/admin/manager and replaces FAQs in a transaction scoped to the business', async () => {
      mockedPrisma.fAQ.deleteMany.mockResolvedValue({ count: 2 })
      mockedPrisma.fAQ.createMany.mockResolvedValue({ count: 2 })

      const response = await faqsBulkPOST(
        jsonRequest('/api/faq/bulk', {
          businessId,
          faqs: [
            { question: 'Question 1?', answer: 'Answer 1.' },
            { question: 'Question 2?', answer: 'Answer 2.', isActive: false },
          ],
        })
      )

      expect(response.status).toBe(200)

      expect(mockedRequireBusinessRole).toHaveBeenCalledWith('user-1', businessId, [
        'ADMIN',
        'MANAGER',
      ])

      expect(mockedPrisma.$transaction).toHaveBeenCalled()

      expect(mockedPrisma.fAQ.deleteMany).toHaveBeenCalledWith({
        where: { businessId },
      })

      expect(mockedPrisma.fAQ.createMany).toHaveBeenCalledWith({
        data: [
          {
            businessId,
            question: 'Question 1?',
            answer: 'Answer 1.',
            order: 0,
            isActive: true,
          },
          {
            businessId,
            question: 'Question 2?',
            answer: 'Answer 2.',
            order: 1,
            isActive: false,
          },
        ],
      })
    })
  })
})
