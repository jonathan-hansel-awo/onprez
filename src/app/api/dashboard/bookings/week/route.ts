import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { resolveReadableBusinessContext } from '@/lib/auth/business-route-utils'
import {
  addCalendarDays,
  DEFAULT_TIMEZONE,
  getDateInTimezone,
  zonedDateTimeToUtc,
} from '@/lib/utils/timezone'

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

    const targetDay = new Date(`${targetDate}T00:00:00.000Z`).getUTCDay()
    const weekStart = addCalendarDays(targetDate, -(targetDay === 0 ? 6 : targetDay - 1))
    const weekEnd = addCalendarDays(weekStart, 6)
    const rangeStart = zonedDateTimeToUtc(weekStart, '00:00', timezone)
    const rangeEnd = zonedDateTimeToUtc(addCalendarDays(weekEnd, 1), '00:00', timezone)

    const bookings = await prisma.appointment.findMany({
      where: {
        businessId,
        startTime: {
          gte: rangeStart,
          lt: rangeEnd,
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

    const formattedBookings = bookings.map(booking => ({
      ...booking,
      totalAmount: Number(booking.totalAmount),
      service: {
        ...booking.service,
        price: Number(booking.service.price),
      },
    }))

    const bookingsByDay: Record<string, typeof formattedBookings> = {}
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

    for (let i = 0; i < 7; i++) {
      const dateKey = addCalendarDays(weekStart, i)
      bookingsByDay[dateKey] = []
    }

    formattedBookings.forEach(booking => {
      const dateKey = getDateInTimezone(new Date(booking.startTime), timezone)

      if (bookingsByDay[dateKey]) {
        bookingsByDay[dateKey].push(booking)
      }
    })

    const days = []

    for (let i = 0; i < 7; i++) {
      const dateKey = addCalendarDays(weekStart, i)
      const day = new Date(`${dateKey}T00:00:00.000Z`)
      const dayOfWeek = dayNames[day.getUTCDay()]
      const dayBookings = bookingsByDay[dateKey] || []

      days.push({
        date: dateKey,
        dayOfWeek,
        dayName: new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' }).format(
          day
        ),
        dayNumber: String(day.getUTCDate()),
        isToday: dateKey === getDateInTimezone(new Date(), timezone),
        businessHours: businessHours?.[dayOfWeek] || null,
        bookings: dayBookings,
        stats: {
          total: dayBookings.length,
          confirmed: dayBookings.filter(b => b.status === 'CONFIRMED').length,
          pending: dayBookings.filter(b => b.status === 'PENDING').length,
        },
      })
    }

    const stats = {
      total: formattedBookings.length,
      confirmed: formattedBookings.filter(b => b.status === 'CONFIRMED').length,
      pending: formattedBookings.filter(b => b.status === 'PENDING').length,
      completed: formattedBookings.filter(b => b.status === 'COMPLETED').length,
      cancelled: formattedBookings.filter(b => b.status === 'CANCELLED').length,
    }

    return NextResponse.json({
      success: true,
      data: {
        weekStart,
        weekEnd,
        days,
        stats,
      },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Week bookings error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch week bookings' },
      { status: 500 }
    )
  }
}
