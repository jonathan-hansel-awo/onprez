import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { resolveReadableBusinessContext } from '@/lib/auth/business-route-utils'
import { prisma } from '@/lib/prisma'
import { DEFAULT_TIMEZONE, getDateInTimezone, zonedDateTimeToUtc } from '@/lib/utils/timezone'

function nextMonth(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  return new Date(Date.UTC(year, monthNumber, 1)).toISOString().slice(0, 7)
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const context = await resolveReadableBusinessContext(user.id, request)
    const timezone = context.business.timezone || DEFAULT_TIMEZONE
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') || getDateInTimezone(new Date(), timezone).slice(0, 7)

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return NextResponse.json({ success: false, error: 'Invalid month format' }, { status: 400 })
    }

    const monthStart = `${month}-01`
    const followingMonth = nextMonth(month)
    const nextMonthStart = `${followingMonth}-01`
    const rangeStart = zonedDateTimeToUtc(monthStart, '00:00', timezone)
    const rangeEnd = zonedDateTimeToUtc(nextMonthStart, '00:00', timezone)
    const dateStart = new Date(`${monthStart}T00:00:00.000Z`)
    const dateEnd = new Date(`${nextMonthStart}T00:00:00.000Z`)

    const [bookings, specialDates] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          businessId: context.businessId,
          status: { in: ['PENDING', 'CONFIRMED'] },
          startTime: { gte: rangeStart, lt: rangeEnd },
        },
        select: { startTime: true, status: true },
        orderBy: { startTime: 'asc' },
      }),
      prisma.specialDate.findMany({
        where: {
          businessId: context.businessId,
          OR: [{ date: { gte: dateStart, lt: dateEnd } }, { isRecurring: true }],
        },
        select: {
          id: true,
          date: true,
          name: true,
          isClosed: true,
          openTime: true,
          closeTime: true,
          notes: true,
          isRecurring: true,
        },
        orderBy: { date: 'asc' },
      }),
    ])

    const bookingCounts: Record<string, number> = {}

    for (const booking of bookings) {
      const date = getDateInTimezone(new Date(booking.startTime), timezone)
      bookingCounts[date] = (bookingCounts[date] || 0) + 1
    }

    const targetYear = month.slice(0, 4)
    const visibleSpecialDates = specialDates
      .map(specialDate => {
        const storedDate = specialDate.date.toISOString().slice(0, 10)
        const visibleDate = specialDate.isRecurring
          ? `${targetYear}-${storedDate.slice(5)}`
          : storedDate
        return { ...specialDate, date: visibleDate }
      })
      .filter(specialDate => specialDate.date.startsWith(month))

    return NextResponse.json({
      success: true,
      data: {
        month,
        timezone,
        bookingCounts,
        specialDates: visibleSpecialDates,
      },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Month calendar error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch month calendar' },
      { status: 500 }
    )
  }
}
