import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { createAppointmentSchema, appointmentQuerySchema } from '@/lib/validation/booking'
import { createBooking } from '@/lib/services/booking'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const business = await prisma.business.findFirst({
      where: { ownerId: user.id },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const queryParams = {
      status: searchParams.get('status') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      customerId: searchParams.get('customerId') || undefined,
      serviceId: searchParams.get('serviceId') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    }

    const validation = appointmentQuerySchema.safeParse(queryParams)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { status, startDate, endDate, customerId, serviceId, page, limit, sortBy, sortOrder } =
      validation.data

    const skip = (page - 1) * limit

    const where = {
      businessId: business.id,
      ...(status && { status }),
      ...(customerId && { customerId }),
      ...(serviceId && { serviceId }),
      ...(startDate && { startTime: { gte: new Date(startDate) } }),
      ...(endDate && { startTime: { lte: new Date(endDate + 'T23:59:59') } }),
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          service: { select: { id: true, name: true, price: true, duration: true } },
          customer: { select: { id: true, name: true, email: true, phone: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        appointments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Get appointments error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch appointments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const business = await prisma.business.findFirst({
      where: { ownerId: user.id },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const body = await request.json()
    const validation = createAppointmentSchema.safeParse({ ...body, businessId: business.id })

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    const {
      serviceId,
      date,
      startTime,
      customerName,
      customerEmail,
      customerPhone,
      customerNotes,
    } = validation.data

    const result = await createBooking(
      business.id,
      serviceId,
      date,
      startTime,
      {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        notes: customerNotes,
      },
      {
        status: 'CONFIRMED',
        bookingSource: 'dashboard',
        bookingIp:
          request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      }
    )

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, conflicts: result.conflicts },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Appointment created successfully',
        data: { appointment: result.appointment },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create appointment error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
}
