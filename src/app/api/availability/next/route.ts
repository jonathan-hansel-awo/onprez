import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  generateDetailedAvailabilityRange,
  findNextAvailableSlot,
  getBookingRulesFromSettings,
  type ExistingAppointment,
} from '@/lib/utils/availability'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const businessId = searchParams.get('businessId')
    const slug = searchParams.get('slug')
    const serviceId = searchParams.get('serviceId')
    const preferredTime = searchParams.get('preferredTime') // HH:MM
    const preferredDay = searchParams.get('preferredDay') // 0-6
    const maxDays = parseInt(searchParams.get('maxDays') || '30')

    if (!businessId && !slug) {
      return NextResponse.json(
        { success: false, error: 'Business ID or slug is required' },
        { status: 400 }
      )
    }

    // Get business
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

    // Get service
    let serviceDuration = 60
    let bufferTime = 0

    if (serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
      })

      if (service) {
        serviceDuration = service.duration
        bufferTime = service.bufferTime
      }
    }

    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + maxDays)

    // Get appointments
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
        ...(serviceId && { serviceId }),
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

    // Generate availability
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

    // Filter by preferred day if specified
    let filteredAvailability = availability
    if (preferredDay !== null && preferredDay !== undefined) {
      const dayNum = parseInt(preferredDay)
      filteredAvailability = availability.filter(day => day.dayOfWeek === dayNum)
    }

    // Find next available
    const nextAvailable = findNextAvailableSlot(filteredAvailability, preferredTime || undefined)

    if (!nextAvailable) {
      // Try without preferred day filter
      if (preferredDay !== null) {
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

    // Get the day's availability for context
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
