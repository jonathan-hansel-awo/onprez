import { BusinessHours, SpecialDate } from '@prisma/client'

/**
 * Time slot representation
 */
export interface TimeSlot {
  startTime: string // "09:00"
  endTime: string // "09:30"
  available: boolean
  reason?: 'closed' | 'special_date' | 'booked' | 'buffer' | 'past' | 'break'
}

/**
 * Day availability with slots
 */
export interface DayAvailability {
  date: string // "2025-01-15"
  dayOfWeek: number
  isOpen: boolean
  reason?: 'regular_closed' | 'special_date' | 'no_hours_configured'
  specialDate?: {
    name: string
    isClosed: boolean
    openTime?: string
    closeTime?: string
  }
  slots: TimeSlot[]
}

/**
 * Existing appointment for conflict checking
 */
export interface ExistingAppointment {
  startTime: Date
  endTime: Date
  status: string
}

/**
 * Configuration for slot generation
 */
export interface SlotGenerationConfig {
  serviceDuration: number // minutes
  bufferTime: number // minutes between appointments
  slotInterval: number // minutes (usually 15 or 30)
  advanceBookingDays: number
  sameDayBooking: boolean
  sameDayLeadTime: number // minutes required before same-day booking
}

/**
 * Default slot generation config
 */
export const DEFAULT_SLOT_CONFIG: SlotGenerationConfig = {
  serviceDuration: 60,
  bufferTime: 15,
  slotInterval: 15,
  advanceBookingDays: 30,
  sameDayBooking: true,
  sameDayLeadTime: 60, // 1 hour minimum notice
}

/**
 * Convert time string "HH:MM" to minutes from midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Convert minutes from midnight to time string "HH:MM"
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

/**
 * Parse a date string to Date object at start of day in given timezone
 */
export function parseDate(dateString: string, timezone: string): Date {
  const date = new Date(dateString + 'T00:00:00')
  return date
}

/**
 * Get current time in minutes from midnight for a given timezone
 */
export function getCurrentTimeInMinutes(timezone: string): number {
  const now = new Date()
  const timeString = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now)
  return timeToMinutes(timeString)
}

/**
 * Get today's date string in a given timezone
 */
export function getTodayInTimezone(timezone: string): string {
  const now = new Date()
  const dateString = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  return dateString // Returns "YYYY-MM-DD"
}

/**
 * Check if two time ranges overlap
 */
export function doTimesOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number
): boolean {
  return start1 < end2 && end1 > start2
}

/**
 * Check if a slot conflicts with existing appointments
 */
export function hasConflict(
  slotStart: number,
  slotEnd: number,
  appointments: ExistingAppointment[],
  dateString: string,
  timezone: string,
  bufferTime: number
): { hasConflict: boolean; reason?: 'booked' | 'buffer' } {
  for (const appointment of appointments) {
    // Skip cancelled/no-show appointments
    if (['CANCELLED', 'NO_SHOW'].includes(appointment.status)) {
      continue
    }

    // Get appointment times in minutes
    const apptDate = new Date(appointment.startTime)
    const apptDateString = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(apptDate)

    // Only check appointments on the same day
    if (apptDateString !== dateString) {
      continue
    }

    const apptStartTime = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(appointment.startTime)

    const apptEndTime = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(appointment.endTime)

    const apptStart = timeToMinutes(apptStartTime)
    const apptEnd = timeToMinutes(apptEndTime)

    // Check direct overlap
    if (doTimesOverlap(slotStart, slotEnd, apptStart, apptEnd)) {
      return { hasConflict: true, reason: 'booked' }
    }

    // Check buffer time overlap (slot end + buffer overlaps with appointment start)
    // OR (appointment end + buffer overlaps with slot start)
    if (bufferTime > 0) {
      const slotEndWithBuffer = slotEnd + bufferTime
      const apptEndWithBuffer = apptEnd + bufferTime

      if (slotEnd <= apptStart && slotEndWithBuffer > apptStart) {
        return { hasConflict: true, reason: 'buffer' }
      }
      if (apptEnd <= slotStart && apptEndWithBuffer > slotStart) {
        return { hasConflict: true, reason: 'buffer' }
      }
    }
  }

  return { hasConflict: false }
}

/**
 * Generate time slots for a single day
 */
export function generateDaySlots(
  openTime: string,
  closeTime: string,
  config: SlotGenerationConfig,
  appointments: ExistingAppointment[],
  dateString: string,
  timezone: string,
  isToday: boolean
): TimeSlot[] {
  const slots: TimeSlot[] = []
  const { serviceDuration, bufferTime, slotInterval, sameDayBooking, sameDayLeadTime } = config

  const openMinutes = timeToMinutes(openTime)
  const closeMinutes = timeToMinutes(closeTime)

  // Calculate the last possible start time (must end before closing)
  const lastStartTime = closeMinutes - serviceDuration

  // Get current time if today
  let currentTimeMinutes = 0
  if (isToday) {
    currentTimeMinutes = getCurrentTimeInMinutes(timezone)
  }

  // Generate slots at regular intervals
  for (let startMinutes = openMinutes; startMinutes <= lastStartTime; startMinutes += slotInterval) {
    const endMinutes = startMinutes + serviceDuration
    const slot: TimeSlot = {
      startTime: minutesToTime(startMinutes),
      endTime: minutesToTime(endMinutes),
      available: true,
    }

    // Check if slot is in the past (for today)
    if (isToday) {
      if (!sameDayBooking) {
        slot.available = false
        slot.reason = 'past'
        slots.push(slot)
        continue
      }

      const minimumStartTime = currentTimeMinutes + sameDayLeadTime
      if (startMinutes < minimumStartTime) {
        slot.available = false
        slot.reason = 'past'
        slots.push(slot)
        continue
      }
    }

    // Check for conflicts with existing appointments
    const conflict = hasConflict(
      startMinutes,
      endMinutes,
      appointments,
      dateString,
      timezone,
      bufferTime
    )

    if (conflict.hasConflict) {
      slot.available = false
      slot.reason = conflict.reason
    }

    slots.push(slot)
  }

  return slots
}

/**
 * Get business hours for a specific day of week
 */
export function getBusinessHoursForDay(
  dayOfWeek: number,
  businessHours: BusinessHours[]
): BusinessHours | null {
  return businessHours.find(bh => bh.dayOfWeek === dayOfWeek) || null
}

/**
 * Check if a date has a special date override
 */
export function getSpecialDateForDay(
  dateString: string,
  specialDates: SpecialDate[]
): SpecialDate | null {
  return (
    specialDates.find(sd => {
      const sdDate = new Date(sd.date).toISOString().split('T')[0]
      return sdDate === dateString
    }) || null
  )
}

/**
 * Generate availability for a specific date
 */
export function generateDayAvailability(
  dateString: string,
  businessHours: BusinessHours[],
  specialDates: SpecialDate[],
  appointments: ExistingAppointment[],
  config: SlotGenerationConfig,
  timezone: string
): DayAvailability {
  const date = new Date(dateString)
  const dayOfWeek = date.getDay()
  const todayString = getTodayInTimezone(timezone)
  const isToday = dateString === todayString

  // Check for special date override first
  const specialDate = getSpecialDateForDay(dateString, specialDates)

  if (specialDate) {
    if (specialDate.isClosed) {
      return {
        date: dateString,
        dayOfWeek,
        isOpen: false,
        reason: 'special_date',
        specialDate: {
          name: specialDate.name,
          isClosed: true,
        },
        slots: [],
      }
    }

    // Special date with modified hours
    if (specialDate.openTime && specialDate.closeTime) {
      const slots = generateDaySlots(
        specialDate.openTime,
        specialDate.closeTime,
        config,
        appointments,
        dateString,
        timezone,
        isToday
      )

      return {
        date: dateString,
        dayOfWeek,
        isOpen: true,
        specialDate: {
          name: specialDate.name,
          isClosed: false,
          openTime: specialDate.openTime,
          closeTime: specialDate.closeTime,
        },
        slots,
      }
    }
  }

  // Check regular business hours
  const hours = getBusinessHoursForDay(dayOfWeek, businessHours)

  if (!hours) {
    return {
      date: dateString,
      dayOfWeek,
      isOpen: false,
      reason: 'no_hours_configured',
      slots: [],
    }
  }

  if (hours.isClosed) {
    return {
      date: dateString,
      dayOfWeek,
      isOpen: false,
      reason: 'regular_closed',
      slots: [],
    }
  }

  // Generate slots based on regular hours
  const slots = generateDaySlots(
    hours.openTime,
    hours.closeTime,
    config,
    appointments,
    dateString,
    timezone,
    isToday
  )

  return {
    date: dateString,
    dayOfWeek,
    isOpen: true,
    slots,
  }
}

/**
 * Generate availability for a date range
 */
export function generateAvailabilityRange(
  startDate: string,
  endDate: string,
  businessHours: BusinessHours[],
  specialDates: SpecialDate[],
  appointments: ExistingAppointment[],
  config: SlotGenerationConfig,
  timezone: string
): DayAvailability[] {
  const availability: DayAvailability[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)

  const current = new Date(start)
  while (current <= end) {
    const dateString = current.toISOString().split('T')[0]
    const dayAvailability = generateDayAvailability(
      dateString,
      businessHours,
      specialDates,
      appointments,
      config,
      timezone
    )
    availability.push(dayAvailability)
    current.setDate(current.getDate() + 1)
  }

  return availability
}

/**
 * Get the next N available dates (dates with at least one available slot)
 */
export function getNextAvailableDates(
  businessHours: BusinessHours[],
  specialDates: SpecialDate[],
  appointments: ExistingAppointment[],
  config: SlotGenerationConfig,
  timezone: string,
  count: number = 7
): DayAvailability[] {
  const availableDates: DayAvailability[] = []
  const today = getTodayInTimezone(timezone)
  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + config.advanceBookingDays)

  const current = new Date(today)

  while (availableDates.length < count && current <= maxDate) {
    const dateString = current.toISOString().split('T')[0]
    const dayAvailability = generateDayAvailability(
      dateString,
      businessHours,
      specialDates,
      appointments,
      config,
      timezone
    )

    // Only include days that have at least one available slot
    if (dayAvailability.isOpen && dayAvailability.slots.some(s => s.available)) {
      availableDates.push(dayAvailability)
    }

    current.setDate(current.getDate() + 1)
  }

  return availableDates
}

/**
 * Get available slots for a specific date (convenience function)
 */
export function getAvailableSlotsForDate(
  dateString: string,
  businessHours: BusinessHours[],
  specialDates: SpecialDate[],
  appointments: ExistingAppointment[],
  config: SlotGenerationConfig,
  timezone: string
): TimeSlot[] {
  const dayAvailability = generateDayAvailability(
    dateString,
    businessHours,
    specialDates,
    appointments,
    config,
    timezone
  )

  return dayAvailability.slots.filter(slot => slot.available)
}

/**
 * Check if a specific time slot is available
 */
export function isSlotAvailable(
  dateString: string,
  startTime: string,
  businessHours: BusinessHours[],
  specialDates: SpecialDate[],
  appointments: ExistingAppointment[],
  config: SlotGenerationConfig,
  timezone: string
): { available: boolean; reason?: string } {
  const dayAvailability = generateDayAvailability(
    dateString,
    businessHours,
    specialDates,
    appointments,
    config,
    timezone
  )

  if (!dayAvailability.isOpen) {
    return {
      available: false,
      reason: dayAvailability.reason === 'special_date'
        ? `Closed for ${dayAvailability.specialDate?.name}`
        : 'Business is closed on this day',
    }
  }

  const slot = dayAvailability.slots.find(s => s.startTime === startTime)

  if (!slot) {
    return {
      available: false,
      reason: 'Invalid time slot',
    }
  }

  if (!slot.available) {
    const reasons: Record<string, string> = {
      booked: 'This slot is already booked',
      buffer: 'This slot is too close to another appointment',
      past: 'This time has already passed',
      break: 'This slot is during a break time',
    }
    return {
      available: false,
      reason: slot.reason ? reasons[slot.reason] : 'Slot not available',
    }
  }

  return { available: true }
}

/**
 * Calculate booking window dates
 */
export function getBookingWindow(
  advanceBookingDays: number,
  sameDayBooking: boolean,
  timezone: string
): { startDate: string; endDate: string } {
  const today = getTodayInTimezone(timezone)
  const startDate = sameDayBooking ? today : (() => {
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  })()

  const endDateObj = new Date(today)
  endDateObj.setDate(endDateObj.getDate() + advanceBookingDays)
  const endDate = endDateObj.toISOString().split('T')[0]

  return { startDate, endDate }
}

/**
 * Format slot for display
 */
export function formatSlotDisplay(slot: TimeSlot): string {
  return `${slot.startTime} - ${slot.endTime}`
}

/**
 * Group slots by hour for display
 */
export function groupSlotsByHour(slots: TimeSlot[]): Record<string, TimeSlot[]> {
  const grouped: Record<string, TimeSlot[]> = {}

  for (const slot of slots) {
    const hour = slot.startTime.split(':')[0]
    const hourLabel = `${hour}:00`

    if (!grouped[hourLabel]) {
      grouped[hourLabel] = []
    }
    grouped[hourLabel].push(slot)
  }

  return grouped
}

/**
 * Get summary stats for a day's availability
 */
export function getDayAvailabilitySummary(dayAvailability: DayAvailability): {
  totalSlots: number
  availableSlots: number
  bookedSlots: number
  percentageAvailable: number
} {
  const totalSlots = dayAvailability.slots.length
  const availableSlots = dayAvailability.slots.filter(s => s.available).length
  const bookedSlots = dayAvailability.slots.filter(s => s.reason === 'booked').length
  const percentageAvailable = totalSlots > 0 ? Math.round((availableSlots / totalSlots) * 100) : 0

  return {
    totalSlots,
    availableSlots,
    bookedSlots,
    percentageAvailable,
  }
        }
