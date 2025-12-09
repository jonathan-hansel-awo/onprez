import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { cookies } from 'next/headers'
import {
  createMultiDayAppointment,
  generateMultiDayDates,
  generateMultiDaySlots,
  checkMultiDayAvailability,
} from '@/lib/services/multi-day-booking'
import { prisma } from '@/lib/prisma'

// POST - Create multi-day appointment
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('accessToken')?.value

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()

    // Verify user owns the business
    const business = await prisma.business.findFirst({
      where: {
        id: body.businessId,
        ownerId: payload.userId,
      },
    })

    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found or unauthorized' },
        { status: 403 }
      )
    }

    const result = await createMultiDayAppointment(body)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          conflicts: result.conflicts,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          appointments: result.appointments,
          totalSessions: result.appointments?.length,
          message: `Created ${result.appointments?.length} appointments`,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create multi-day appointment error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create appointments' },
      { status: 500 }
    )
  }
}

// GET - Preview multi-day dates (without creating)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const businessId = searchParams.get('businessId')
    const serviceId = searchParams.get('serviceId')
    const startDate = searchParams.get('startDate')
    const startTime = searchParams.get('startTime') || '09:00'
    const patternType = searchParams.get('patternType') as 'consecutive' | 'weekly' | 'custom'
    const consecutiveDays = parseInt(searchParams.get('consecutiveDays') || '2')
    const weeklyDays = searchParams.get('weeklyDays')?.split(',').map(Number)
    const weekCount = parseInt(searchParams.get('weekCount') || '1')
    const customDates = searchParams.get('customDates')?.split(',')
    const checkAvailability = searchParams.get('checkAvailability') === 'true'

    if (!businessId || !startDate || !patternType) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Build pattern
    const pattern = {
      type: patternType,
      consecutiveDays: patternType === 'consecutive' ? consecutiveDays : undefined,
      weeklyDays: patternType === 'weekly' ? weeklyDays : undefined,
      weekCount: patternType === 'weekly' ? weekCount : undefined,
      customDates: patternType === 'custom' ? customDates : undefined,
    }

    // Generate dates
    const dates = generateMultiDayDates(startDate, pattern)

    // Get service duration if provided
    let duration = 60
    if (serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        select: { duration: true },
      })
      if (service) {
        duration = service.duration
      }
    }

    // Generate slots
    const slots = generateMultiDaySlots(dates, startTime, duration)

    // Check availability if requested
    let availability = null
    if (checkAvailability) {
      availability = await checkMultiDayAvailability(businessId, slots)
    }

    return NextResponse.json({
      success: true,
      data: {
        pattern,
        dates,
        slots,
        totalSessions: slots.length,
        ...(availability && { availability }),
      },
    })
  } catch (error) {
    console.error('Preview multi-day dates error:', error)
    return NextResponse.json({ success: false, error: 'Failed to generate dates' }, { status: 500 })
  }
}
