import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import {
  generateDetailedAvailabilityRange,
  calculateAvailabilitySummary,
  getBookingRulesFromSettings,
  findNextAvailableSlot,
  getAvailabilityHeatmap,
  getPeakHours,
  getBookingWindow,
  type DetailedDayAvailability,
  type AvailabilitySummary,
  type BookingRules,
  type ExistingAppointment,
} from '@/lib/utils/availability'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Required: businessId or slug
    const businessId = searchParams.get('businessId')
    const slug = searchParams.get('slug')

    if (!businessId && !slug) {
      return NextResponse.json(
        { success: false, error: 'Business ID or slug is required' },
        { status: 400 }
      )
    }

    // Date parameters
    const dateParam = searchParams.get('date') // Single date
    const startDateParam = searchParams.get('startDate') // Range start
    const endDateParam = searchParams.get('endDate') // Range end
    const days = parseInt(searchParams.get('days') || '7') // Number of days from today

    // Service parameters
    const serviceId = searchParams.get('serviceId')
    const serviceDuration = parseInt(searchParams.get('serviceDuration') || '60')

    // Options
    const includeSlots = searchParams.get('includeSlots') !== 'false'
    const includeSummary = searchParams.get('includeSummary') === 'true'
    const includeRules = searchParams.get('includeRules') === 'true'
    const includeHeatmap = searchParams.get('includeHeatmap') === 'true'
    const includePeakHours = searchParams.get('includePeakHours') === 'true'
    const findNext = searchParams.get('findNext') === 'true'
    const preferredTime = searchParams.get('preferredTime') // HH:MM for findNext

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

    // Get service if specified
    let service = null
    if (serviceId) {
      service = await prisma.service.findUnique({
        where: { id: serviceId },
      })

      if (!service) {
        return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 })
      }
    }

    // Determine date range
    let startDate: Date
    let endDate: Date

    if (dateParam) {
      startDate = new Date(dateParam)
      endDate = new Date(dateParam)
    } else if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam)
      endDate = new Date(endDateParam)
    } else {
      startDate = new Date()
      endDate = new Date()
      endDate.setDate(endDate.getDate() + days - 1)
    }

    // Validate date range (max 90 days)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff > 90) {
      return NextResponse.json(
        { success: false, error: 'Date range cannot exceed 90 days' },
        { status: 400 }
      )
    }

    // Get booking rules
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

    // Fetch existing appointments for the date range
    const appointments = await prisma.appointment.findMany({
      where: {
        businessId: business.id,
        startTime: {
          gte: startDate,
          lte: new Date(endDate.getTime() + 24 * 60 * 60 * 1000), // Include full end date
        },
        status: {
          notIn: ['CANCELLED', 'NO_SHOW'],
        },
        ...(serviceId && { serviceId }),
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

    // Generate configuration
    const config = {
      serviceDuration: service?.duration || serviceDuration,
      bufferTime: service?.bufferTime || bookingRules.bufferBetweenAppointments,
      slotInterval: bookingRules.slotInterval,
      advanceBookingDays: bookingRules.maxAdvanceDays,
      sameDayBooking: bookingRules.sameDayBookingAllowed,
      sameDayLeadTime: bookingRules.sameDayLeadTime,
    }

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
      config,
      business.timezone
    )

    // Strip slots if not requested (reduces payload size)
    const responseAvailability = includeSlots
      ? availability
      : availability.map(day => ({
          ...day,
          slots: undefined,
        }))

    // Build response
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

    // Add service info if specified
    if (service) {
      response.data.service = {
        id: service.id,
        name: service.name,
        duration: service.duration,
        price: service.price.toString(),
      }
    }

    // Add summary if requested
    if (includeSummary) {
      response.data.summary = calculateAvailabilitySummary(availability)
    }

    // Add booking rules if requested
    if (includeRules) {
      response.data.rules = bookingRules
    }

    // Add booking window
    const bookingWindow = getBookingWindow(
      config.advanceBookingDays,
      config.sameDayBooking,
      business.timezone
    )
    response.data.bookingWindow = {
      start: bookingWindow.startDate.toString().split('T')[0],
      end: bookingWindow.endDate.toString().split('T')[0],
    }

    // Find next available slot if requested
    if (findNext) {
      response.data.nextAvailable = findNextAvailableSlot(availability, preferredTime || undefined)
    }

    // Add heatmap if requested (requires authenticated request for business owner)
    if (includeHeatmap) {
      response.data.heatmap = getAvailabilityHeatmap(availability)
    }

    // Add peak hours if requested
    if (includePeakHours) {
      response.data.peakHours = getPeakHours(existingAppointments).slice(0, 5)
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Availability API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get availability' },
      { status: 500 }
    )
  }
}

// POST endpoint for checking specific slot availability
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { businessId, serviceId, date, startTime, duration } = body

    if (!businessId || !date || !startTime) {
      return NextResponse.json(
        { success: false, error: 'Business ID, date, and start time are required' },
        { status: 400 }
      )
    }

    // Get business
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

    // Get service if specified
    let serviceDuration = duration || 60
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

    // Parse date and check
    const targetDate = new Date(date)
    const dayOfWeek = targetDate.getDay()
    const dateString = targetDate.toISOString().split('T')[0]

    // Check business hours
    const dayHours = business.businessHours.find(bh => bh.dayOfWeek === dayOfWeek)

    // Check special dates
    const specialDate = business.specialDates.find(sd => {
      const sdDate = new Date(sd.date)
      return sdDate.toISOString().split('T')[0] === dateString
    })

    // Determine if business is open
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

    // Check if time is within business hours
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

    // Check for conflicts
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

    // Check each appointment for conflicts
    const requestedStart = new Date(`${dateString}T${startTime}:00`)
    const requestedEnd = new Date(requestedStart.getTime() + serviceDuration * 60 * 1000)

    for (const apt of conflicts) {
      const aptStart = new Date(apt.startTime)
      const aptEnd = new Date(apt.endTime)

      // Direct overlap check
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

      // Buffer check
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

    // Slot is available
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

// Helper functions (duplicated for this file - consider moving to shared utils)
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}
