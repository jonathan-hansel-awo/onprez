/** @jest-environment node */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/presence/pages/publish/route'
import { requireBusinessRole } from '@/lib/auth/business-access'
import { getCurrentUser } from '@/lib/auth/get-user'
import { invalidatePublicPresence } from '@/lib/presence/public-presence-cache'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/auth/get-user', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('@/lib/auth/business-access', () => ({
  requireBusinessRole: jest.fn(),
  businessAuthErrorResponse: jest.fn(() => null),
}))

jest.mock('@/lib/presence/public-presence-cache', () => ({
  invalidatePublicPresence: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    page: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    business: {
      update: jest.fn(),
    },
  },
}))

const mockGetCurrentUser = jest.mocked(getCurrentUser)
const mockRequireBusinessRole = jest.mocked(requireBusinessRole)
const mockInvalidatePublicPresence = jest.mocked(invalidatePublicPresence)
const mockFindPage = jest.mocked(prisma.page.findFirst)
const mockUpdatePage = jest.mocked(prisma.page.update)
const mockUpdateBusiness = jest.mocked(prisma.business.update)

function createRequest(isPublished: boolean) {
  return new NextRequest('https://onprez.test/api/presence/pages/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pageId: 'page-1',
      businessId: 'business-1',
      isPublished,
    }),
  })
}

describe('presence publication cache invalidation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetCurrentUser.mockResolvedValue({ id: 'user-1' } as never)
    mockRequireBusinessRole.mockResolvedValue({ businessId: 'business-1' } as never)
    mockFindPage.mockResolvedValue({
      id: 'page-1',
      businessId: 'business-1',
      content: [{ id: 'hero-1', type: 'HERO' }],
      business: { slug: 'aurelia-wellness' },
    } as never)
    mockUpdatePage.mockResolvedValue({
      id: 'page-1',
      businessId: 'business-1',
      slug: 'home',
      title: 'Home',
      isPublished: true,
      publishedAt: new Date('2026-07-31T18:00:00.000Z'),
      version: 4,
      updatedAt: new Date('2026-07-31T18:00:00.000Z'),
    } as never)
    mockUpdateBusiness.mockResolvedValue({ id: 'business-1' } as never)
  })

  it.each([true, false])(
    'expires the handle cache after setting publication to %s',
    async isPublished => {
      const response = await POST(createRequest(isPublished))

      expect(response.status).toBe(200)
      expect(mockInvalidatePublicPresence).toHaveBeenCalledWith('aurelia-wellness')
      expect(mockUpdateBusiness).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'business-1' },
          data: expect.objectContaining({ isPublished }),
        })
      )
    }
  )

  it('does not invalidate a handle when the page is not found', async () => {
    mockFindPage.mockResolvedValue(null)

    const response = await POST(createRequest(true))

    expect(response.status).toBe(404)
    expect(mockInvalidatePublicPresence).not.toHaveBeenCalled()
  })
})
