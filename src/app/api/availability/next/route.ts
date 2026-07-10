import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  generateDetailedAvailabilityRange,
  findNextAvailableSlot,
  getBookingRulesFromSettings,
  type ExistingAppointment,
} from '@/lib/utils/availability'

function parseBoundedInt(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value || String(fallback), 10)

  if (!Number.isFinite(parsed)) {
    return fallback
  }

  return Math.min(Math.max(parsed, min), max)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const businessId = searchParams.get('businessId')
    const slug = searchParams.get('slug')
    const serviceId = searchParams.get('serviceId')
    const preferredTime = searchParams.get('preferredTime')
    const preferredDay = searchParams.get('preferredDay')
    const maxDays = parseBoundedInt(searchParams.get('maxDays'), 30, 1, 90)

    if (!businessId && !slug) {
      return NextResponse.json(
        { success: false, error: 'Business ID or slug is required' },
        { status: 400 }
      )
    }

    if (preferredTime && !/^\d{2}:\d{2}$/.test(preferredTime)) {
      return NextResponse.json({ success: false, error: 'Invalid preferredTime' }, { status: 400 })
    }

    let preferredDayNumber: number | null = null

    if (preferredDay !== null) {
      preferredDayNumber = Number.parseInt(preferredDay, 10)

      if (
        !Number.isInteger(preferredDayNumber) ||
        preferredDayNumber < 0 ||
        preferredDayNumber > 6
      ) {
        return NextResponse.json({ success: false, error: 'Invalid preferredDay' }, { status: 400 })
      }
    }

    const business = await prisma.business.findFirst({
      where: businessId ? { id: businessId } : { slug: slug! },
      include: {
        businessHours: true,
        specialDates: true,
      },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    let serviceDuration = 60
    let bufferTime = 0

    if (serviceId) {
      const service = await prisma.service.findFirst({
        where: {
          id: serviceId,
          businessId: business.id,
          active: true,
        },
        select: {
          duration: true,
          bufferTime: true,
        },
      })

      if (!service) {
        return NextResponse.json(
          { success: false, error: 'Service not found or unavailable' },
          { status: 404 }
        )
      }

      serviceDuration = service.duration
      bufferTime = service.bufferTime
    }

    const startDate = new Date()
    startDate.setHours(0, 0, 0, 0)

    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + maxDays)

    const appointments = await prisma.appointment.findMany({
      where: {
        businessId: business.id,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          notIn: ['CANCELLED', 'NO_SHOW'],
        },
      },
      select: {
        startTime: true,
        endTime: true,
        status: true,
      },
    })

    const existingAppointments: ExistingAppointment[] = appointments.map(apt => ({
      startTime: apt.startTime,
      endTime: apt.endTime,
      status: apt.status,
    }))

    const bookingRules = getBookingRulesFromSettings(
      business.settings as Record<string, unknown> | null
    )

    const availability = generateDetailedAvailabilityRange(
      startDate,
      endDate,
      business.businessHours.map(bh => ({
        dayOfWeek: bh.dayOfWeek,
        openTime: bh.openTime,
        closeTime: bh.closeTime,
        isClosed: bh.isClosed,
      })),
      business.specialDates.map(sd => ({
        date: sd.date,
        name: sd.name,
        isClosed: sd.isClosed,
        openTime: sd.openTime,
        closeTime: sd.closeTime,
      })),
      existingAppointments,
      {
        serviceDuration,
        bufferTime,
        slotInterval: bookingRules.slotInterval,
        advanceBookingDays: bookingRules.maxAdvanceDays,
        sameDayBooking: bookingRules.sameDayBookingAllowed,
        sameDayLeadTime: bookingRules.sameDayLeadTime,
      },
      business.timezone
    )

    const filteredAvailability =
      preferredDayNumber !== null
        ? availability.filter(day => day.dayOfWeek === preferredDayNumber)
        : availability

    const nextAvailable = findNextAvailableSlot(filteredAvailability, preferredTime || undefined)

    if (!nextAvailable) {
      if (preferredDayNumber !== null) {
        const fallbackNext = findNextAvailableSlot(availability, preferredTime || undefined)

        return NextResponse.json({
          success: true,
          data: {
            found: !!fallbackNext,
            preferredDayAvailable: false,
            nextAvailable: fallbackNext,
            message: fallbackNext
              ? `No availability on preferred day. Next available on ${fallbackNext.date}`
              : 'No availability found in the search period',
          },
        })
      }

      return NextResponse.json({
        success: true,
        data: {
          found: false,
          nextAvailable: null,
          message: 'No availability found in the search period',
        },
      })
    }

    const dayInfo = availability.find(d => d.date === nextAvailable.date)

    return NextResponse.json({
      success: true,
      data: {
        found: true,
        nextAvailable,
        dayInfo: dayInfo
          ? {
              dateFormatted: dayInfo.dateFormatted,
              dayName: dayInfo.dayName,
              businessHours: dayInfo.businessHours,
              availableSlots: dayInfo.availableSlots,
            }
          : undefined,
      },
    })
  } catch (error) {
    console.error('Find next available error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to find next available slot' },
      { status: 500 }
    )
  }
}
