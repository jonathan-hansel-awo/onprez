import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for booking creation
const createBookingSchema = z.object({
  businessId: z.string().min(1, 'Business ID is required'),
  serviceId: z.string().min(1, 'Service ID is required'),

  // Date/time
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be HH:MM format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be HH:MM format'),

  // Customer info
  customerName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  customerEmail: z.string().email('Invalid email address'),
  customerPhone: z.string().max(20).optional().default(''),
  customerNotes: z.string().max(500).optional().default(''),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
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

    // Verify business exists
    const business = await prisma.business.findUnique({
      where: { id: data.businessId },
      select: { id: true, name: true, timezone: true, email: true, address: true },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    // Verify service exists and belongs to business
    const service = await prisma.service.findFirst({
      where: {
        id: data.serviceId,
        businessId: data.businessId,
        active: true,
      },
      select: {
        id: true,
        name: true,
        price: true,
        duration: true,
        requiresDeposit: true,
        depositAmount: true,
      },
    })

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found or not available' },
        { status: 404 }
      )
    }

    // Build start and end DateTime
    const startDateTime = new Date(`${data.date}T${data.startTime}:00`)
    const endDateTime = new Date(`${data.date}T${data.endTime}:00`)

    // Validate dates
    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date or time format' },
        { status: 400 }
      )
    }

    if (startDateTime >= endDateTime) {
      return NextResponse.json(
        { success: false, error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    if (startDateTime < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Cannot book appointments in the past' },
        { status: 400 }
      )
    }

    // Check for conflicting appointments
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        businessId: data.businessId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          {
            // New appointment starts during existing appointment
            startTime: { lte: startDateTime },
            endTime: { gt: startDateTime },
          },
          {
            // New appointment ends during existing appointment
            startTime: { lt: endDateTime },
            endTime: { gte: endDateTime },
          },
          {
            // New appointment completely contains existing appointment
            startTime: { gte: startDateTime },
            endTime: { lte: endDateTime },
          },
        ],
      },
    })

    if (conflictingAppointment) {
      return NextResponse.json(
        { success: false, error: 'This time slot is no longer available' },
        { status: 409 }
      )
    }

    // Find or create customer
    let customer = await prisma.customer.findFirst({
      where: {
        businessId: data.businessId,
        email: data.customerEmail.toLowerCase(),
      },
    })

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          businessId: data.businessId,
          email: data.customerEmail.toLowerCase(),
          name: data.customerName,
          phone: data.customerPhone || null,
        },
      })
    } else {
      // Update customer info if changed
      if (customer.name !== data.customerName || customer.phone !== (data.customerPhone || null)) {
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: {
            name: data.customerName,
            phone: data.customerPhone || null,
          },
        })
      }
    }

    // Calculate duration in minutes
    const durationMs = endDateTime.getTime() - startDateTime.getTime()
    const durationMinutes = Math.round(durationMs / (1000 * 60))

    // Get client IP for booking source tracking
    const forwardedFor = request.headers.get('x-forwarded-for')
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown'

    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        businessId: data.businessId,
        serviceId: data.serviceId,
        customerId: customer.id,
        startTime: startDateTime,
        endTime: endDateTime,
        duration: durationMinutes,
        timezone: business.timezone,
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        customerName: data.customerName,
        customerEmail: data.customerEmail.toLowerCase(),
        customerPhone: data.customerPhone || null,
        customerNotes: data.customerNotes || null,
        totalAmount: service.price,
        requiresDeposit: service.requiresDeposit,
        depositAmount: service.depositAmount,
        bookingSource: 'WEBSITE',
        bookingIp: clientIp,
      },
      include: {
        service: {
          select: { name: true, price: true, duration: true },
        },
        customer: {
          select: { name: true, email: true, phone: true },
        },
        business: {
          select: { name: true, timezone: true, address: true },
        },
      },
    })

    // Update customer booking stats
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        totalBookings: { increment: 1 },
        lastBookingAt: new Date(),
        firstBookingAt: customer.firstBookingAt || new Date(),
      },
    })

    // TODO: Send confirmation email (Milestone 8.9)
    // await sendBookingConfirmationEmail({...})

    return NextResponse.json(
      {
        success: true,
        data: {
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
          },
          notes: appointment.customerNotes,
          createdAt: appointment.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json({ success: false, error: 'Failed to create booking' }, { status: 500 })
  }
}

// GET - Fetch booking by confirmation number (public) or list bookings (auth required)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const confirmationNumber = searchParams.get('confirmationNumber')

    // Lookup by confirmation number (public - for booking confirmation page)
    if (confirmationNumber) {
      const appointment = await prisma.appointment.findFirst({
        where: {
          id: { startsWith: confirmationNumber.toLowerCase() },
        },
        include: {
          service: {
            select: { name: true, price: true, duration: true },
          },
          customer: {
            select: { name: true, email: true, phone: true },
          },
          business: {
            select: { name: true, timezone: true, address: true, slug: true },
          },
        },
      })

      if (!appointment) {
        return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        data: {
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
            slug: appointment.business.slug,
          },
          notes: appointment.customerNotes,
          createdAt: appointment.createdAt,
        },
      })
    }

    // TODO: Add authentication check for listing bookings
    return NextResponse.json(
      { success: false, error: 'Confirmation number required or authentication needed' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch bookings' }, { status: 500 })
  }
}
