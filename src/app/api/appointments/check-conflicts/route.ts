import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { checkAvailabilitySchema } from '@/lib/validation/booking'
import { checkBookingConflicts, validateBookingTime } from '@/lib/services/booking'
import { DEFAULT_BUSINESS_SETTINGS } from '@/types/business'
import { businessAuthErrorResponse, requireBusinessAccess } from '@/lib/auth/business-access'

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

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        settings: true,
        timezone: true,
      },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    let serviceDuration = duration
    let serviceBufferTime: number | null = null

    if (serviceId) {
      const service = await prisma.service.findFirst({
        where: {
          id: serviceId,
          businessId,
          active: true,
        },
        select: {
          duration: true,
          bufferTime: true,
        },
      })

      if (!service) {
        return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 })
      }

      serviceDuration = serviceDuration || service.duration
      serviceBufferTime = service.bufferTime
    }

    if (!serviceDuration) {
      return NextResponse.json(
        { success: false, error: 'Duration or serviceId is required' },
        { status: 400 }
      )
    }

    if (excludeAppointmentId) {
      const user = await getCurrentUser()

      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }

      await requireBusinessAccess(user.id, businessId)

      const excludedAppointment = await prisma.appointment.findFirst({
        where: {
          id: excludeAppointmentId,
          businessId,
        },
        select: { id: true },
      })

      if (!excludedAppointment) {
        return NextResponse.json(
          { success: false, error: 'Excluded appointment not found' },
          { status: 404 }
        )
      }
    }

    const settings = { ...DEFAULT_BUSINESS_SETTINGS, ...((business.settings as object) || {}) }
    const timezone = business.timezone || 'Europe/London'
    const bufferTime = serviceBufferTime ?? settings.bufferTime ?? 0

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
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Check availability error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check availability' },
      { status: 500 }
    )
  }
}
