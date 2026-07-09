import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { resolveReadableBusinessContext } from '@/lib/auth/business-route-utils'
import { startOfWeek, endOfWeek, addDays, format } from 'date-fns'

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

function parseDateParam(dateParam: string | null) {
  if (!dateParam) {
    return new Date()
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return null
  }

  return new Date(`${dateParam}T00:00:00`)
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const context = await resolveReadableBusinessContext(user.id)
    const businessId = context.businessId
    const businessHours = getBusinessHours(context.business.settings)

    const { searchParams } = new URL(request.url)
    const targetDate = parseDateParam(searchParams.get('date'))

    if (!targetDate) {
      return NextResponse.json({ success: false, error: 'Invalid date format' }, { status: 400 })
    }

    const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 })
    weekEnd.setHours(23, 59, 59, 999)

    const bookings = await prisma.appointment.findMany({
      where: {
        businessId,
        startTime: {
          gte: weekStart,
          lte: weekEnd,
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
      const day = addDays(weekStart, i)
      const dateKey = format(day, 'yyyy-MM-dd')
      bookingsByDay[dateKey] = []
    }

    formattedBookings.forEach(booking => {
      const dateKey = format(new Date(booking.startTime), 'yyyy-MM-dd')

      if (bookingsByDay[dateKey]) {
        bookingsByDay[dateKey].push(booking)
      }
    })

    const days = []

    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i)
      const dateKey = format(day, 'yyyy-MM-dd')
      const dayOfWeek = dayNames[day.getDay()]
      const dayBookings = bookingsByDay[dateKey] || []

      days.push({
        date: dateKey,
        dayOfWeek,
        dayName: format(day, 'EEE'),
        dayNumber: format(day, 'd'),
        isToday: format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'),
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
        weekStart: format(weekStart, 'yyyy-MM-dd'),
        weekEnd: format(weekEnd, 'yyyy-MM-dd'),
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
