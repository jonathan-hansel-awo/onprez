import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  generateDetailedDayAvailability,
  getBookingRulesFromSettings,
  getSlotsAroundTime,
  type ExistingAppointment,
} from '@/lib/utils/availability'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const businessId = searchParams.get('businessId')
    const slug = searchParams.get('slug')
    const date = searchParams.get('date')
    const serviceId = searchParams.get('serviceId')
    const aroundTime = searchParams.get('aroundTime') // HH:MM
    const range = parseInt(searchParams.get('range') || '60') // minutes

    if ((!businessId && !slug) || !date) {
      return NextResponse.json(
        { success: false, error: 'Business ID/slug and date are required' },
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

    const targetDate = new Date(date)

    // Get appointments for this date
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

    // Get booking rules
    const bookingRules = getBookingRulesFromSettings(
      business.settings as Record<string, unknown> | null
    )

    // Generate availability for the day
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

    // If aroundTime specified, filter slots
    let slots = dayAvailability.slots
    if (aroundTime) {
      slots = getSlotsAroundTime(dayAvailability, aroundTime, range)
    }

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
