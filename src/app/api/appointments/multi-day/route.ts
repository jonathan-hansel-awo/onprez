import { NextRequest, NextResponse } from 'next/server'
import {
  createMultiDayAppointment,
  generateMultiDayDates,
  generateMultiDaySlots,
  checkMultiDayAvailability,
} from '@/lib/services/multi-day-booking'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import {
  businessAuthErrorResponse,
  requireBusinessAccess,
  requireBusinessRole,
} from '@/lib/auth/business-access'

type PatternType = 'consecutive' | 'weekly' | 'custom'

function parsePositiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number.parseInt(value || String(fallback), 10)

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback
  }

  return Math.min(parsed, max)
}

function parsePatternType(value: string | null): PatternType | null {
  if (value === 'consecutive' || value === 'weekly' || value === 'custom') {
    return value
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.businessId || typeof body.businessId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Business ID is required' },
        { status: 400 }
      )
    }

    const context = await requireBusinessRole(user.id, body.businessId, [
      'ADMIN',
      'MANAGER',
      'STAFF',
    ])

    if (body.serviceId) {
      const service = await prisma.service.findFirst({
        where: {
          id: body.serviceId,
          businessId: context.businessId,
          active: true,
        },
        select: { id: true },
      })

      if (!service) {
        return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 })
      }
    }

    const result = await createMultiDayAppointment({
      ...body,
      businessId: context.businessId,
    })

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          conflicts: result.conflicts,
        },
        { status: result.conflicts ? 409 : 400 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          appointments: result.appointments,
          totalSessions: result.appointments?.length || 0,
          message: `Created ${result.appointments?.length || 0} appointments`,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Create multi-day appointment error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create appointments' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    const businessId = searchParams.get('businessId')
    const serviceId = searchParams.get('serviceId')
    const startDate = searchParams.get('startDate')
    const startTime = searchParams.get('startTime') || '09:00'
    const patternType = parsePatternType(searchParams.get('patternType'))
    const consecutiveDays = parsePositiveInt(searchParams.get('consecutiveDays'), 2, 31)
    const weeklyDays = searchParams
      .get('weeklyDays')
      ?.split(',')
      .map(Number)
      .filter(day => Number.isInteger(day) && day >= 0 && day <= 6)
    const weekCount = parsePositiveInt(searchParams.get('weekCount'), 1, 52)
    const customDates = searchParams.get('customDates')?.split(',').filter(Boolean)
    const shouldCheckAvailability = searchParams.get('checkAvailability') === 'true'

    if (!businessId || !startDate || !patternType) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    await requireBusinessAccess(user.id, businessId)

    const pattern = {
      type: patternType,
      consecutiveDays: patternType === 'consecutive' ? consecutiveDays : undefined,
      weeklyDays: patternType === 'weekly' ? weeklyDays : undefined,
      weekCount: patternType === 'weekly' ? weekCount : undefined,
      customDates: patternType === 'custom' ? customDates : undefined,
    }

    const dates = generateMultiDayDates(startDate, pattern)

    let duration = 60

    if (serviceId) {
      const service = await prisma.service.findFirst({
        where: {
          id: serviceId,
          businessId,
          active: true,
        },
        select: {
          duration: true,
        },
      })

      if (!service) {
        return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 })
      }

      duration = service.duration
    }

    const slots = generateMultiDaySlots(dates, startTime, duration)

    const availability = shouldCheckAvailability
      ? await checkMultiDayAvailability(businessId, slots)
      : null

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
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Preview multi-day dates error:', error)
    return NextResponse.json({ success: false, error: 'Failed to generate dates' }, { status: 500 })
  }
}
