import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { resolveReadableBusinessContext } from '@/lib/auth/business-route-utils'
import { DEFAULT_TIMEZONE, getDateInTimezone, getUtcDayRange } from '@/lib/utils/timezone'

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function getBusinessHours(settings: unknown): Record<string, unknown> | null {
  const settingsRecord = toRecord(settings)
  const businessHours = settingsRecord.businessHours

  return businessHours && typeof businessHours === 'object' && !Array.isArray(businessHours)
    ? (businessHours as Record<string, unknown>)
    : null
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const context = await resolveReadableBusinessContext(user.id, request)
    const businessId = context.businessId
    const businessHours = getBusinessHours(context.business.settings)
    const timezone = context.business.timezone || DEFAULT_TIMEZONE

    const { searchParams } = new URL(request.url)
    const targetDate = searchParams.get('date') || getDateInTimezone(new Date(), timezone)

    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      return NextResponse.json({ success: false, error: 'Invalid date format' }, { status: 400 })
    }

    const { start: startOfDay, end: endOfDay } = getUtcDayRange(targetDate, timezone)

    const bookings = await prisma.appointment.findMany({
      where: {
        businessId,
        startTime: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        duration: true,
        status: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        customerNotes: true,
        businessNotes: true,
        totalAmount: true,
        paymentStatus: true,
        createdAt: true,
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
      orderBy: {
        startTime: 'asc',
      },
    })

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayOfWeek = dayNames[new Date(`${targetDate}T00:00:00.000Z`).getUTCDay()]

    const stats = {
      total: bookings.length,
      confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
      pending: bookings.filter(b => b.status === 'PENDING').length,
      completed: bookings.filter(b => b.status === 'COMPLETED').length,
      cancelled: bookings.filter(b => b.status === 'CANCELLED').length,
    }

    return NextResponse.json({
      success: true,
      data: {
        date: targetDate,
        dayOfWeek,
        businessHours: businessHours?.[dayOfWeek] || null,
        bookings: bookings.map(booking => ({
          ...booking,
          totalAmount: Number(booking.totalAmount),
          service: {
            ...booking.service,
            price: Number(booking.service.price),
          },
        })),
        stats,
      },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Day bookings error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch day bookings' },
      { status: 500 }
    )
  }
}
