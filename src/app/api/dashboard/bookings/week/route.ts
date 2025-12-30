import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { startOfWeek, endOfWeek, addDays, format } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date') // YYYY-MM-DD format

    // Parse date or default to today
    let targetDate: Date
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      targetDate = new Date(dateParam + 'T00:00:00')
    } else {
      targetDate = new Date()
    }

    // Get start and end of week (Monday to Sunday)
    const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 }) // Monday
    const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 }) // Sunday
    weekEnd.setHours(23, 59, 59, 999)

    // Get user's business
    let businessId: string | null = null
    let businessHours: Record<string, unknown> | null = null

    const ownedBusiness = await prisma.business.findFirst({
      where: { ownerId: user.id },
      select: { id: true, settings: true },
    })

    if (ownedBusiness) {
      businessId = ownedBusiness.id
      businessHours =
        ((ownedBusiness.settings as Record<string, unknown>)?.businessHours as Record<
          string,
          unknown
        >) || null
    } else {
      const membership = await prisma.businessMember.findFirst({
        where: { userId: user.id },
        include: {
          business: {
            select: { id: true, settings: true },
          },
        },
      })
      if (membership) {
        businessId = membership.businessId
        businessHours =
          ((membership.business.settings as Record<string, unknown>)?.businessHours as Record<
            string,
            unknown
          >) || null
      }
    }

    if (!businessId) {
      return NextResponse.json({ success: false, error: 'No business found' }, { status: 404 })
    }

    // Fetch bookings for the week
    const bookings = await prisma.appointment.findMany({
      where: {
        businessId,
        startTime: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      include: {
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

    // Group bookings by day
    const bookingsByDay: Record<string, typeof bookings> = {}
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

    // Initialize all 7 days
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i)
      const dateKey = format(day, 'yyyy-MM-dd')
      bookingsByDay[dateKey] = []
    }

    // Group bookings
    bookings.forEach(booking => {
      const dateKey = format(new Date(booking.startTime), 'yyyy-MM-dd')
      if (bookingsByDay[dateKey]) {
        bookingsByDay[dateKey].push(booking)
      }
    })

    // Build days array with business hours
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

    // Overall stats
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
        weekStart: format(weekStart, 'yyyy-MM-dd'),
        weekEnd: format(weekEnd, 'yyyy-MM-dd'),
        days,
        stats,
      },
    })
  } catch (error) {
    console.error('Week bookings error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch week bookings' },
      { status: 500 }
    )
  }
}
