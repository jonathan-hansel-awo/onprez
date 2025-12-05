import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAvailabilitySchema } from '@/lib/validation/booking'
import { checkBookingConflicts, validateBookingTime } from '@/lib/services/booking'
import { DEFAULT_BUSINESS_SETTINGS } from '@/types/business'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = checkAvailabilitySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { businessId, serviceId, date, startTime, duration, excludeAppointmentId } =
      validation.data

    // Get business and service details
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    let serviceDuration = duration

    if (serviceId && !duration) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        select: { duration: true, bufferTime: true },
      })

      if (!service) {
        return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 })
      }

      serviceDuration = service.duration
    }

    if (!serviceDuration) {
      return NextResponse.json(
        { success: false, error: 'Duration or serviceId is required' },
        { status: 400 }
      )
    }

    const settings = { ...DEFAULT_BUSINESS_SETTINGS, ...((business.settings as object) || {}) }
    const timezone = business.timezone || 'Europe/London'
    const bufferTime = settings.bufferTime || 0

    // Validate booking time first
    const timeValidation = await validateBookingTime(businessId, date, startTime, serviceDuration)

    if (!timeValidation.valid) {
      return NextResponse.json({
        success: true,
        data: {
          available: false,
          reason: timeValidation.reason,
        },
      })
    }

    // Check for conflicts
    const conflictCheck = await checkBookingConflicts(
      businessId,
      date,
      startTime,
      serviceDuration,
      bufferTime,
      timezone,
      excludeAppointmentId
    )

    return NextResponse.json({
      success: true,
      data: conflictCheck,
    })
  } catch (error) {
    console.error('Check conflicts error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check conflicts' },
      { status: 500 }
    )
  }
}
