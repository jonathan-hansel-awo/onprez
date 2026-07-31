/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/presence/preview-link/route'
import { getCurrentUser } from '@/lib/auth/get-user'
import { requireBusinessRole } from '@/lib/auth/business-access'
import { createPresenceDraftPreviewToken } from '@/lib/presence/draft-preview-token'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/auth/get-user', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('@/lib/auth/business-access', () => ({
  requireBusinessRole: jest.fn(),
  businessAuthErrorResponse: jest.fn(() => null),
}))

jest.mock('@/lib/presence/draft-preview-token', () => ({
  createPresenceDraftPreviewToken: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    page: {
      findFirst: jest.fn(),
    },
  },
}))

const mockGetCurrentUser = jest.mocked(getCurrentUser)
const mockRequireBusinessRole = jest.mocked(requireBusinessRole)
const mockCreateToken = jest.mocked(createPresenceDraftPreviewToken)
const mockFindPage = jest.mocked(prisma.page.findFirst)

function createRequest(body: unknown) {
  return new NextRequest('https://preview.onprez.test/api/presence/preview-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/presence/preview-link', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('requires an authenticated user', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    const response = await POST(createRequest({ businessId: 'business-1', pageId: 'page-1' }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ success: false, error: 'Unauthorized' })
    expect(mockRequireBusinessRole).not.toHaveBeenCalled()
  })

  it('creates a version-bound link for an authorised owner or manager', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'user-1' } as never)
    mockRequireBusinessRole.mockResolvedValue({ businessId: 'business-1' } as never)
    mockFindPage.mockResolvedValue({
      id: 'page-1',
      businessId: 'business-1',
      version: 7,
    } as never)
    mockCreateToken.mockReturnValue({
      token: 'signed.preview.token',
      expiresAt: new Date('2026-08-01T12:00:00.000Z'),
    })

    const response = await POST(createRequest({ businessId: 'business-1', pageId: 'page-1' }))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(mockRequireBusinessRole).toHaveBeenCalledWith('user-1', 'business-1', [
      'ADMIN',
      'MANAGER',
    ])
    expect(mockFindPage).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'page-1',
          businessId: 'business-1',
          slug: 'home',
        },
      })
    )
    expect(mockCreateToken).toHaveBeenCalledWith({
      pageId: 'page-1',
      businessId: 'business-1',
      pageVersion: 7,
    })
    expect(payload.data).toEqual({
      previewUrl: 'https://preview.onprez.test/preview/presence/signed.preview.token',
      expiresAt: '2026-08-01T12:00:00.000Z',
    })
  })

  it('does not issue a link for a page outside the authorised business', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'user-1' } as never)
    mockRequireBusinessRole.mockResolvedValue({ businessId: 'business-1' } as never)
    mockFindPage.mockResolvedValue(null)

    const response = await POST(createRequest({ businessId: 'business-1', pageId: 'page-2' }))

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ success: false, error: 'Page not found' })
    expect(mockCreateToken).not.toHaveBeenCalled()
  })
})
