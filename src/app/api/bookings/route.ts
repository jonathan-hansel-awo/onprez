import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createBooking } from '@/lib/services/booking'
import { z } from 'zod'

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

function parseDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`)
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

export async function POST(request: NextRequest) {
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

    const startDateTime = parseDateTime(data.date, data.startTime)

    if (Number.isNaN(startDateTime.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date or time format' },
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
      const suppliedEndDateTime = parseDateTime(data.date, data.endTime)

      if (Number.isNaN(suppliedEndDateTime.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid end time format' },
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
        bookingIp: getClientIp(request),
        idempotencyKey,
      }
    )

    if (!result.success || !result.appointment?.id) {
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
      return NextResponse.json(
        { success: false, error: 'Booking created but could not be retrieved' },
        { status: 500 }
      )
    }

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
    console.error('Error creating booking:', error)
    return NextResponse.json({ success: false, error: 'Failed to create booking' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
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
    console.error('Error fetching booking:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch booking' }, { status: 500 })
  }
}
