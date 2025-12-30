import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'

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
      targetDate.setHours(0, 0, 0, 0)
    }

    // Get start and end of day
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

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

    // Fetch bookings for the day
    const bookings = await prisma.appointment.findMany({
      where: {
        businessId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
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

    // Get day of week for business hours
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayOfWeek = dayNames[targetDate.getDay()]

    // Calculate stats for the day
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
        date: targetDate.toISOString().split('T')[0],
        dayOfWeek,
        businessHours: businessHours?.[dayOfWeek] || null,
        bookings,
        stats,
      },
    })
  } catch (error) {
    console.error('Day bookings error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch day bookings' },
      { status: 500 }
    )
  }
}
