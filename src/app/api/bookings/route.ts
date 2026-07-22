import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createBooking } from '@/lib/services/booking'
import { sendBookingCreatedNotifications } from '@/lib/services/booking-notifications'
import { checkRateLimit } from '@/lib/services/rate-limit'
import { zonedDateTimeToUtc } from '@/lib/utils/timezone'
import { z } from 'zod'
import { logApiError } from '@/lib/api/error-response'
import { logger, withRequestLogging } from '@/lib/observability/logger'

const createBookingSchema = z.object({
  businessId: z.string().min(1, 'Business ID is required').max(128),
  serviceId: z.string().min(1, 'Service ID is required').max(128),

  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be HH:MM format'),

  // Accepted for current frontend compatibility, but verified against service duration.
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'End time must be HH:MM format')
    .optional(),

  customerName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  customerEmail: z.string().trim().email('Invalid email address').max(254),
  customerPhone: z.string().trim().max(20).optional().default(''),
  customerNotes: z.string().trim().max(500).optional().default(''),
})

const confirmationLookupSchema = z.object({
  confirmationNumber: z
    .string()
    .trim()
    .min(8, 'Confirmation number is too short')
    .max(32, 'Confirmation number is too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid confirmation number'),
  customerEmail: z.string().trim().email('Customer email is required').max(254),
})

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  return forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown'
}

function serializeAppointment(appointment: {
  id: string
  status: string
  startTime: Date
  endTime: Date
  duration: number
  customerNotes: string | null
  createdAt: Date
  service: {
    name: string
    price: unknown
    duration: number
  }
  customer: {
    name: string
    email: string
  }
  business: {
    name: string
    timezone: string
    address: unknown
    slug?: string
  }
}) {
  return {
    id: appointment.id,
    confirmationNumber: appointment.id.slice(0, 8).toUpperCase(),
    status: appointment.status,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    duration: appointment.duration,
    service: {
      name: appointment.service.name,
      price: Number(appointment.service.price),
      duration: appointment.service.duration,
    },
    customer: {
      name: appointment.customer.name,
      email: appointment.customer.email,
    },
    business: {
      name: appointment.business.name,
      timezone: appointment.business.timezone,
      address: appointment.business.address,
      ...(appointment.business.slug && { slug: appointment.business.slug }),
    },
    notes: appointment.customerNotes,
    createdAt: appointment.createdAt,
  }
}

async function handlePost(request: NextRequest) {
  try {
    const idempotencyKey = request.headers.get('idempotency-key')?.trim()
    if (idempotencyKey && !/^[A-Za-z0-9_-]{16,128}$/.test(idempotencyKey)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Idempotency-Key header' },
        { status: 400 }
      )
    }

    const body = await request.json()

    const validationResult = createBookingSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const data = validationResult.data
    const customerEmail = data.customerEmail.toLowerCase()
    const clientIp = getClientIp(request)
    const rateLimit = await checkRateLimit(
      `booking-create:${clientIp}:${data.businessId}`,
      'booking:create'
    )

    if (!rateLimit.allowed) {
      const resetInSeconds = Math.max(
        1,
        Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)
      )

      return NextResponse.json(
        { success: false, error: 'Too many booking attempts. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': Math.floor(rateLimit.resetAt.getTime() / 1000).toString(),
            'Retry-After': (rateLimit.retryAfter || resetInSeconds).toString(),
          },
        }
      )
    }

    const business = await prisma.business.findUnique({
      where: { id: data.businessId },
      select: {
        id: true,
        name: true,
        timezone: true,
        email: true,
        address: true,
      },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const service = await prisma.service.findFirst({
      where: {
        id: data.serviceId,
        businessId: data.businessId,
        active: true,
      },
      select: {
        id: true,
        name: true,
        duration: true,
        requiresApproval: true,
      },
    })

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found or not available' },
        { status: 404 }
      )
    }

    let startDateTime: Date
    try {
      startDateTime = zonedDateTimeToUtc(data.date, data.startTime, business.timezone)
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Invalid date or time',
        },
        { status: 400 }
      )
    }

    if (startDateTime < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Cannot book appointments in the past' },
        { status: 400 }
      )
    }

    if (data.endTime) {
      let suppliedEndDateTime: Date
      try {
        suppliedEndDateTime = zonedDateTimeToUtc(data.date, data.endTime, business.timezone)
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: error instanceof Error ? error.message : 'Invalid end time',
          },
          { status: 400 }
        )
      }

      const expectedEndDateTime = new Date(startDateTime.getTime() + service.duration * 60 * 1000)

      if (suppliedEndDateTime.getTime() !== expectedEndDateTime.getTime()) {
        return NextResponse.json(
          { success: false, error: 'End time does not match service duration' },
          { status: 400 }
        )
      }
    }

    const result = await createBooking(
      data.businessId,
      data.serviceId,
      data.date,
      data.startTime,
      {
        name: data.customerName,
        email: customerEmail,
        phone: data.customerPhone || null,
        notes: data.customerNotes || null,
      },
      {
        status: service.requiresApproval ? 'PENDING' : 'CONFIRMED',
        bookingSource: 'WEBSITE',
        bookingIp: clientIp,
        idempotencyKey,
      }
    )

    if (!result.success || !result.appointment?.id) {
      logger.warn('booking.api.rejected', {
        businessId: data.businessId,
        serviceId: data.serviceId,
        reason: result.idempotencyConflict
          ? 'idempotency_conflict'
          : result.conflicts
            ? 'schedule_conflict'
            : 'creation_failed',
      })
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to create booking',
          conflicts: result.conflicts,
        },
        { status: result.conflicts || result.idempotencyConflict ? 409 : 400 }
      )
    }

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: result.appointment.id,
        businessId: data.businessId,
      },
      select: {
        id: true,
        status: true,
        startTime: true,
        endTime: true,
        duration: true,
        customerNotes: true,
        customerPhone: true,
        totalAmount: true,
        createdAt: true,
        service: {
          select: {
            name: true,
            price: true,
            duration: true,
            currency: true,
          },
        },
        customer: {
          select: {
            name: true,
            email: true,
          },
        },
        business: {
          select: {
            name: true,
            timezone: true,
            email: true,
            address: true,
            slug: true,
            owner: {
              select: { email: true },
            },
          },
        },
      },
    })

    if (!appointment) {
      logger.error('booking.api.retrieval_failed', {
        businessId: data.businessId,
        bookingId: result.appointment.id,
      })
      return NextResponse.json(
        { success: false, error: 'Booking created but could not be retrieved' },
        { status: 500 }
      )
    }

    if (!result.replayed) {
      const notifications = await sendBookingCreatedNotifications({
        bookingId: appointment.id,
        status: appointment.status,
        customerName: appointment.customer.name,
        customerEmail: appointment.customer.email,
        customerPhone: appointment.customerPhone,
        customerNotes: appointment.customerNotes,
        businessName: appointment.business.name,
        businessEmail: appointment.business.email,
        businessOwnerEmail: appointment.business.owner.email,
        businessAddress: appointment.business.address,
        serviceName: appointment.service.name,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        timezone: appointment.business.timezone,
        totalAmount: Number(appointment.totalAmount),
        currency: appointment.service.currency,
      })
      const allNotificationsSent = notifications.customer.success && notifications.business.success

      logger[allNotificationsSent ? 'info' : 'warn']('booking.api.notifications_completed', {
        businessId: data.businessId,
        bookingId: appointment.id,
        customerSent: notifications.customer.success,
        businessSent: notifications.business.success,
      })
    } else {
      logger.info('booking.api.notifications_skipped', {
        businessId: data.businessId,
        bookingId: appointment.id,
        reason: 'idempotency_replay',
      })
    }

    logger.info('booking.api.succeeded', {
      businessId: data.businessId,
      serviceId: data.serviceId,
      bookingId: appointment.id,
      replayed: Boolean(result.replayed),
    })
    return NextResponse.json(
      {
        success: true,
        data: serializeAppointment(appointment),
      },
      {
        status: result.replayed ? 200 : 201,
        headers: result.replayed ? { 'Idempotency-Replayed': 'true' } : undefined,
      }
    )
  } catch (error) {
    logApiError('booking-create-api', error, { area: 'booking' })
    return NextResponse.json({ success: false, error: 'Failed to create booking' }, { status: 500 })
  }
}

async function handleGet(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const validation = confirmationLookupSchema.safeParse({
      confirmationNumber: searchParams.get('confirmationNumber') || '',
      customerEmail: searchParams.get('customerEmail') || searchParams.get('email') || '',
    })

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Confirmation number and customer email are required',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const confirmationNumber = validation.data.confirmationNumber.toLowerCase()
    const customerEmail = validation.data.customerEmail.toLowerCase()

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: {
          startsWith: confirmationNumber,
        },
        customerEmail,
      },
      select: {
        id: true,
        status: true,
        startTime: true,
        endTime: true,
        duration: true,
        customerNotes: true,
        createdAt: true,
        service: {
          select: {
            name: true,
            price: true,
            duration: true,
          },
        },
        customer: {
          select: {
            name: true,
            email: true,
          },
        },
        business: {
          select: {
            name: true,
            timezone: true,
            address: true,
            slug: true,
          },
        },
      },
    })

    if (!appointment) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: serializeAppointment(appointment),
    })
  } catch (error) {
    logApiError('booking-fetch-api', error, { area: 'booking' })
    return NextResponse.json({ success: false, error: 'Failed to fetch booking' }, { status: 500 })
  }
}

export function POST(request: NextRequest) {
  return withRequestLogging(request, () => handlePost(request))
}

export function GET(request: NextRequest) {
  return withRequestLogging(request, () => handleGet(request))
}
