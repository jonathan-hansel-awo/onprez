/** @jest-environment node */

import { NextRequest } from 'next/server'

import { prisma } from '@/lib/prisma'
import { createBooking } from '@/lib/services/booking'
import { createBookingDepositCheckout } from '@/lib/booking-protection/checkout'
import { sendBookingCreatedNotifications } from '@/lib/services/booking-notifications'
import { checkRateLimit } from '@/lib/services/rate-limit'

import { GET, POST } from '@/app/api/bookings/route'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    business: {
      findUnique: jest.fn(),
    },
    service: {
      findFirst: jest.fn(),
    },
    appointment: {
      findFirst: jest.fn(),
    },
  },
}))

jest.mock('@/lib/services/booking', () => ({
  createBooking: jest.fn(),
}))

jest.mock('@/lib/booking-protection/checkout', () => ({
  createBookingDepositCheckout: jest.fn(),
}))

jest.mock('@/lib/services/booking-notifications', () => ({
  sendBookingCreatedNotifications: jest.fn(),
}))

jest.mock('@/lib/services/rate-limit', () => ({
  checkRateLimit: jest.fn(),
}))

const mockedPrisma = prisma as unknown as {
  business: {
    findUnique: jest.Mock
  }
  service: {
    findFirst: jest.Mock
  }
  appointment: {
    findFirst: jest.Mock
  }
}

const mockedCreateBooking = createBooking as jest.Mock
const mockedCreateCheckout = createBookingDepositCheckout as jest.Mock
const mockedSendBookingCreatedNotifications = sendBookingCreatedNotifications as jest.Mock
const mockedCheckRateLimit = checkRateLimit as jest.Mock

function createRequest(path: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(`http://localhost:3000${path}`, init)
}

function jsonRequest(
  path: string,
  body: unknown,
  method = 'POST',
  headers: Record<string, string> = {}
) {
  return createRequest(path, {
    method,
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.10',
      ...headers,
    },
  })
}

const mockAppointment = {
  id: 'abc12345bookingid',
  status: 'CONFIRMED',
  startTime: new Date('2026-08-01T10:00:00.000Z'),
  endTime: new Date('2026-08-01T10:30:00.000Z'),
  duration: 30,
  customerNotes: 'Please call on arrival',
  customerPhone: '07123456789',
  totalAmount: 25,
  createdAt: new Date('2026-07-10T10:00:00.000Z'),
  service: {
    name: 'Haircut',
    price: 25,
    duration: 30,
    currency: 'GBP',
  },
  customer: {
    name: 'John Customer',
    email: 'john@example.com',
  },
  business: {
    name: 'Test Business',
    timezone: 'Europe/London',
    email: 'business@example.com',
    address: '123 Test Street',
    slug: 'test-business',
    owner: { email: 'owner@example.com' },
  },
}

describe('public bookings API', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockedCheckRateLimit.mockResolvedValue({
      allowed: true,
      limit: 10,
      remaining: 9,
      resetAt: new Date(Date.now() + 60_000),
    })
    mockedSendBookingCreatedNotifications.mockResolvedValue({
      customer: { success: true, messageId: 'customer-message' },
      business: { success: true, messageId: 'business-message' },
    })
  })

  describe('POST /api/bookings', () => {
    it('returns retry information when booking creation is rate limited', async () => {
      mockedCheckRateLimit.mockResolvedValue({
        allowed: false,
        limit: 10,
        remaining: 0,
        resetAt: new Date(Date.now() + 120_000),
        retryAfter: 120,
      })

      const response = await POST(
        jsonRequest('/api/bookings', {
          businessId: 'business-1',
          serviceId: 'service-1',
          date: '2026-08-01',
          startTime: '10:00',
          customerName: 'John Customer',
          customerEmail: 'john@example.com',
        })
      )

      expect(response.status).toBe(429)
      expect(response.headers.get('Retry-After')).toBe('120')
      expect(response.headers.get('X-RateLimit-Limit')).toBe('10')
      expect(mockedCheckRateLimit).toHaveBeenCalledWith(
        'booking-create:203.0.113.10:business-1',
        'booking:create'
      )
      expect(mockedPrisma.business.findUnique).not.toHaveBeenCalled()
      expect(mockedCreateBooking).not.toHaveBeenCalled()
    })

    it('creates a public booking only for an active service in the requested business', async () => {
      mockedPrisma.business.findUnique.mockResolvedValue({
        id: 'business-1',
        name: 'Test Business',
        timezone: 'Europe/London',
        email: 'business@example.com',
        address: '123 Test Street',
      })

      mockedPrisma.service.findFirst.mockResolvedValue({
        id: 'service-1',
        name: 'Haircut',
        duration: 30,
        requiresApproval: false,
      })

      mockedCreateBooking.mockResolvedValue({
        success: true,
        appointment: {
          id: 'abc12345bookingid',
        },
      })

      mockedPrisma.appointment.findFirst.mockResolvedValue(mockAppointment)

      const response = await POST(
        jsonRequest('/api/bookings', {
          businessId: 'business-1',
          serviceId: 'service-1',
          date: '2026-08-01',
          startTime: '10:00',
          endTime: '10:30',
          customerName: 'John Customer',
          customerEmail: 'John@Example.com',
          customerPhone: '07123456789',
          customerNotes: 'Please call on arrival',
        })
      )

      const json = await response.json()

      expect(response.status).toBe(201)
      expect(json.success).toBe(true)

      expect(mockedPrisma.service.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'service-1',
          businessId: 'business-1',
          active: true,
        },
        select: {
          id: true,
          name: true,
          duration: true,
          price: true,
          currency: true,
          requiresApproval: true,
          depositMode: true,
          depositAmount: true,
        },
      })

      expect(mockedCreateBooking).toHaveBeenCalledWith(
        'business-1',
        'service-1',
        '2026-08-01',
        '10:00',
        {
          name: 'John Customer',
          email: 'john@example.com',
          phone: '07123456789',
          notes: 'Please call on arrival',
        },
        expect.objectContaining({
          status: 'CONFIRMED',
          bookingSource: 'WEBSITE',
          bookingIp: '203.0.113.10',
        })
      )

      expect(mockedPrisma.appointment.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'abc12345bookingid',
            businessId: 'business-1',
          },
        })
      )
      expect(mockedSendBookingCreatedNotifications).toHaveBeenCalledWith(
        expect.objectContaining({
          bookingId: 'abc12345bookingid',
          status: 'CONFIRMED',
          customerEmail: 'john@example.com',
          businessEmail: 'business@example.com',
          businessOwnerEmail: 'owner@example.com',
          currency: 'GBP',
        })
      )
    })

    it('creates pending bookings when the service requires approval', async () => {
      mockedPrisma.business.findUnique.mockResolvedValue({
        id: 'business-1',
        name: 'Test Business',
        timezone: 'Europe/London',
        email: 'business@example.com',
        address: '123 Test Street',
      })

      mockedPrisma.service.findFirst.mockResolvedValue({
        id: 'service-1',
        name: 'Consultation',
        duration: 60,
        requiresApproval: true,
      })

      mockedCreateBooking.mockResolvedValue({
        success: true,
        appointment: {
          id: 'abc12345bookingid',
        },
      })

      mockedPrisma.appointment.findFirst.mockResolvedValue({
        ...mockAppointment,
        status: 'PENDING',
        endTime: new Date('2026-08-01T11:00:00.000Z'),
        duration: 60,
      })

      const response = await POST(
        jsonRequest('/api/bookings', {
          businessId: 'business-1',
          serviceId: 'service-1',
          date: '2026-08-01',
          startTime: '10:00',
          endTime: '11:00',
          customerName: 'John Customer',
          customerEmail: 'john@example.com',
        })
      )

      expect(response.status).toBe(201)

      expect(mockedCreateBooking).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          status: 'PENDING',
        })
      )
      expect(mockedSendBookingCreatedNotifications).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'PENDING' })
      )
    })

    it('rejects a local time that does not exist during the DST jump', async () => {
      mockedPrisma.business.findUnique.mockResolvedValue({
        id: 'business-1',
        name: 'Test Business',
        timezone: 'Europe/London',
        email: 'business@example.com',
        address: '123 Test Street',
      })
      mockedPrisma.service.findFirst.mockResolvedValue({
        id: 'service-1',
        name: 'Consultation',
        duration: 30,
        requiresApproval: false,
      })

      const response = await POST(
        jsonRequest('/api/bookings', {
          businessId: 'business-1',
          serviceId: 'service-1',
          date: '2030-03-31',
          startTime: '01:30',
          customerName: 'John Customer',
          customerEmail: 'john@example.com',
        })
      )

      expect(response.status).toBe(400)
      await expect(response.json()).resolves.toMatchObject({
        success: false,
        error: expect.stringContaining('does not exist'),
      })
      expect(mockedCreateBooking).not.toHaveBeenCalled()
    })

    it('returns the original booking when an idempotency key is replayed', async () => {
      mockedPrisma.business.findUnique.mockResolvedValue({
        id: 'business-1',
        name: 'Test Business',
        timezone: 'Europe/London',
        email: 'business@example.com',
        address: '123 Test Street',
      })
      mockedPrisma.service.findFirst.mockResolvedValue({
        id: 'service-1',
        name: 'Haircut',
        duration: 30,
        requiresApproval: false,
      })
      mockedCreateBooking.mockResolvedValue({
        success: true,
        replayed: true,
        appointment: { id: mockAppointment.id },
      })
      mockedPrisma.appointment.findFirst.mockResolvedValue(mockAppointment)

      const response = await POST(
        jsonRequest(
          '/api/bookings',
          {
            businessId: 'business-1',
            serviceId: 'service-1',
            date: '2026-08-01',
            startTime: '10:00',
            customerName: 'John Customer',
            customerEmail: 'john@example.com',
          },
          'POST',
          { 'idempotency-key': 'booking_key_1234567890' }
        )
      )

      expect(response.status).toBe(200)
      expect(response.headers.get('Idempotency-Replayed')).toBe('true')
      expect(mockedSendBookingCreatedNotifications).not.toHaveBeenCalled()
      expect(mockedCreateBooking).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({ idempotencyKey: 'booking_key_1234567890' })
      )
    })

    it('requires policy acceptance before reserving a deposit-backed booking', async () => {
      mockedPrisma.business.findUnique.mockResolvedValue({
        id: 'business-1',
        name: 'Test Business',
        slug: 'test-business',
        timezone: 'Europe/London',
        email: 'business@example.com',
        address: '123 Test Street',
        settings: {
          bookingProtection: {
            enabled: true,
            depositAmount: 10,
            cancellationWindowHours: 24,
          },
        },
        featureEntitlements: [{ enabled: true, expiresAt: null }],
        stripeConnectedAccount: {
          stripeAccountId: 'acct_test',
          status: 'READY',
          chargesEnabled: true,
          payoutsEnabled: true,
        },
      })
      mockedPrisma.service.findFirst.mockResolvedValue({
        id: 'service-1',
        name: 'Haircut',
        duration: 30,
        price: 25,
        currency: 'GBP',
        requiresApproval: false,
        depositMode: 'BUSINESS_DEFAULT',
        depositAmount: null,
      })

      const response = await POST(
        jsonRequest('/api/bookings', {
          businessId: 'business-1',
          serviceId: 'service-1',
          date: '2026-08-01',
          startTime: '10:00',
          customerName: 'John Customer',
          customerEmail: 'john@example.com',
        })
      )

      expect(response.status).toBe(400)
      expect(mockedCreateBooking).not.toHaveBeenCalled()
      expect(mockedCreateCheckout).not.toHaveBeenCalled()
    })

    it('returns a Stripe Checkout URL without sending booking notifications early', async () => {
      mockedPrisma.business.findUnique.mockResolvedValue({
        id: 'business-1',
        name: 'Test Business',
        slug: 'test-business',
        timezone: 'Europe/London',
        email: 'business@example.com',
        address: '123 Test Street',
        settings: {
          bookingProtection: {
            enabled: true,
            depositAmount: 10,
            cancellationWindowHours: 24,
          },
        },
        featureEntitlements: [{ enabled: true, expiresAt: null }],
        stripeConnectedAccount: {
          stripeAccountId: 'acct_test',
          status: 'READY',
          chargesEnabled: true,
          payoutsEnabled: true,
        },
      })
      mockedPrisma.service.findFirst.mockResolvedValue({
        id: 'service-1',
        name: 'Haircut',
        duration: 30,
        price: 25,
        currency: 'GBP',
        requiresApproval: false,
        depositMode: 'BUSINESS_DEFAULT',
        depositAmount: null,
      })
      mockedCreateBooking.mockResolvedValue({
        success: true,
        appointment: { id: mockAppointment.id },
      })
      mockedPrisma.appointment.findFirst.mockResolvedValue({
        ...mockAppointment,
        status: 'PENDING',
        requiresDeposit: true,
        depositAmount: 10,
        depositPaid: false,
        paymentStatus: 'UNPAID',
      })
      mockedCreateCheckout.mockResolvedValue({
        checkoutUrl: 'https://checkout.stripe.test/session',
        checkoutSessionId: 'cs_test',
        expiresAt: new Date('2026-08-01T09:30:00.000Z'),
        replayed: false,
      })

      const response = await POST(
        jsonRequest('/api/bookings', {
          businessId: 'business-1',
          serviceId: 'service-1',
          date: '2026-08-01',
          startTime: '10:00',
          customerName: 'John Customer',
          customerEmail: 'john@example.com',
          acceptCancellationPolicy: true,
        })
      )
      const json = await response.json()

      expect(response.status).toBe(201)
      expect(json.data).toMatchObject({
        requiresPayment: true,
        checkoutUrl: 'https://checkout.stripe.test/session',
        depositAmount: 10,
        remainingAmount: 15,
      })
      expect(mockedCreateBooking).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          status: 'PENDING',
          countCustomerBooking: false,
          deposit: expect.objectContaining({ amount: 10 }),
        })
      )
      expect(mockedCreateCheckout).toHaveBeenCalledWith(
        expect.objectContaining({ providerAccountId: 'acct_test', amount: 10 })
      )
      expect(mockedSendBookingCreatedNotifications).not.toHaveBeenCalled()
    })

    it('rejects public booking when the service is inactive or outside the business', async () => {
      mockedPrisma.business.findUnique.mockResolvedValue({
        id: 'business-1',
        name: 'Test Business',
        timezone: 'Europe/London',
        email: 'business@example.com',
        address: '123 Test Street',
      })

      mockedPrisma.service.findFirst.mockResolvedValue(null)

      const response = await POST(
        jsonRequest('/api/bookings', {
          businessId: 'business-1',
          serviceId: 'other-service',
          date: '2026-08-01',
          startTime: '10:00',
          endTime: '10:30',
          customerName: 'John Customer',
          customerEmail: 'john@example.com',
        })
      )

      expect(response.status).toBe(404)
      expect(mockedCreateBooking).not.toHaveBeenCalled()
    })

    it('rejects client-supplied endTime that does not match the service duration', async () => {
      mockedPrisma.business.findUnique.mockResolvedValue({
        id: 'business-1',
        name: 'Test Business',
        timezone: 'Europe/London',
        email: 'business@example.com',
        address: '123 Test Street',
      })

      mockedPrisma.service.findFirst.mockResolvedValue({
        id: 'service-1',
        name: 'Haircut',
        duration: 30,
        requiresApproval: false,
      })

      const response = await POST(
        jsonRequest('/api/bookings', {
          businessId: 'business-1',
          serviceId: 'service-1',
          date: '2026-08-01',
          startTime: '10:00',
          endTime: '11:00',
          customerName: 'John Customer',
          customerEmail: 'john@example.com',
        })
      )

      expect(response.status).toBe(400)
      expect(mockedCreateBooking).not.toHaveBeenCalled()
    })
  })

  describe('GET /api/bookings', () => {
    it('requires both confirmation number and customer email', async () => {
      const response = await GET(createRequest('/api/bookings?confirmationNumber=ABC12345'))

      expect(response.status).toBe(400)
      expect(mockedPrisma.appointment.findFirst).not.toHaveBeenCalled()
    })

    it('looks up booking by confirmation number and customer email', async () => {
      mockedPrisma.appointment.findFirst.mockResolvedValue(mockAppointment)

      const response = await GET(
        createRequest('/api/bookings?confirmationNumber=ABC12345&customerEmail=john@example.com')
      )

      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)

      expect(mockedPrisma.appointment.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: {
              startsWith: 'abc12345',
            },
            customerEmail: 'john@example.com',
          },
        })
      )
    })

    it('returns 404 when confirmation number and email do not match', async () => {
      mockedPrisma.appointment.findFirst.mockResolvedValue(null)

      const response = await GET(
        createRequest('/api/bookings?confirmationNumber=ABC12345&customerEmail=wrong@example.com')
      )

      expect(response.status).toBe(404)
    })
  })
})
