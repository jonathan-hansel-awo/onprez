import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  generateDetailedDayAvailability,
  getBookingRulesFromSettings,
  getSlotsAroundTime,
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
    const date = searchParams.get('date')
    const serviceId = searchParams.get('serviceId')
    const aroundTime = searchParams.get('aroundTime')
    const range = parseBoundedInt(searchParams.get('range'), 60, 15, 240)

    if ((!businessId && !slug) || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { success: false, error: 'Business ID/slug and valid date are required' },
        { status: 400 }
      )
    }

    if (aroundTime && !/^\d{2}:\d{2}$/.test(aroundTime)) {
      return NextResponse.json({ success: false, error: 'Invalid aroundTime' }, { status: 400 })
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

    const targetDate = new Date(`${date}T00:00:00`)

    if (Number.isNaN(targetDate.getTime())) {
      return NextResponse.json({ success: false, error: 'Invalid date' }, { status: 400 })
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        businessId: business.id,
        startTime: {
          gte: targetDate,
          lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
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

    const dayAvailability = generateDetailedDayAvailability(
      targetDate,
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

    const slots = aroundTime
      ? getSlotsAroundTime(dayAvailability, aroundTime, range)
      : dayAvailability.slots

    return NextResponse.json({
      success: true,
      data: {
        date: dayAvailability.date,
        dateFormatted: dayAvailability.dateFormatted,
        dayName: dayAvailability.dayName,
        isOpen: dayAvailability.isOpen,
        businessHours: dayAvailability.businessHours,
        isSpecialDate: dayAvailability.isSpecialDate,
        specialDateName: dayAvailability.specialDateName,
        slots,
        summary: {
          total: slots.length,
          available: slots.filter(s => s.available).length,
          booked: slots.filter(s => s.reason === 'booked').length,
          firstAvailable: slots.find(s => s.available)?.startTime,
          lastAvailable: [...slots].reverse().find(s => s.available)?.startTime,
        },
      },
    })
  } catch (error) {
    console.error('Get slots error:', error)
    return NextResponse.json({ success: false, error: 'Failed to get slots' }, { status: 500 })
  }
}
