import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  generateDayAvailability,
  generateAvailabilityRange,
  getBookingWindow,
  DEFAULT_SLOT_CONFIG,
  SlotGenerationConfig,
} from '@/lib/utils/availability'
import { DEFAULT_BUSINESS_SETTINGS } from '@/types/business'
import { z } from 'zod'

const availabilityQuerySchema = z.object({
  businessId: z.string().cuid().optional(),
  slug: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  serviceId: z.string().cuid().optional(),
  serviceDuration: z.coerce.number().int().min(5).max(480).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const queryParams = {
      businessId: searchParams.get('businessId') || undefined,
      slug: searchParams.get('slug') || undefined,
      date: searchParams.get('date') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      serviceId: searchParams.get('serviceId') || undefined,
      serviceDuration: searchParams.get('serviceDuration') || undefined,
    }

    const validation = availabilityQuerySchema.safeParse(queryParams)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { businessId, slug, date, startDate, endDate, serviceId, serviceDuration } =
      validation.data

    // Find business
    let business
    if (businessId) {
      business = await prisma.business.findUnique({
        where: { id: businessId },
        include: {
          businessHours: { orderBy: { dayOfWeek: 'asc' } },
          specialDates: true,
        },
      })
    } else if (slug) {
      business = await prisma.business.findUnique({
        where: { slug },
        include: {
          businessHours: { orderBy: { dayOfWeek: 'asc' } },
          specialDates: true,
        },
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Business ID or slug is required' },
        { status: 400 }
      )
    }

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    // Get service duration if serviceId provided
    let duration = serviceDuration
    if (serviceId && !duration) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        select: { duration: true, bufferTime: true },
      })
      if (service) {
        duration = service.duration
      }
    }

    // Build slot generation config
    const settings = { ...DEFAULT_BUSINESS_SETTINGS, ...((business.settings as object) || {}) }
    const config: SlotGenerationConfig = {
      serviceDuration: duration || DEFAULT_SLOT_CONFIG.serviceDuration,
      bufferTime: settings.bufferTime ?? DEFAULT_SLOT_CONFIG.bufferTime,
      slotInterval: 15, // Fixed 15-minute intervals
      advanceBookingDays: settings.advanceBookingDays ?? DEFAULT_SLOT_CONFIG.advanceBookingDays,
      sameDayBooking: settings.sameDayBooking ?? DEFAULT_SLOT_CONFIG.sameDayBooking,
      sameDayLeadTime: DEFAULT_SLOT_CONFIG.sameDayLeadTime,
    }

    const timezone = business.timezone || 'Europe/London'

    // Calculate booking window
    const bookingWindow = getBookingWindow(config.advanceBookingDays, config.sameDayBooking, timezone)

    // Get existing appointments in the date range
    const queryStartDate = date || startDate || bookingWindow.startDate
    const queryEndDate = date || endDate || bookingWindow.endDate

    const appointments = await prisma.appointment.findMany({
      where: {
        businessId: business.id,
        startTime: {
          gte: new Date(queryStartDate),
          lte: new Date(queryEndDate + 'T23:59:59'),
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

    // Generate availability
    let availability
    if (date) {
      // Single day
      availability = generateDayAvailability(
        date,
        business.businessHours,
        business.specialDates,
        appointments,
        config,
        timezone
      )
    } else {
      // Date range
      availability = generateAvailabilityRange(
        queryStartDate,
        queryEndDate,
        business.businessHours,
        business.specialDates,
        appointments,
        config,
        timezone
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        availability,
        config: {
          serviceDuration: config.serviceDuration,
          bufferTime: config.bufferTime,
          slotInterval: config.slotInterval,
        },
        bookingWindow,
        timezone,
      },
    })
  } catch (error) {
    console.error('Get availability error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch availability' },
      { status: 500 }
    )
  }
}
