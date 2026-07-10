import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse, requireBusinessAccess } from '@/lib/auth/business-access'
import {
  generateDetailedAvailabilityRange,
  calculateAvailabilitySummary,
  getBookingRulesFromSettings,
  findNextAvailableSlot,
  getAvailabilityHeatmap,
  getPeakHours,
  getBookingWindow,
  getEffectiveBookingLimits,
  type DetailedDayAvailability,
  type AvailabilitySummary,
  type BookingRules,
  type ExistingAppointment,
} from '@/lib/utils/availability'

function parseBoundedInt(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value || String(fallback), 10)

  if (!Number.isFinite(parsed)) {
    return fallback
  }

  return Math.min(Math.max(parsed, min), max)
}

function parseDateOnly(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }

  const date = new Date(`${value}T00:00:00`)

  return Number.isNaN(date.getTime()) ? null : date
}

function isTimeString(value: string | null) {
  return !value || /^\d{2}:\d{2}$/.test(value)
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

async function requireAnalyticsAccess(userId: string | null, businessId: string) {
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  await requireBusinessAccess(userId, businessId)

  return null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const businessId = searchParams.get('businessId')
    const slug = searchParams.get('slug')

    if (!businessId && !slug) {
      return NextResponse.json(
        { success: false, error: 'Business ID or slug is required' },
        { status: 400 }
      )
    }

    const dateParam = searchParams.get('date')
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    const days = parseBoundedInt(searchParams.get('days'), 7, 1, 90)

    const serviceId = searchParams.get('serviceId')
    const serviceDuration = parseBoundedInt(searchParams.get('serviceDuration'), 60, 5, 480)

    const includeSlots = searchParams.get('includeSlots') !== 'false'
    const includeSummary = searchParams.get('includeSummary') === 'true'
    const includeRules = searchParams.get('includeRules') === 'true'
    const includeHeatmap = searchParams.get('includeHeatmap') === 'true'
    const includePeakHours = searchParams.get('includePeakHours') === 'true'
    const includeLimits = searchParams.get('includeLimits') === 'true'
    const findNext = searchParams.get('findNext') === 'true'
    const preferredTime = searchParams.get('preferredTime')

    if (!isTimeString(preferredTime)) {
      return NextResponse.json({ success: false, error: 'Invalid preferred time' }, { status: 400 })
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

    if (includeHeatmap || includePeakHours) {
      const user = await getCurrentUser()
      const authResponse = await requireAnalyticsAccess(user?.id || null, business.id)
      if (authResponse) return authResponse
    }

    let service = null

    if (serviceId) {
      service = await prisma.service.findFirst({
        where: {
          id: serviceId,
          businessId: business.id,
          active: true,
        },
      })

      if (!service) {
        return NextResponse.json(
          { success: false, error: 'Service not found or unavailable' },
          { status: 404 }
        )
      }
    }

    let startDate: Date
    let endDate: Date

    if (dateParam) {
      const parsedDate = parseDateOnly(dateParam)

      if (!parsedDate) {
        return NextResponse.json({ success: false, error: 'Invalid date' }, { status: 400 })
      }

      startDate = parsedDate
      endDate = parsedDate
    } else if (startDateParam && endDateParam) {
      const parsedStartDate = parseDateOnly(startDateParam)
      const parsedEndDate = parseDateOnly(endDateParam)

      if (!parsedStartDate || !parsedEndDate) {
        return NextResponse.json({ success: false, error: 'Invalid date range' }, { status: 400 })
      }

      startDate = parsedStartDate
      endDate = parsedEndDate
    } else {
      startDate = new Date()
      startDate.setHours(0, 0, 0, 0)

      endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + days - 1)
    }

    if (endDate < startDate) {
      return NextResponse.json(
        { success: false, error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff > 90) {
      return NextResponse.json(
        { success: false, error: 'Date range cannot exceed 90 days' },
        { status: 400 }
      )
    }

    const bookingRules = getBookingRulesFromSettings(
      business.settings as Record<string, unknown> | null,
      service
        ? {
            requiresApproval: service.requiresApproval,
            requiresDeposit: service.requiresDeposit,
            depositAmount: service.depositAmount ? Number(service.depositAmount) : undefined,
            maxAdvanceBookingDays: service.maxAdvanceBookingDays ?? undefined,
            bufferTime: service.bufferTime,
          }
        : undefined
    )

    const businessSettings = (business.settings as Record<string, unknown>) || {}
    const bookingConfig = (businessSettings.booking as Record<string, unknown>) || {}
    const minAdvanceHours = (bookingConfig.minAdvanceHours as number) || 0

    const effectiveLimits = getEffectiveBookingLimits(
      {
        maxAdvanceDays: bookingRules.maxAdvanceDays,
        minAdvanceHours,
        sameDayBooking: bookingRules.sameDayBookingAllowed,
        sameDayLeadTime: bookingRules.sameDayLeadTime,
      },
      service
        ? {
            maxAdvanceBookingDays: service.maxAdvanceBookingDays,
            minAdvanceBookingHours: service.minAdvanceBookingHours,
          }
        : undefined
    )

    const appointments = await prisma.appointment.findMany({
      where: {
        businessId: business.id,
        startTime: {
          gte: startDate,
          lte: new Date(endDate.getTime() + 24 * 60 * 60 * 1000),
        },
        status: {
          notIn: ['CANCELLED', 'NO_SHOW'],
        },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        serviceId: true,
      },
    })

    const existingAppointments: ExistingAppointment[] = appointments.map(apt => ({
      startTime: apt.startTime,
      endTime: apt.endTime,
      status: apt.status,
    }))

    const config = {
      serviceDuration: service?.duration || serviceDuration,
      bufferTime: service?.bufferTime || bookingRules.bufferBetweenAppointments,
      slotInterval: bookingRules.slotInterval,
      advanceBookingDays: effectiveLimits.maxAdvanceDays,
      sameDayBooking: effectiveLimits.sameDayBooking,
      sameDayLeadTime: effectiveLimits.sameDayLeadTime,
    }

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
      config,
      business.timezone
    )

    const responseAvailability = includeSlots
      ? availability
      : availability.map(day => ({
          ...day,
          slots: undefined,
        }))

    const response: {
      success: boolean
      data: {
        businessId: string
        businessName: string
        timezone: string
        service?: {
          id: string
          name: string
          duration: number
          price: string
        }
        dateRange: {
          start: string
          end: string
          days: number
        }
        availability: (DetailedDayAvailability | Omit<DetailedDayAvailability, 'slots'>)[]
        summary?: AvailabilitySummary
        rules?: BookingRules
        bookingWindow?: {
          start: string
          end: string
        }
        bookingLimits?: {
          maxAdvanceDays: number
          minAdvanceHours: number
          sameDayBooking: boolean
          sameDayLeadTime: number
          source: {
            maxAdvance: 'business' | 'service'
            minAdvance: 'business' | 'service'
          }
        }
        nextAvailable?: {
          date: string
          time: string
        } | null
        heatmap?: Record<string, number>
        peakHours?: { hour: number; count: number }[]
      }
    } = {
      success: true,
      data: {
        businessId: business.id,
        businessName: business.name,
        timezone: business.timezone,
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
          days: daysDiff + 1,
        },
        availability: responseAvailability,
      },
    }

    if (service) {
      response.data.service = {
        id: service.id,
        name: service.name,
        duration: service.duration,
        price: service.price.toString(),
      }
    }

    if (includeSummary) {
      response.data.summary = calculateAvailabilitySummary(availability)
    }

    if (includeRules) {
      response.data.rules = bookingRules
    }

    const bookingWindow = getBookingWindow(
      effectiveLimits.maxAdvanceDays,
      effectiveLimits.sameDayBooking,
      business.timezone
    )

    response.data.bookingWindow = {
      start: bookingWindow.startDate.toString().split('T')[0],
      end: bookingWindow.endDate.toString().split('T')[0],
    }

    if (includeLimits) {
      response.data.bookingLimits = {
        maxAdvanceDays: effectiveLimits.maxAdvanceDays,
        minAdvanceHours: effectiveLimits.minAdvanceHours,
        sameDayBooking: effectiveLimits.sameDayBooking,
        sameDayLeadTime: effectiveLimits.sameDayLeadTime,
        source: effectiveLimits.source,
      }
    }

    if (findNext) {
      response.data.nextAvailable = findNextAvailableSlot(availability, preferredTime || undefined)
    }

    if (includeHeatmap) {
      response.data.heatmap = getAvailabilityHeatmap(availability)
    }

    if (includePeakHours) {
      response.data.peakHours = getPeakHours(existingAppointments).slice(0, 5)
    }

    return NextResponse.json(response)
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Availability API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get availability' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const businessId = typeof body.businessId === 'string' ? body.businessId : ''
    const serviceId = typeof body.serviceId === 'string' ? body.serviceId : undefined
    const date = typeof body.date === 'string' ? body.date : ''
    const startTime = typeof body.startTime === 'string' ? body.startTime : ''
    const duration =
      typeof body.duration === 'number' ? Math.min(Math.max(body.duration, 5), 480) : undefined

    if (
      !businessId ||
      !date ||
      !startTime ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !/^\d{2}:\d{2}$/.test(startTime)
    ) {
      return NextResponse.json(
        { success: false, error: 'Business ID, valid date, and valid start time are required' },
        { status: 400 }
      )
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        businessHours: true,
        specialDates: true,
      },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    let serviceDuration = duration || 60
    let bufferTime = 0
    let service = null

    if (serviceId) {
      service = await prisma.service.findFirst({
        where: {
          id: serviceId,
          businessId,
          active: true,
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

    const dayOfWeek = targetDate.getDay()
    const dateString = targetDate.toISOString().split('T')[0]
    const requestedDateTime = new Date(`${dateString}T${startTime}:00`)

    if (Number.isNaN(requestedDateTime.getTime())) {
      return NextResponse.json({ success: false, error: 'Invalid start time' }, { status: 400 })
    }

    const businessSettings = (business.settings as Record<string, unknown>) || {}
    const bookingConfig = (businessSettings.booking as Record<string, unknown>) || {}

    const effectiveLimits = getEffectiveBookingLimits(
      {
        maxAdvanceDays: (bookingConfig.advanceBookingDays as number) || 30,
        minAdvanceHours: (bookingConfig.minAdvanceHours as number) || 0,
        sameDayBooking: (bookingConfig.sameDayBooking as boolean) ?? true,
        sameDayLeadTime: (bookingConfig.sameDayLeadTime as number) || 60,
      },
      service
        ? {
            maxAdvanceBookingDays: service.maxAdvanceBookingDays,
            minAdvanceBookingHours: service.minAdvanceBookingHours,
          }
        : undefined
    )

    const now = new Date()
    const hoursUntilSlot = (requestedDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursUntilSlot < effectiveLimits.minAdvanceHours) {
      return NextResponse.json({
        success: true,
        data: {
          available: false,
          reason: `This ${service ? 'service' : 'business'} requires at least ${effectiveLimits.minAdvanceHours} hours advance notice`,
          bookingLimits: effectiveLimits,
        },
      })
    }

    const daysUntilSlot = hoursUntilSlot / 24

    if (daysUntilSlot > effectiveLimits.maxAdvanceDays) {
      return NextResponse.json({
        success: true,
        data: {
          available: false,
          reason: `Bookings can only be made up to ${effectiveLimits.maxAdvanceDays} days in advance`,
          bookingLimits: effectiveLimits,
        },
      })
    }

    const isSameDay = targetDate.toDateString() === now.toDateString()

    if (isSameDay && !effectiveLimits.sameDayBooking) {
      return NextResponse.json({
        success: true,
        data: {
          available: false,
          reason: 'Same-day bookings are not available',
          bookingLimits: effectiveLimits,
        },
      })
    }

    const dayHours = business.businessHours.find(bh => bh.dayOfWeek === dayOfWeek)

    const specialDate = business.specialDates.find(sd => {
      const sdDate = new Date(sd.date)
      return sdDate.toISOString().split('T')[0] === dateString
    })

    let isOpen = false
    let openTime: string | undefined
    let closeTime: string | undefined

    if (specialDate) {
      if (!specialDate.isClosed && specialDate.openTime && specialDate.closeTime) {
        isOpen = true
        openTime = specialDate.openTime
        closeTime = specialDate.closeTime
      }
    } else if (dayHours && !dayHours.isClosed) {
      isOpen = true
      openTime = dayHours.openTime
      closeTime = dayHours.closeTime
    }

    if (!isOpen) {
      return NextResponse.json({
        success: true,
        data: {
          available: false,
          reason: 'Business is closed on this date',
        },
      })
    }

    const startMinutes = timeToMinutes(startTime)
    const endMinutes = startMinutes + serviceDuration
    const openMinutes = timeToMinutes(openTime!)
    const closeMinutes = timeToMinutes(closeTime!)

    if (startMinutes < openMinutes || endMinutes > closeMinutes) {
      return NextResponse.json({
        success: true,
        data: {
          available: false,
          reason: 'Requested time is outside business hours',
          businessHours: { openTime, closeTime },
        },
      })
    }

    const conflicts = await prisma.appointment.findMany({
      where: {
        businessId,
        startTime: {
          gte: targetDate,
          lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
        },
        status: {
          notIn: ['CANCELLED', 'NO_SHOW'],
        },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
      },
    })

    const requestedStart = new Date(`${dateString}T${startTime}:00`)
    const requestedEnd = new Date(requestedStart.getTime() + serviceDuration * 60 * 1000)

    for (const apt of conflicts) {
      const aptStart = new Date(apt.startTime)
      const aptEnd = new Date(apt.endTime)

      if (requestedStart < aptEnd && requestedEnd > aptStart) {
        return NextResponse.json({
          success: true,
          data: {
            available: false,
            reason: 'Time slot conflicts with existing appointment',
            conflict: {
              startTime: aptStart.toISOString(),
              endTime: aptEnd.toISOString(),
            },
          },
        })
      }

      if (bufferTime > 0) {
        const bufferStart = new Date(aptStart.getTime() - bufferTime * 60 * 1000)
        const bufferEnd = new Date(aptEnd.getTime() + bufferTime * 60 * 1000)

        if (requestedStart < bufferEnd && requestedEnd > bufferStart) {
          return NextResponse.json({
            success: true,
            data: {
              available: false,
              reason: 'Time slot conflicts with buffer time',
              conflict: {
                startTime: aptStart.toISOString(),
                endTime: aptEnd.toISOString(),
                bufferMinutes: bufferTime,
              },
            },
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        available: true,
        slot: {
          date: dateString,
          startTime,
          endTime: minutesToTime(endMinutes),
          duration: serviceDuration,
        },
        businessHours: { openTime, closeTime },
        bookingLimits: effectiveLimits,
      },
    })
  } catch (error) {
    console.error('Check slot availability error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check availability' },
      { status: 500 }
    )
  }
}
