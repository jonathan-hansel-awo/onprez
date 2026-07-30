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
  for (
    let startMinutes = openMinutes;
    startMinutes <= lastStartTime;
    startMinutes += slotInterval
  ) {
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
      reason:
        dayAvailability.reason === 'special_date'
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
  const startDate = sameDayBooking
    ? today
    : (() => {
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

export interface AvailabilitySlot {
  startTime: string // HH:MM format
  endTime: string
  available: boolean
  reason?: string
  capacity?: number // For future multi-booking support
  bookedCount?: number
}

export interface DetailedDayAvailability {
  date: string
  dateFormatted: string
  dayOfWeek: number
  dayName: string
  isOpen: boolean
  isSpecialDate: boolean
  specialDateName?: string
  businessHours?: {
    openTime: string
    closeTime: string
  }
  totalSlots: number
  availableSlots: number
  bookedSlots: number
  utilizationPercent: number
  slots: AvailabilitySlot[]
  summary: {
    firstAvailable?: string
    lastAvailable?: string
    longestGap?: number // minutes
  }
}

export interface ServiceAvailability {
  serviceId: string
  serviceName: string
  duration: number
  bufferTime: number
  availability: DetailedDayAvailability[]
}

export interface AvailabilitySummary {
  totalDays: number
  openDays: number
  closedDays: number
  totalSlots: number
  availableSlots: number
  bookedSlots: number
  overallUtilization: number
  busiestDay?: {
    date: string
    bookings: number
  }
  quietestDay?: {
    date: string
    bookings: number
  }
}

export interface BookingRules {
  minAdvanceTime: number // minutes
  maxAdvanceDays: number
  sameDayBookingAllowed: boolean
  sameDayLeadTime: number // minutes
  bufferBetweenAppointments: number // minutes
  slotInterval: number // minutes
  requiresApproval: boolean
  requiresDeposit: boolean
  depositAmount?: number
  cancellationPolicy?: {
    allowCancellation: boolean
    cancellationDeadline: number // hours before appointment
    refundPolicy: string
  }
}

// Add these new functions after existing functions

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function formatDateString(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function generateDetailedDayAvailability(
  date: Date,
  businessHours: Array<{
    dayOfWeek: number
    openTime: string
    closeTime: string
    isClosed: boolean
  }>,
  specialDates: Array<{
    date: Date
    name: string
    isClosed: boolean
    openTime?: string | null
    closeTime?: string | null
  }>,
  existingAppointments: ExistingAppointment[],
  config: SlotGenerationConfig,
  timezone: string = 'Europe/London'
): DetailedDayAvailability {
  const dateString = date.toISOString().split('T')[0]
  const dayOfWeek = date.getDay()

  // Get special date if exists
  const specialDate = specialDates.find(sd => {
    const sdDate = new Date(sd.date)
    return sdDate.toISOString().split('T')[0] === dateString
  })

  // Get business hours for this day
  const dayHours = businessHours.find(bh => bh.dayOfWeek === dayOfWeek)

  // Determine if open and get hours
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

  // Generate slots
  const slots: AvailabilitySlot[] = []
  let availableCount = 0
  let bookedCount = 0

  if (isOpen && openTime && closeTime) {
    const openMinutes = timeToMinutes(openTime)
    const closeMinutes = timeToMinutes(closeTime)
    const slotInterval = config.slotInterval || 15
    const serviceDuration = config.serviceDuration
    const bufferTime = config.bufferTime || 0

    // Check if date is today
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    const currentTimeMinutes = isToday ? getCurrentTimeInMinutes(timezone) : 0
    const sameDayLeadTime = config.sameDayLeadTime || 60

    for (let time = openMinutes; time + serviceDuration <= closeMinutes; time += slotInterval) {
      const slotStart = minutesToTime(time)
      const slotEnd = minutesToTime(time + serviceDuration)

      let available = true
      let reason: string | undefined

      // Check if slot is in the past
      if (isToday && time < currentTimeMinutes + sameDayLeadTime) {
        available = false
        reason = 'past'
      }

      // Check for conflicts with existing appointments
      if (available) {
        const slotStartTime = time
        const slotEndTime = time + serviceDuration

        for (const apt of existingAppointments) {
          if (apt.status === 'CANCELLED' || apt.status === 'NO_SHOW') continue

          const aptStart = new Date(apt.startTime)
          const aptEnd = new Date(apt.endTime)

          // Only check appointments on this date
          if (aptStart.toISOString().split('T')[0] !== dateString) continue

          const aptStartMinutes = aptStart.getHours() * 60 + aptStart.getMinutes()
          const aptEndMinutes = aptEnd.getHours() * 60 + aptEnd.getMinutes()

          // Check direct overlap
          if (slotStartTime < aptEndMinutes && slotEndTime > aptStartMinutes) {
            available = false
            reason = 'booked'
            break
          }

          // Check buffer overlap
          if (bufferTime > 0) {
            const bufferStart = aptStartMinutes - bufferTime
            const bufferEnd = aptEndMinutes + bufferTime

            if (slotStartTime < bufferEnd && slotEndTime > bufferStart) {
              if (slotStartTime >= aptStartMinutes && slotStartTime < aptEndMinutes) {
                // Direct overlap already handled
              } else {
                available = false
                reason = 'buffer'
                break
              }
            }
          }
        }
      }

      slots.push({
        startTime: slotStart,
        endTime: slotEnd,
        available,
        reason,
      })

      if (available) {
        availableCount++
      } else if (reason === 'booked') {
        bookedCount++
      }
    }
  }

  // Calculate summary
  const firstAvailable = slots.find(s => s.available)?.startTime
  const lastAvailable = [...slots].reverse().find(s => s.available)?.startTime

  // Calculate longest gap between available slots
  let longestGap = 0
  let currentGap = 0
  for (const slot of slots) {
    if (!slot.available) {
      currentGap += config.slotInterval || 15
    } else {
      if (currentGap > longestGap) {
        longestGap = currentGap
      }
      currentGap = 0
    }
  }

  const totalSlots = slots.length
  const utilizationPercent = totalSlots > 0 ? Math.round((bookedCount / totalSlots) * 100) : 0

  return {
    date: dateString,
    dateFormatted: formatDateString(date),
    dayOfWeek,
    dayName: DAY_NAMES[dayOfWeek],
    isOpen,
    isSpecialDate: !!specialDate,
    specialDateName: specialDate?.name,
    businessHours: openTime && closeTime ? { openTime, closeTime } : undefined,
    totalSlots,
    availableSlots: availableCount,
    bookedSlots: bookedCount,
    utilizationPercent,
    slots,
    summary: {
      firstAvailable,
      lastAvailable,
      longestGap,
    },
  }
}

export function generateDetailedAvailabilityRange(
  startDate: Date,
  endDate: Date,
  businessHours: Array<{
    dayOfWeek: number
    openTime: string
    closeTime: string
    isClosed: boolean
  }>,
  specialDates: Array<{
    date: Date
    name: string
    isClosed: boolean
    openTime?: string | null
    closeTime?: string | null
  }>,
  existingAppointments: ExistingAppointment[],
  config: SlotGenerationConfig,
  timezone: string = 'Europe/London'
): DetailedDayAvailability[] {
  const results: DetailedDayAvailability[] = []
  const current = new Date(startDate)

  while (current <= endDate) {
    results.push(
      generateDetailedDayAvailability(
        new Date(current),
        businessHours,
        specialDates,
        existingAppointments,
        config,
        timezone
      )
    )
    current.setDate(current.getDate() + 1)
  }

  return results
}

export function calculateAvailabilitySummary(
  availability: DetailedDayAvailability[]
): AvailabilitySummary {
  let totalSlots = 0
  let availableSlots = 0
  let bookedSlots = 0
  let openDays = 0
  let closedDays = 0
  let busiestDay: { date: string; bookings: number } | undefined
  let quietestDay: { date: string; bookings: number } | undefined

  for (const day of availability) {
    if (day.isOpen) {
      openDays++
      totalSlots += day.totalSlots
      availableSlots += day.availableSlots
      bookedSlots += day.bookedSlots

      if (!busiestDay || day.bookedSlots > busiestDay.bookings) {
        busiestDay = { date: day.date, bookings: day.bookedSlots }
      }

      if (!quietestDay || day.bookedSlots < quietestDay.bookings) {
        quietestDay = { date: day.date, bookings: day.bookedSlots }
      }
    } else {
      closedDays++
    }
  }

  return {
    totalDays: availability.length,
    openDays,
    closedDays,
    totalSlots,
    availableSlots,
    bookedSlots,
    overallUtilization: totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0,
    busiestDay,
    quietestDay,
  }
}

export function getBookingRulesFromSettings(
  businessSettings: Record<string, unknown> | null,
  serviceSettings?: {
    requiresApproval?: boolean
    requiresDeposit?: boolean
    depositAmount?: number | null
    maxAdvanceBookingDays?: number | null
    bufferTime?: number
  }
): BookingRules {
  const settings = businessSettings || {}

  const defaultRules: BookingRules = {
    minAdvanceTime: 60, // 1 hour minimum
    maxAdvanceDays: 30,
    sameDayBookingAllowed: true,
    sameDayLeadTime: 60, // 1 hour lead time for same day
    bufferBetweenAppointments: 0,
    slotInterval: 15,
    requiresApproval: false,
    requiresDeposit: false,
  }

  // Merge business settings
  const booking = settings.booking as Record<string, unknown> | undefined

  if (booking) {
    if (typeof booking.advanceBookingDays === 'number') {
      defaultRules.maxAdvanceDays = booking.advanceBookingDays
    }
    if (typeof booking.sameDayBooking === 'boolean') {
      defaultRules.sameDayBookingAllowed = booking.sameDayBooking
    }
    if (typeof booking.sameDayLeadTime === 'number') {
      defaultRules.sameDayLeadTime = booking.sameDayLeadTime
    }
    if (typeof booking.bufferTime === 'number') {
      defaultRules.bufferBetweenAppointments = booking.bufferTime
    }
    if (typeof booking.slotInterval === 'number') {
      defaultRules.slotInterval = booking.slotInterval
    }
  }

  // Override with service-specific settings
  if (serviceSettings) {
    if (serviceSettings.requiresApproval !== undefined) {
      defaultRules.requiresApproval = serviceSettings.requiresApproval
    }
    if (serviceSettings.requiresDeposit !== undefined) {
      defaultRules.requiresDeposit = serviceSettings.requiresDeposit
    }
    if (serviceSettings.depositAmount) {
      defaultRules.depositAmount = Number(serviceSettings.depositAmount)
    }
    if (serviceSettings.maxAdvanceBookingDays) {
      defaultRules.maxAdvanceDays = serviceSettings.maxAdvanceBookingDays
    }
    if (serviceSettings.bufferTime !== undefined) {
      defaultRules.bufferBetweenAppointments = serviceSettings.bufferTime
    }
  }

  // Add cancellation policy from settings
  const cancellation = settings.cancellation as Record<string, unknown> | undefined
  if (cancellation) {
    defaultRules.cancellationPolicy = {
      allowCancellation: cancellation.allowCancellation !== false,
      cancellationDeadline: (cancellation.deadline as number) || 24,
      refundPolicy:
        (cancellation.refundPolicy as string) || 'No refunds for cancellations within 24 hours',
    }
  }

  return defaultRules
}

export function findNextAvailableSlot(
  availability: DetailedDayAvailability[],
  preferredTime?: string // HH:MM format
): { date: string; time: string } | null {
  for (const day of availability) {
    if (!day.isOpen) continue

    for (const slot of day.slots) {
      if (!slot.available) continue

      // If no preferred time, return first available
      if (!preferredTime) {
        return { date: day.date, time: slot.startTime }
      }

      // If slot is at or after preferred time, return it
      if (slot.startTime >= preferredTime) {
        return { date: day.date, time: slot.startTime }
      }
    }
  }

  return null
}

export function getSlotsAroundTime(
  day: DetailedDayAvailability,
  targetTime: string,
  range: number = 60 // minutes before and after
): AvailabilitySlot[] {
  const targetMinutes = timeToMinutes(targetTime)
  const minTime = targetMinutes - range
  const maxTime = targetMinutes + range

  return day.slots.filter(slot => {
    const slotMinutes = timeToMinutes(slot.startTime)
    return slotMinutes >= minTime && slotMinutes <= maxTime
  })
}

export function getAvailabilityHeatmap(
  availability: DetailedDayAvailability[]
): Record<string, number> {
  // Returns utilization by day of week (0-6)
  const heatmap: Record<string, { total: number; booked: number }> = {}

  for (let i = 0; i < 7; i++) {
    heatmap[i.toString()] = { total: 0, booked: 0 }
  }

  for (const day of availability) {
    const dow = day.dayOfWeek.toString()
    heatmap[dow].total += day.totalSlots
    heatmap[dow].booked += day.bookedSlots
  }

  const result: Record<string, number> = {}
  for (const [dow, data] of Object.entries(heatmap)) {
    result[dow] = data.total > 0 ? Math.round((data.booked / data.total) * 100) : 0
  }

  return result
}

export function getPeakHours(
  appointments: ExistingAppointment[]
): { hour: number; count: number }[] {
  const hourCounts: Record<number, number> = {}

  for (let i = 0; i < 24; i++) {
    hourCounts[i] = 0
  }

  for (const apt of appointments) {
    if (apt.status === 'CANCELLED' || apt.status === 'NO_SHOW') continue
    const hour = new Date(apt.startTime).getHours()
    hourCounts[hour]++
  }

  return Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    .sort((a, b) => b.count - a.count)
}

export interface BookingWindowConfig {
  maxAdvanceDays: number
  minAdvanceHours: number
  sameDayBooking: boolean
  sameDayLeadTime: number
  timezone: string
}

export interface BookingWindowResult {
  canBook: boolean
  reason?: string
  window: {
    start: Date
    end: Date
  }
  requestedTime?: Date
}

export function calculateBookingWindow(
  config: BookingWindowConfig,
  serviceOverrides?: {
    maxAdvanceDays?: number | null
    minAdvanceHours?: number | null
  }
): { start: Date; end: Date } {
  const now = new Date()

  // Determine effective values (service overrides > business defaults)
  const maxDays =
    serviceOverrides?.maxAdvanceDays !== null && serviceOverrides?.maxAdvanceDays !== undefined
      ? serviceOverrides.maxAdvanceDays === -1
        ? 365
        : serviceOverrides.maxAdvanceDays
      : config.maxAdvanceDays

  const minHours =
    serviceOverrides?.minAdvanceHours !== null && serviceOverrides?.minAdvanceHours !== undefined
      ? serviceOverrides.minAdvanceHours
      : config.minAdvanceHours

  // Calculate start (earliest bookable time)
  const start = new Date(now)
  if (minHours > 0) {
    start.setTime(start.getTime() + minHours * 60 * 60 * 1000)
  } else if (!config.sameDayBooking) {
    // If same-day not allowed, start tomorrow
    start.setDate(start.getDate() + 1)
    start.setHours(0, 0, 0, 0)
  } else if (config.sameDayLeadTime > 0) {
    start.setTime(start.getTime() + config.sameDayLeadTime * 60 * 1000)
  }

  // Calculate end (latest bookable time)
  const end = new Date(now)
  end.setDate(end.getDate() + maxDays)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

export function validateBookingWindow(
  requestedDateTime: Date,
  config: BookingWindowConfig,
  serviceOverrides?: {
    maxAdvanceDays?: number | null
    minAdvanceHours?: number | null
  }
): BookingWindowResult {
  const window = calculateBookingWindow(config, serviceOverrides)
  const now = new Date()

  // Check if requested time is in the past
  if (requestedDateTime < now) {
    return {
      canBook: false,
      reason: 'Cannot book appointments in the past',
      window,
      requestedTime: requestedDateTime,
    }
  }

  // Check minimum advance time
  if (requestedDateTime < window.start) {
    const minHours = serviceOverrides?.minAdvanceHours ?? config.minAdvanceHours
    const hoursUntilSlot = Math.ceil(
      (requestedDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    )

    if (minHours > 0) {
      return {
        canBook: false,
        reason: `This service requires at least ${minHours} hours advance notice. You're trying to book ${hoursUntilSlot} hours from now.`,
        window,
        requestedTime: requestedDateTime,
      }
    }

    if (!config.sameDayBooking) {
      return {
        canBook: false,
        reason: 'Same-day bookings are not available for this service',
        window,
        requestedTime: requestedDateTime,
      }
    }

    return {
      canBook: false,
      reason: `Bookings require at least ${config.sameDayLeadTime} minutes notice`,
      window,
      requestedTime: requestedDateTime,
    }
  }

  // Check maximum advance time
  if (requestedDateTime > window.end) {
    const maxDays = serviceOverrides?.maxAdvanceDays ?? config.maxAdvanceDays
    return {
      canBook: false,
      reason: `Bookings can only be made up to ${maxDays} days in advance`,
      window,
      requestedTime: requestedDateTime,
    }
  }

  return {
    canBook: true,
    window,
    requestedTime: requestedDateTime,
  }
}

export function getEffectiveBookingLimits(
  businessSettings: {
    maxAdvanceDays: number
    minAdvanceHours: number
    sameDayBooking: boolean
    sameDayLeadTime: number
  },
  serviceSettings?: {
    maxAdvanceBookingDays?: number | null
    minAdvanceBookingHours?: number | null
  }
): {
  maxAdvanceDays: number
  minAdvanceHours: number
  sameDayBooking: boolean
  sameDayLeadTime: number
  source: {
    maxAdvance: 'business' | 'service'
    minAdvance: 'business' | 'service'
  }
} {
  const maxAdvanceDays =
    serviceSettings?.maxAdvanceBookingDays !== null &&
    serviceSettings?.maxAdvanceBookingDays !== undefined
      ? serviceSettings.maxAdvanceBookingDays === -1
        ? 365
        : serviceSettings.maxAdvanceBookingDays
      : businessSettings.maxAdvanceDays

  const minAdvanceHours =
    serviceSettings?.minAdvanceBookingHours !== null &&
    serviceSettings?.minAdvanceBookingHours !== undefined
      ? serviceSettings.minAdvanceBookingHours
      : businessSettings.minAdvanceHours

  // If service has high minimum advance, effectively disable same-day
  const effectiveSameDayBooking = minAdvanceHours >= 24 ? false : businessSettings.sameDayBooking

  return {
    maxAdvanceDays,
    minAdvanceHours,
    sameDayBooking: effectiveSameDayBooking,
    sameDayLeadTime: businessSettings.sameDayLeadTime,
    source: {
      maxAdvance:
        serviceSettings?.maxAdvanceBookingDays !== null &&
        serviceSettings?.maxAdvanceBookingDays !== undefined
          ? 'service'
          : 'business',
      minAdvance:
        serviceSettings?.minAdvanceBookingHours !== null &&
        serviceSettings?.minAdvanceBookingHours !== undefined
          ? 'service'
          : 'business',
    },
  }
}
