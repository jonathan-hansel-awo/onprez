import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { createAppointmentSchema, appointmentQuerySchema } from '@/lib/validation/booking'
import { createBooking } from '@/lib/services/booking'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import {
  resolveReadableBusinessContext,
  resolveWritableBusinessContext,
} from '@/lib/auth/business-route-utils'
import { addCalendarDays, DEFAULT_TIMEZONE, zonedDateTimeToUtc } from '@/lib/utils/timezone'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const context = await resolveReadableBusinessContext(user.id, request)
    const businessId = context.businessId
    const timezone = context.business.timezone || DEFAULT_TIMEZONE

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

    const where: Prisma.AppointmentWhereInput = {
      businessId,
      ...(status && { status }),
      ...(customerId && { customerId }),
      ...(serviceId && { serviceId }),
    }

    if (startDate || endDate) {
      where.startTime = {
        ...(startDate && { gte: zonedDateTimeToUtc(startDate, '00:00', timezone) }),
        ...(endDate && {
          lt: zonedDateTimeToUtc(addCalendarDays(endDate, 1), '00:00', timezone),
        }),
      }
    }

    const skip = (page - 1) * limit

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        select: {
          id: true,
          startTime: true,
          endTime: true,
          duration: true,
          status: true,
          previousStatus: true,
          customerName: true,
          customerEmail: true,
          customerPhone: true,
          customerNotes: true,
          businessNotes: true,
          totalAmount: true,
          paymentStatus: true,
          createdAt: true,
          updatedAt: true,
          service: {
            select: {
              id: true,
              name: true,
              price: true,
              duration: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
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
        appointments: appointments.map(appointment => ({
          ...appointment,
          totalAmount: Number(appointment.totalAmount),
          service: {
            ...appointment.service,
            price: Number(appointment.service.price),
          },
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

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

    const context = await resolveWritableBusinessContext(user.id, request, [
      'ADMIN',
      'MANAGER',
      'STAFF',
    ])

    const body = await request.json()
    const validation = createAppointmentSchema.safeParse({
      ...body,
      businessId: context.businessId,
    })

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

    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        businessId: context.businessId,
        active: true,
      },
      select: {
        id: true,
      },
    })

    if (!service) {
      return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 })
    }

    const result = await createBooking(
      context.businessId,
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
        { status: result.conflicts ? 409 : 400 }
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
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Create appointment error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
}
