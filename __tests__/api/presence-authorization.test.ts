/** @jest-environment node */

import { NextRequest } from 'next/server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { requireBusinessAccess, requireBusinessRole } from '@/lib/auth/business-access'
import { getTemplateById } from '@/lib/templates/presence-templates'
import { syncFAQsFromPage } from '@/lib/utils/sync-faqs'

import { POST as applyTemplatePOST } from '@/app/api/presence/apply-template/route'
import { POST as publishPagePOST } from '@/app/api/presence/pages/publish/route'
import { GET as pagesGET, PUT as pagesPUT } from '@/app/api/presence/pages/route'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    business: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    page: {
      upsert: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
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

jest.mock('@/lib/templates/presence-templates', () => ({
  getTemplateById: jest.fn(),
}))

jest.mock('@/lib/utils/sync-faqs', () => ({
  syncFAQsFromPage: jest.fn(),
}))

const mockedPrisma = prisma as unknown as {
  business: {
    findUnique: jest.Mock
    update: jest.Mock
  }
  page: {
    upsert: jest.Mock
    findFirst: jest.Mock
    findMany: jest.Mock
    update: jest.Mock
  }
}

const mockedGetCurrentUser = getCurrentUser as jest.Mock
const mockedRequireBusinessAccess = requireBusinessAccess as jest.Mock
const mockedRequireBusinessRole = requireBusinessRole as jest.Mock
const mockedGetTemplateById = getTemplateById as jest.Mock
const mockedSyncFAQsFromPage = syncFAQsFromPage as jest.Mock
const businessId = '11111111-1111-4111-8111-111111111111'
const pageId = '22222222-2222-4222-8222-222222222222'
const otherPageId = '33333333-3333-4333-8333-333333333333'

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

describe('presence API authorization', () => {
  beforeEach(() => {
    jest.resetAllMocks()

    mockedGetCurrentUser.mockResolvedValue(authUser)
    mockedRequireBusinessAccess.mockResolvedValue(businessContext)
    mockedRequireBusinessRole.mockResolvedValue(businessContext)

    mockedPrisma.business.findUnique.mockResolvedValue({
      id: businessId,
      name: 'Test Business',
      settings: {},
    })

    mockedPrisma.business.update.mockResolvedValue({
      id: businessId,
    })
  })

  describe('POST /api/presence/apply-template', () => {
    it('requires owner/admin/manager business role and upserts the home page scoped to the business', async () => {
      mockedGetTemplateById.mockReturnValue({
        id: 'template-1',
        content: {
          sections: [{ type: 'hero', title: 'Welcome' }],
          theme: { primaryColor: '#000000' },
        },
      })

      mockedPrisma.page.upsert.mockResolvedValue({
        id: pageId,
        businessId,
        slug: 'home',
        title: 'Test Business',
        content: [{ type: 'hero', title: 'Welcome' }],
        isPublished: false,
        version: 1,
        updatedAt: new Date('2026-08-01T10:00:00.000Z'),
      })

      const response = await applyTemplatePOST(
        jsonRequest('/api/presence/apply-template', {
          templateId: 'template-1',
          businessId,
        })
      )

      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)

      expect(mockedRequireBusinessRole).toHaveBeenCalledWith('user-1', businessId, [
        'ADMIN',
        'MANAGER',
      ])

      expect(mockedPrisma.page.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            businessId_slug: {
              businessId,
              slug: 'home',
            },
          },
          create: expect.objectContaining({
            businessId,
            slug: 'home',
          }),
        })
      )

      expect(mockedPrisma.business.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: businessId },
          data: {
            settings: {
              theme: { primaryColor: '#000000' },
            },
          },
        })
      )
    })

    it('rejects unknown templates before changing page content', async () => {
      mockedGetTemplateById.mockReturnValue(null)

      const response = await applyTemplatePOST(
        jsonRequest('/api/presence/apply-template', {
          templateId: 'missing-template',
          businessId,
        })
      )

      expect(response.status).toBe(404)
      expect(mockedPrisma.page.upsert).not.toHaveBeenCalled()
      expect(mockedPrisma.business.update).not.toHaveBeenCalled()
    })
  })

  describe('GET /api/presence/pages', () => {
    it('requires business access and scopes page listing to that business', async () => {
      mockedPrisma.page.findMany.mockResolvedValue([
        {
          id: pageId,
          businessId,
          slug: 'home',
          title: 'Home',
          content: [],
          publishedContent: null,
          isPublished: false,
          version: 1,
          order: 0,
          createdAt: new Date('2026-08-01T10:00:00.000Z'),
          updatedAt: new Date('2026-08-01T10:00:00.000Z'),
        },
      ])

      const response = await pagesGET(
        createRequest(`/api/presence/pages?businessId=${businessId}&slug=home`)
      )

      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)

      expect(mockedRequireBusinessAccess).toHaveBeenCalledWith('user-1', businessId)

      expect(mockedPrisma.page.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            businessId,
            slug: 'home',
          },
        })
      )
    })
  })

  describe('PUT /api/presence/pages', () => {
    it('requires owner/admin/manager and updates only a page belonging to that business', async () => {
      mockedPrisma.page.findFirst.mockResolvedValue({
        id: pageId,
        businessId,
        content: [{ type: 'hero', title: 'Ready' }],
      })

      mockedPrisma.page.update.mockResolvedValue({
        id: pageId,
        businessId,
        slug: 'home',
        title: 'Home',
        content: [{ type: 'hero', title: 'Updated' }],
        isPublished: false,
        version: 1,
        updatedAt: new Date('2026-08-01T10:00:00.000Z'),
      })

      mockedSyncFAQsFromPage.mockResolvedValue(undefined)

      const content = [{ type: 'hero', title: 'Updated' }]

      const response = await pagesPUT(
        jsonRequest(
          '/api/presence/pages',
          {
            pageId,
            businessId,
            content,
          },
          'PUT'
        )
      )

      expect(response.status).toBe(200)

      expect(mockedRequireBusinessRole).toHaveBeenCalledWith('user-1', businessId, [
        'ADMIN',
        'MANAGER',
      ])

      expect(mockedPrisma.page.findFirst).toHaveBeenCalledWith({
        where: {
          id: pageId,
          businessId,
        },
        select: {
          id: true,
          businessId: true,
        },
      })

      expect(mockedPrisma.page.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: pageId },
          data: {
            content,
          },
        })
      )

      expect(mockedSyncFAQsFromPage).toHaveBeenCalledWith(businessId, content)
    })

    it('does not update a page that does not belong to the authorized business', async () => {
      mockedPrisma.page.findFirst.mockResolvedValue(null)

      const response = await pagesPUT(
        jsonRequest(
          '/api/presence/pages',
          {
            pageId: otherPageId,
            businessId,
            content: [{ type: 'hero' }],
          },
          'PUT'
        )
      )

      expect(response.status).toBe(404)
      expect(mockedPrisma.page.update).not.toHaveBeenCalled()
      expect(mockedSyncFAQsFromPage).not.toHaveBeenCalled()
    })
  })

  describe('POST /api/presence/pages/publish', () => {
    it('requires owner/admin and publishes only a page belonging to that business', async () => {
      mockedPrisma.page.findFirst.mockResolvedValue({
        id: pageId,
        businessId,
        content: [{ type: 'hero', title: 'Ready' }],
      })

      mockedPrisma.page.update.mockResolvedValue({
        id: pageId,
        businessId,
        slug: 'home',
        title: 'Home',
        isPublished: true,
        publishedAt: new Date('2026-08-01T10:00:00.000Z'),
        version: 2,
        updatedAt: new Date('2026-08-01T10:00:00.000Z'),
      })

      const response = await publishPagePOST(
        jsonRequest('/api/presence/pages/publish', {
          pageId,
          businessId,
          isPublished: true,
        })
      )

      const json = await response.json()
      console.log(json)

      expect(response.status).toBe(200)

      expect(mockedRequireBusinessRole).toHaveBeenCalledWith('user-1', businessId, ['ADMIN'])

      expect(mockedPrisma.page.findFirst).toHaveBeenCalledWith({
        where: {
          id: pageId,
          businessId,
        },
        select: {
          id: true,
          businessId: true,
          content: true,
        },
      })

      expect(mockedPrisma.page.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: pageId },
          data: expect.objectContaining({
            isPublished: true,
            publishedContent: [{ type: 'hero', title: 'Ready' }],
            lastPublishedBy: 'user-1',
            version: { increment: 1 },
          }),
        })
      )

      expect(mockedPrisma.business.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: businessId },
          data: expect.objectContaining({
            isPublished: true,
          }),
        })
      )
    })

    it('does not publish a page that does not belong to the authorized business', async () => {
      mockedPrisma.page.findFirst.mockResolvedValue(null)

      const response = await publishPagePOST(
        jsonRequest('/api/presence/pages/publish', {
          pageId: otherPageId,
          businessId,
          isPublished: true,
        })
      )

      expect(response.status).toBe(404)
      expect(mockedPrisma.page.update).not.toHaveBeenCalled()
      expect(mockedPrisma.business.update).not.toHaveBeenCalled()
    })
  })
})
