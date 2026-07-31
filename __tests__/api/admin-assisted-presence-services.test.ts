/** @jest-environment node */

import { NextRequest } from 'next/server'

import { POST as createAdminService } from '@/app/api/admin/businesses/[businessId]/services/route'
import { PUT as saveAdminPresence } from '@/app/api/admin/businesses/[businessId]/presence/route'
import { requirePlatformAdminApi } from '@/lib/admin/access'
import { recordAdminActionSafely } from '@/lib/admin/audit'
import { invalidatePublicPresence } from '@/lib/presence/public-presence-cache'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/presence/public-presence-cache', () => ({
  invalidatePublicPresence: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    business: {
      findUnique: jest.fn(),
    },
    service: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    page: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('@/lib/admin/access', () => ({
  requirePlatformAdminApi: jest.fn(),
  platformAdminErrorResponse: jest.fn(() => null),
}))

jest.mock('@/lib/admin/audit', () => ({
  recordAdminActionSafely: jest.fn(),
}))

const mockedPrisma = prisma as unknown as {
  business: { findUnique: jest.Mock }
  service: { findFirst: jest.Mock; create: jest.Mock }
  page: { findFirst: jest.Mock; update: jest.Mock }
}
const mockedRequirePlatformAdmin = requirePlatformAdminApi as jest.Mock
const mockedRecordAdminActionSafely = recordAdminActionSafely as jest.Mock
const mockedInvalidatePublicPresence = invalidatePublicPresence as jest.Mock

function jsonRequest(path: string, method: 'POST' | 'PUT', body: unknown) {
  return new NextRequest(`http://localhost:3000${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      'user-agent': 'jest-test-agent',
    },
    body: JSON.stringify(body),
  })
}

describe('platform-admin assisted services and presence', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockedRequirePlatformAdmin.mockResolvedValue({ id: 'admin-1' })
    mockedRecordAdminActionSafely.mockResolvedValue(true)
  })

  it('creates a service without an image or optional booking-protection fields', async () => {
    mockedPrisma.business.findUnique.mockResolvedValue({ id: 'business-1' })
    mockedPrisma.service.findFirst.mockResolvedValue({ order: 2 })
    mockedPrisma.service.create.mockResolvedValue({
      id: 'service-1',
      name: 'Swedish Massage',
      description: 'A restorative full-body massage.',
      price: 65,
      duration: 60,
      imageUrl: null,
      active: true,
      featured: false,
      order: 3,
      _count: { appointments: 0 },
    })

    const response = await createAdminService(
      jsonRequest('/api/admin/businesses/business-1/services', 'POST', {
        name: 'Swedish Massage',
        description: 'A restorative full-body massage.',
        price: 65,
        duration: 60,
        imageUrl: '',
        active: true,
        featured: false,
      }),
      { params: Promise.resolve({ businessId: 'business-1' }) }
    )

    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.success).toBe(true)

    const createData = mockedPrisma.service.create.mock.calls[0][0].data
    expect(createData).toEqual(
      expect.objectContaining({
        businessId: 'business-1',
        name: 'Swedish Massage',
        imageUrl: null,
        galleryImages: [],
        order: 3,
      })
    )
    expect(createData).not.toHaveProperty('depositMode')
    expect(createData).not.toHaveProperty('requiresDeposit')
    expect(createData).not.toHaveProperty('depositAmount')
    expect(mockedRecordAdminActionSafely).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.service.created',
        targetBusinessId: 'business-1',
      })
    )
  })

  it('identifies a production service schema mismatch without exposing database details', async () => {
    mockedPrisma.business.findUnique.mockResolvedValue({ id: 'business-1' })
    mockedPrisma.service.findFirst.mockResolvedValue({ order: 2 })
    mockedPrisma.service.create.mockRejectedValue(
      Object.assign(new Error('column does not exist'), {
        code: 'P2022',
        meta: { column: 'services.galleryImages' },
      })
    )

    const response = await createAdminService(
      jsonRequest('/api/admin/businesses/business-1/services', 'POST', {
        name: 'Deep Tissue Massage',
        description: 'A focused massage.',
        price: 75,
        duration: 60,
        imageUrl: '',
        active: true,
        featured: false,
      }),
      { params: Promise.resolve({ businessId: 'business-1' }) }
    )

    const json = await response.json()

    expect(response.status).toBe(503)
    expect(json.success).toBe(false)
    expect(json.code).toBe('SERVICE_SCHEMA_OUT_OF_DATE')
    expect(json.error).toMatch(
      /^The service database schema is out of date\. Apply pending migrations and try again\. Reference: [0-9a-f-]+$/
    )
    expect(mockedRecordAdminActionSafely).not.toHaveBeenCalled()
  })

  it('updates the live snapshot and invalidates its handle when an admin saves a published page', async () => {
    const sections = [
      {
        id: 'services-section',
        type: 'SERVICES',
        order: 1,
        isVisible: true,
        data: {
          title: 'Our services',
          serviceIds: ['service-1'],
        },
      },
    ]

    mockedPrisma.page.findFirst.mockResolvedValue({
      id: 'page-1',
      isPublished: true,
      business: { slug: 'heavenlypamperpalace' },
    })
    mockedPrisma.page.update.mockResolvedValue({ id: 'page-1' })

    const response = await saveAdminPresence(
      jsonRequest('/api/admin/businesses/business-1/presence', 'PUT', {
        pageId: 'page-1',
        content: sections,
      }),
      { params: Promise.resolve({ businessId: 'business-1' }) }
    )

    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual({
      success: true,
      data: { publishedContentUpdated: true },
    })
    expect(mockedPrisma.page.update).toHaveBeenCalledWith({
      where: { id: 'page-1' },
      data: {
        content: sections,
        publishedContent: sections,
      },
    })
    expect(mockedInvalidatePublicPresence).toHaveBeenCalledWith('heavenlypamperpalace')
    expect(mockedRecordAdminActionSafely).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.presence.draft_saved',
        targetBusinessId: 'business-1',
        details: { pageId: 'page-1', sectionCount: 1 },
      })
    )
  })

  it('keeps an unpublished assisted page as a draft without invalidating the public cache', async () => {
    const sections = [
      {
        id: 'services-section',
        type: 'SERVICES',
        order: 1,
        isVisible: true,
        data: { title: 'Our services', serviceIds: ['service-1'] },
      },
    ]

    mockedPrisma.page.findFirst.mockResolvedValue({
      id: 'page-1',
      isPublished: false,
      business: { slug: 'heavenlypamperpalace' },
    })
    mockedPrisma.page.update.mockResolvedValue({ id: 'page-1' })

    const response = await saveAdminPresence(
      jsonRequest('/api/admin/businesses/business-1/presence', 'PUT', {
        pageId: 'page-1',
        content: sections,
      }),
      { params: Promise.resolve({ businessId: 'business-1' }) }
    )

    expect(response.status).toBe(200)
    expect(mockedPrisma.page.update).toHaveBeenCalledWith({
      where: { id: 'page-1' },
      data: { content: sections },
    })
    expect(mockedInvalidatePublicPresence).not.toHaveBeenCalled()
  })
})
