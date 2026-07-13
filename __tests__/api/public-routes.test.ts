/** @jest-environment node */

import { NextRequest } from 'next/server'

import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/services/rate-limit'

import { GET as publicFaqsGET } from '@/app/api/public/businesses/[handle]/faqs/route'
import { GET as publicServicesGET } from '@/app/api/public/businesses/[handle]/services/route'
import { POST as publicInquiriesPOST } from '@/app/api/public/inquiries/route'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    business: {
      findUnique: jest.fn(),
    },
    fAQ: {
      findMany: jest.fn(),
    },
    service: {
      findMany: jest.fn(),
    },
    serviceCategory: {
      findMany: jest.fn(),
    },
    customer: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    inquiry: {
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/services/rate-limit', () => ({
  checkRateLimit: jest.fn(),
}))

const mockedPrisma = prisma as unknown as {
  business: {
    findUnique: jest.Mock
  }
  fAQ: {
    findMany: jest.Mock
  }
  service: {
    findMany: jest.Mock
  }
  serviceCategory: {
    findMany: jest.Mock
  }
  customer: {
    findFirst: jest.Mock
    create: jest.Mock
  }
  inquiry: {
    create: jest.Mock
  }
}
const mockedCheckRateLimit = checkRateLimit as jest.Mock

function createRequest(path: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(`http://localhost:3000${path}`, init)
}

function jsonRequest(path: string, body: unknown, ip = '203.0.113.10') {
  return createRequest(path, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': ip,
      'user-agent': 'jest-test-agent',
    },
  })
}

describe('public business routes', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockedCheckRateLimit.mockResolvedValue({
      allowed: true,
      limit: 5,
      remaining: 4,
      resetAt: new Date(Date.now() + 60_000),
    })
  })

  describe('GET /api/public/businesses/[handle]/faqs', () => {
    it('returns active FAQs only for a published business', async () => {
      mockedPrisma.business.findUnique.mockResolvedValue({
        id: 'business-1',
        isPublished: true,
      })

      mockedPrisma.fAQ.findMany.mockResolvedValue([
        {
          id: 'faq-1',
          question: 'Do you accept deposits?',
          answer: 'Yes, deposits are accepted.',
          order: 1,
        },
      ])

      const response = await publicFaqsGET(
        createRequest('/api/public/businesses/test-business/faqs'),
        {
          params: Promise.resolve({ handle: 'test-business' }),
        }
      )

      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.faqs).toHaveLength(1)

      expect(mockedPrisma.business.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-business' },
        select: {
          id: true,
          isPublished: true,
        },
      })

      expect(mockedPrisma.fAQ.findMany).toHaveBeenCalledWith({
        where: {
          businessId: 'business-1',
          isActive: true,
        },
        orderBy: {
          order: 'asc',
        },
        select: {
          id: true,
          question: true,
          answer: true,
          order: true,
        },
      })
    })

    it('does not expose FAQs for unpublished businesses', async () => {
      mockedPrisma.business.findUnique.mockResolvedValue({
        id: 'business-1',
        isPublished: false,
      })

      const response = await publicFaqsGET(
        createRequest('/api/public/businesses/test-business/faqs'),
        {
          params: Promise.resolve({ handle: 'test-business' }),
        }
      )

      expect(response.status).toBe(404)
      expect(mockedPrisma.fAQ.findMany).not.toHaveBeenCalled()
    })

    it('returns 404 for invalid handles', async () => {
      const response = await publicFaqsGET(createRequest('/api/public/businesses//faqs'), {
        params: Promise.resolve({ handle: '' }),
      })

      expect(response.status).toBe(404)
      expect(mockedPrisma.business.findUnique).not.toHaveBeenCalled()
    })
  })

  describe('GET /api/public/businesses/[handle]/services', () => {
    it('returns active public services and categories for a published business', async () => {
      mockedPrisma.business.findUnique.mockResolvedValue({
        id: 'business-1',
        isPublished: true,
      })

      mockedPrisma.service.findMany.mockResolvedValue([
        {
          id: 'service-1',
          name: 'Haircut',
          description: 'Simple haircut',
          tagline: 'Clean and quick',
          price: 25,
          priceType: 'FIXED',
          priceRangeMin: null,
          priceRangeMax: null,
          currency: 'GBP',
          duration: 30,
          bufferTime: 0,
          imageUrl: 'https://example.com/image.jpg',
          featured: true,
          requiresDeposit: false,
          depositAmount: null,
          category: {
            id: 'category-1',
            name: 'Hair',
            color: '#000000',
            icon: 'scissors',
          },
        },
      ])

      mockedPrisma.serviceCategory.findMany.mockResolvedValue([
        {
          id: 'category-1',
          name: 'Hair',
          color: '#000000',
          icon: 'scissors',
          _count: {
            services: 1,
          },
        },
      ])

      const response = await publicServicesGET(
        createRequest(
          '/api/public/businesses/test-business/services?ids=service-1&categoryId=category-1&featured=true'
        ),
        {
          params: Promise.resolve({ handle: 'test-business' }),
        }
      )

      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.services).toHaveLength(1)
      expect(json.data.services[0]).toEqual(
        expect.objectContaining({
          id: 'service-1',
          name: 'Haircut',
          price: 25,
          featured: true,
        })
      )

      expect(mockedPrisma.business.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-business' },
        select: { id: true, isPublished: true },
      })

      expect(mockedPrisma.service.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            businessId: 'business-1',
            active: true,
            id: { in: ['service-1'] },
            categoryId: 'category-1',
            featured: true,
          },
        })
      )

      expect(mockedPrisma.serviceCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            businessId: 'business-1',
            services: {
              some: {
                active: true,
              },
            },
          },
        })
      )
    })

    it('does not expose services for unpublished businesses', async () => {
      mockedPrisma.business.findUnique.mockResolvedValue({
        id: 'business-1',
        isPublished: false,
      })

      const response = await publicServicesGET(
        createRequest('/api/public/businesses/test-business/services'),
        {
          params: Promise.resolve({ handle: 'test-business' }),
        }
      )

      expect(response.status).toBe(404)
      expect(mockedPrisma.service.findMany).not.toHaveBeenCalled()
      expect(mockedPrisma.serviceCategory.findMany).not.toHaveBeenCalled()
    })

    it('bounds ids filtering to prevent oversized public queries', async () => {
      mockedPrisma.business.findUnique.mockResolvedValue({
        id: 'business-1',
        isPublished: true,
      })

      mockedPrisma.service.findMany.mockResolvedValue([])
      mockedPrisma.serviceCategory.findMany.mockResolvedValue([])

      const ids = Array.from({ length: 80 }, (_, index) => `service-${index}`).join(',')

      const response = await publicServicesGET(
        createRequest(`/api/public/businesses/test-business/services?ids=${ids}`),
        {
          params: Promise.resolve({ handle: 'test-business' }),
        }
      )

      expect(response.status).toBe(200)

      const serviceFindArgs = mockedPrisma.service.findMany.mock.calls[0][0]
      expect(serviceFindArgs.where.id.in).toHaveLength(50)
    })
  })

  describe('POST /api/public/inquiries', () => {
    it('creates a public inquiry for a published business and returns a safe response', async () => {
      mockedPrisma.business.findUnique.mockResolvedValue({
        id: 'business-1',
        name: 'Test Business',
        email: 'business@example.com',
        settings: {},
        isPublished: true,
      })

      mockedPrisma.customer.findFirst.mockResolvedValue(null)

      mockedPrisma.customer.create.mockResolvedValue({
        id: 'customer-1',
        name: 'John Customer',
        phone: '07123456789',
      })

      mockedPrisma.inquiry.create.mockResolvedValue({
        id: 'inquiry-1',
        status: 'PENDING',
        createdAt: new Date('2026-08-01T10:00:00.000Z'),
      })

      const response = await publicInquiriesPOST(
        jsonRequest(
          '/api/public/inquiries',
          {
            businessId: 'business-1',
            customerName: 'John Customer',
            customerEmail: 'John@Example.com',
            customerPhone: '07123456789',
            subject: 'Booking question',
            message: 'I would like to ask about availability next week.',
            preferredContact: 'EMAIL',
          },
          '203.0.113.20'
        )
      )

      const json = await response.json()

      expect(response.status).toBe(201)
      expect(json.success).toBe(true)

      expect(json.data.inquiry).toEqual({
        id: 'inquiry-1',
        status: 'PENDING',
        createdAt: '2026-08-01T10:00:00.000Z',
      })

      expect(json.data.inquiry.message).toBeUndefined()
      expect(json.data.inquiry.ipAddress).toBeUndefined()
      expect(json.data.inquiry.userAgent).toBeUndefined()

      expect(mockedPrisma.business.findUnique).toHaveBeenCalledWith({
        where: { id: 'business-1' },
        select: {
          id: true,
          name: true,
          email: true,
          settings: true,
          isPublished: true,
        },
      })

      expect(mockedPrisma.customer.findFirst).toHaveBeenCalledWith({
        where: {
          businessId: 'business-1',
          email: 'john@example.com',
        },
        select: {
          id: true,
          name: true,
          phone: true,
        },
      })

      expect(mockedPrisma.customer.create).toHaveBeenCalledWith({
        data: {
          businessId: 'business-1',
          email: 'john@example.com',
          name: 'John Customer',
          phone: '07123456789',
        },
        select: {
          id: true,
          name: true,
          phone: true,
        },
      })

      expect(mockedPrisma.inquiry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          businessId: 'business-1',
          customerId: 'customer-1',
          customerEmail: 'john@example.com',
          customerName: 'John Customer',
          customerPhone: '07123456789',
          subject: 'Booking question',
          message: 'I would like to ask about availability next week.',
          preferredContact: 'EMAIL',
          status: 'PENDING',
          priority: 'NORMAL',
          isRead: false,
          ipAddress: '203.0.113.20',
          userAgent: 'jest-test-agent',
        }),
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
      })
    })

    it('uses an existing customer instead of creating a duplicate', async () => {
      mockedPrisma.business.findUnique.mockResolvedValue({
        id: 'business-1',
        name: 'Test Business',
        email: 'business@example.com',
        settings: {},
        isPublished: true,
      })

      mockedPrisma.customer.findFirst.mockResolvedValue({
        id: 'customer-1',
        name: 'Existing Customer',
        phone: null,
      })

      mockedPrisma.inquiry.create.mockResolvedValue({
        id: 'inquiry-1',
        status: 'PENDING',
        createdAt: new Date('2026-08-01T10:00:00.000Z'),
      })

      const response = await publicInquiriesPOST(
        jsonRequest(
          '/api/public/inquiries',
          {
            businessId: 'business-1',
            customerName: 'Existing Customer',
            customerEmail: 'existing@example.com',
            subject: 'Booking question',
            message: 'I would like to ask about availability next week.',
            preferredContact: 'EMAIL',
          },
          '203.0.113.21'
        )
      )

      expect(response.status).toBe(201)
      expect(mockedPrisma.customer.create).not.toHaveBeenCalled()

      expect(mockedPrisma.inquiry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customerId: 'customer-1',
            customerEmail: 'existing@example.com',
          }),
        })
      )
    })

    it('rejects inquiries for unpublished businesses', async () => {
      mockedPrisma.business.findUnique.mockResolvedValue({
        id: 'business-1',
        name: 'Test Business',
        email: 'business@example.com',
        settings: {},
        isPublished: false,
      })

      const response = await publicInquiriesPOST(
        jsonRequest(
          '/api/public/inquiries',
          {
            businessId: 'business-1',
            customerName: 'John Customer',
            customerEmail: 'john@example.com',
            subject: 'Booking question',
            message: 'I would like to ask about availability next week.',
          },
          '203.0.113.22'
        )
      )

      expect(response.status).toBe(404)
      expect(mockedPrisma.customer.findFirst).not.toHaveBeenCalled()
      expect(mockedPrisma.inquiry.create).not.toHaveBeenCalled()
    })

    it('rejects inquiries when inquiries are disabled for the business', async () => {
      mockedPrisma.business.findUnique.mockResolvedValue({
        id: 'business-1',
        name: 'Test Business',
        email: 'business@example.com',
        settings: {
          inquiriesEnabled: false,
        },
        isPublished: true,
      })

      const response = await publicInquiriesPOST(
        jsonRequest(
          '/api/public/inquiries',
          {
            businessId: 'business-1',
            customerName: 'John Customer',
            customerEmail: 'john@example.com',
            subject: 'Booking question',
            message: 'I would like to ask about availability next week.',
          },
          '203.0.113.23'
        )
      )

      expect(response.status).toBe(403)
      expect(mockedPrisma.customer.findFirst).not.toHaveBeenCalled()
      expect(mockedPrisma.inquiry.create).not.toHaveBeenCalled()
    })

    it('validates required inquiry fields', async () => {
      const response = await publicInquiriesPOST(
        jsonRequest(
          '/api/public/inquiries',
          {
            businessId: 'business-1',
            customerName: 'J',
            customerEmail: 'not-an-email',
            subject: '',
            message: 'Too short',
          },
          '203.0.113.24'
        )
      )

      expect(response.status).toBe(400)
      expect(mockedPrisma.business.findUnique).not.toHaveBeenCalled()
    })

    it('rate-limits repeated inquiry submissions from the same IP', async () => {
      mockedCheckRateLimit.mockResolvedValue({
        allowed: false,
        limit: 5,
        remaining: 0,
        resetAt: new Date(Date.now() + 75_000),
        retryAfter: 75,
      })

      const body = {
        businessId: 'business-1',
        customerName: 'John Customer',
        customerEmail: 'john@example.com',
        subject: 'Booking question',
        message: 'I would like to ask about availability next week.',
      }

      const limitedResponse = await publicInquiriesPOST(
        jsonRequest('/api/public/inquiries', body, '203.0.113.250')
      )

      expect(limitedResponse.status).toBe(429)
      expect(limitedResponse.headers.get('Retry-After')).toBe('75')
      expect(limitedResponse.headers.get('X-RateLimit-Limit')).toBe('5')
      expect(mockedCheckRateLimit).toHaveBeenCalledWith(
        'inquiry-create:203.0.113.250',
        'inquiry:create'
      )
      expect(mockedPrisma.business.findUnique).not.toHaveBeenCalled()
    })
  })
})
