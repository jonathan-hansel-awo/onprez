import { prisma } from '@/lib/prisma'
import {
  type MultiDayPattern,
  type CreateMultiDayAppointment,
  createMultiDayAppointmentSchema,
} from '@/lib/validation/multi-day-appointment'
import { Prisma } from '@prisma/client'

interface GeneratedSlot {
  date: string
  startTime: string
  endTime: string
}

/**
 * Generate dates based on multi-day pattern
 */
export function generateMultiDayDates(startDate: string, pattern: MultiDayPattern): string[] {
  const dates: string[] = []
  const start = new Date(startDate)

  switch (pattern.type) {
    case 'consecutive': {
      const days = pattern.consecutiveDays || 2
      for (let i = 0; i < days; i++) {
        const date = new Date(start)
        date.setDate(date.getDate() + i)
        dates.push(date.toISOString().split('T')[0])
      }
      break
    }

    case 'weekly': {
      const weekDays = pattern.weeklyDays || []
      const weeks = pattern.weekCount || 1

      // Find the first occurrence of each weekday
      for (let week = 0; week < weeks; week++) {
        for (const dayOfWeek of weekDays) {
          const date = new Date(start)
          // Move to the correct week
          date.setDate(date.getDate() + week * 7)
          // Adjust to the correct day of week
          const currentDay = date.getDay()
          const daysToAdd = (dayOfWeek - currentDay + 7) % 7
          date.setDate(date.getDate() + daysToAdd)

          // Only add if it's on or after start date
          if (date >= start) {
            dates.push(date.toISOString().split('T')[0])
          }
        }
      }
      // Sort dates chronologically
      dates.sort()
      break
    }

    case 'custom': {
      if (pattern.customDates) {
        dates.push(...pattern.customDates.sort())
      }
      break
    }
  }

  return dates
}

/**
 * Generate time slots for multi-day appointment
 */
export function generateMultiDaySlots(
  dates: string[],
  startTime: string,
  durationMinutes: number
): GeneratedSlot[] {
  return dates.map(date => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const endMinutes = hours * 60 + minutes + durationMinutes
    const endHours = Math.floor(endMinutes / 60)
    const endMins = endMinutes % 60

    return {
      date,
      startTime,
      endTime: `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`,
    }
  })
}

/**
 * Check availability for all multi-day slots
 */
export async function checkMultiDayAvailability(
  businessId: string,
  slots: GeneratedSlot[]
): Promise<{
  available: boolean
  conflicts: { date: string; reason: string }[]
}> {
  const conflicts: { date: string; reason: string }[] = []

  // Get business hours
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      businessHours: true,
      specialDates: true,
    },
  })

  if (!business) {
    return { available: false, conflicts: [{ date: 'all', reason: 'Business not found' }] }
  }

  for (const slot of slots) {
    const slotDate = new Date(slot.date)
    const dayOfWeek = slotDate.getDay()

    // Check special dates
    const specialDate = business.specialDates.find(sd => {
      const sdDate = new Date(sd.date)
      return sdDate.toISOString().split('T')[0] === slot.date
    })

    if (specialDate?.isClosed) {
      conflicts.push({ date: slot.date, reason: `Closed: ${specialDate.name}` })
      continue
    }

    // Check business hours
    const dayHours = business.businessHours.find(bh => bh.dayOfWeek === dayOfWeek)

    let openTime: string | undefined
    let closeTime: string | undefined

    if (specialDate && !specialDate.isClosed && specialDate.openTime && specialDate.closeTime) {
      openTime = specialDate.openTime
      closeTime = specialDate.closeTime
    } else if (dayHours && !dayHours.isClosed) {
      openTime = dayHours.openTime
      closeTime = dayHours.closeTime
    }

    if (!openTime || !closeTime) {
      conflicts.push({ date: slot.date, reason: 'Business is closed' })
      continue
    }

    // Check if slot is within business hours
    const slotStart = timeToMinutes(slot.startTime)
    const slotEnd = timeToMinutes(slot.endTime)
    const businessOpen = timeToMinutes(openTime)
    const businessClose = timeToMinutes(closeTime)

    if (slotStart < businessOpen || slotEnd > businessClose) {
      conflicts.push({
        date: slot.date,
        reason: `Outside business hours (${openTime} - ${closeTime})`,
      })
      continue
    }

    // Check existing appointments
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        businessId,
        startTime: {
          gte: new Date(`${slot.date}T00:00:00`),
          lt: new Date(`${slot.date}T23:59:59`),
        },
        status: {
          notIn: ['CANCELLED', 'NO_SHOW'],
        },
      },
    })

    const slotStartTime = new Date(`${slot.date}T${slot.startTime}:00`)
    const slotEndTime = new Date(`${slot.date}T${slot.endTime}:00`)

    for (const apt of existingAppointments) {
      if (slotStartTime < apt.endTime && slotEndTime > apt.startTime) {
        conflicts.push({ date: slot.date, reason: 'Conflicts with existing appointment' })
        break
      }
    }
  }

  return {
    available: conflicts.length === 0,
    conflicts,
  }
}

/**
 * Create multi-day appointment (creates linked appointments)
 */
export async function createMultiDayAppointment(data: CreateMultiDayAppointment): Promise<{
  success: boolean
  appointments?: Array<{ id: string; date: string; startTime: string }>
  error?: string
  conflicts?: { date: string; reason: string }[]
}> {
  // Validate input
  const validation = createMultiDayAppointmentSchema.safeParse(data)
  if (!validation.success) {
    return { success: false, error: validation.error.message }
  }

  // Get service for duration
  const service = await prisma.service.findUnique({
    where: { id: data.serviceId },
  })

  if (!service) {
    return { success: false, error: 'Service not found' }
  }

  // Generate dates and slots
  const dates = generateMultiDayDates(data.startDate, data.pattern)
  const slots = generateMultiDaySlots(dates, data.startTime, service.duration)

  if (slots.length === 0) {
    return { success: false, error: 'No valid dates generated from pattern' }
  }

  // Check availability for all slots
  const availability = await checkMultiDayAvailability(data.businessId, slots)
  if (!availability.available) {
    return {
      success: false,
      error: 'Some dates are not available',
      conflicts: availability.conflicts,
    }
  }

  // Get or create customer
  let customerId = data.customerId

  if (!customerId) {
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        businessId: data.businessId,
        email: data.customerEmail,
      },
    })

    if (existingCustomer) {
      customerId = existingCustomer.id
    } else {
      const newCustomer = await prisma.customer.create({
        data: {
          businessId: data.businessId,
          email: data.customerEmail,
          name: data.customerName,
          phone: data.customerPhone,
        },
      })
      customerId = newCustomer.id
    }
  }

  // Create appointments in a transaction
  const result = await prisma.$transaction(async tx => {
    const appointments: Array<{ id: string; date: string; startTime: string }> = []
    let parentId: string | null = null

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i]
      const startDateTime = new Date(`${slot.date}T${slot.startTime}:00`)
      const endDateTime = new Date(`${slot.date}T${slot.endTime}:00`)

      const appointment: Awaited<ReturnType<typeof tx.appointment.create>> =
        await tx.appointment.create({
          data: {
            businessId: data.businessId,
            serviceId: data.serviceId,
            customerId: customerId!,
            startTime: startDateTime,
            endTime: endDateTime,
            duration: service.duration,
            timezone: 'Europe/London', // TODO: Get from business
            status: 'PENDING',
            customerName: data.customerName,
            customerEmail: data.customerEmail,
            customerPhone: data.customerPhone,
            customerNotes: data.customerNotes,
            businessNotes: data.businessNotes,
            totalAmount: service.price,
            isMultiDay: true,
            endDate:
              slots.length > 1
                ? new Date(`${slots[slots.length - 1].date}T${slots[slots.length - 1].endTime}:00`)
                : null,
            parentId: i > 0 ? parentId : null,
            recurrencePattern: i === 0 ? data.pattern : Prisma.JsonNull,
          },
        })

      // First appointment becomes the parent
      if (i === 0) {
        parentId = appointment.id
      }

      appointments.push({
        id: appointment.id,
        date: slot.date,
        startTime: slot.startTime,
      })
    }

    // Update customer stats
    await tx.customer.update({
      where: { id: customerId! },
      data: {
        totalBookings: { increment: slots.length },
        lastBookingAt: new Date(),
      },
    })

    return appointments
  })

  return { success: true, appointments: result }
}

/**
 * Get all appointments in a multi-day series
 */
export async function getAppointmentSeries(appointmentId: string) {
  // First, find the appointment
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  })

  if (!appointment) {
    return null
  }

  // Find the parent (either this appointment or its parent)
  const parentId = appointment.parentId || appointment.id

  // Get all appointments in the series
  const series = await prisma.appointment.findMany({
    where: {
      OR: [{ id: parentId }, { parentId: parentId }],
    },
    orderBy: { startTime: 'asc' },
    include: {
      service: {
        select: {
          id: true,
          name: true,
          duration: true,
          price: true,
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  })

  return {
    parentId,
    totalSessions: series.length,
    appointments: series,
    pattern: series[0]?.recurrencePattern,
  }
}

/**
 * Cancel entire multi-day series
 */
export async function cancelAppointmentSeries(
  appointmentId: string,
  reason?: string,
  cancelledBy?: string
): Promise<{ success: boolean; cancelled: number; error?: string }> {
  const series = await getAppointmentSeries(appointmentId)

  if (!series) {
    return { success: false, cancelled: 0, error: 'Appointment not found' }
  }

  // Cancel all appointments in the series
  const result = await prisma.appointment.updateMany({
    where: {
      OR: [{ id: series.parentId }, { parentId: series.parentId }],
      status: { notIn: ['CANCELLED', 'COMPLETED'] },
    },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancellationReason: reason,
      cancelledBy: cancelledBy,
      cancellationSource: 'BUSINESS',
    },
  })

  return { success: true, cancelled: result.count }
}

// Helper
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}
