import {
  generateDetailedAvailabilityRange as generateLegacyDetailedAvailabilityRange,
  generateDetailedDayAvailability as generateLegacyDetailedDayAvailability,
  getCurrentTimeInMinutes,
  getTodayInTimezone,
  hasConflict,
  timeToMinutes,
  type DetailedDayAvailability,
  type ExistingAppointment,
  type SlotGenerationConfig,
} from './availability-core'

export * from './availability-core'

type BusinessHoursInput = Array<{
  dayOfWeek: number
  openTime: string
  closeTime: string
  isClosed: boolean
}>

type SpecialDatesInput = Array<{
  date: Date
  name: string
  isClosed: boolean
  openTime?: string | null
  closeTime?: string | null
}>

/**
 * Reconcile the legacy slot output against appointments in the business timezone.
 *
 * The original detailed generator compared UTC/server-local appointment hours with
 * business-local slot labels. During DST, an appointment such as 11:15–12:15 in
 * Europe/London was therefore treated as 10:15–11:15 and a 12:00 slot could be
 * offered even though it overlapped. The final booking transaction still rejected
 * the collision, but only after the customer reached confirmation.
 */
function reconcileDetailedDay(
  day: DetailedDayAvailability,
  existingAppointments: ExistingAppointment[],
  config: SlotGenerationConfig,
  timezone: string
): DetailedDayAvailability {
  const isToday = day.date === getTodayInTimezone(timezone)
  const sameDayLeadTime = config.sameDayLeadTime || 60
  const minimumStartTime = getCurrentTimeInMinutes(timezone) + sameDayLeadTime

  const slots = day.slots.map(slot => {
    const slotStart = timeToMinutes(slot.startTime)
    const slotEnd = timeToMinutes(slot.endTime)

    if (isToday && (!config.sameDayBooking || slotStart < minimumStartTime)) {
      return { ...slot, available: false, reason: 'past' }
    }

    const conflict = hasConflict(
      slotStart,
      slotEnd,
      existingAppointments,
      day.date,
      timezone,
      config.bufferTime || 0
    )

    if (conflict.hasConflict) {
      return {
        ...slot,
        available: false,
        reason: conflict.reason,
      }
    }

    // Remove false conflict/past markers produced from the server timezone.
    if (slot.reason === 'booked' || slot.reason === 'buffer' || slot.reason === 'past') {
      return { ...slot, available: true, reason: undefined }
    }

    return slot
  })

  const totalSlots = slots.length
  const availableSlots = slots.filter(slot => slot.available).length
  const bookedSlots = slots.filter(slot => slot.reason === 'booked').length
  const firstAvailable = slots.find(slot => slot.available)?.startTime
  const lastAvailable = [...slots].reverse().find(slot => slot.available)?.startTime

  let longestGap = 0
  let currentGap = 0
  for (const slot of slots) {
    if (!slot.available) {
      currentGap += config.slotInterval || 15
      longestGap = Math.max(longestGap, currentGap)
    } else {
      currentGap = 0
    }
  }

  return {
    ...day,
    totalSlots,
    availableSlots,
    bookedSlots,
    utilizationPercent: totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0,
    slots,
    summary: {
      firstAvailable,
      lastAvailable,
      longestGap,
    },
  }
}

export function generateDetailedDayAvailability(
  date: Date,
  businessHours: BusinessHoursInput,
  specialDates: SpecialDatesInput,
  existingAppointments: ExistingAppointment[],
  config: SlotGenerationConfig,
  timezone: string = 'Europe/London'
): DetailedDayAvailability {
  return reconcileDetailedDay(
    generateLegacyDetailedDayAvailability(
      date,
      businessHours,
      specialDates,
      existingAppointments,
      config,
      timezone
    ),
    existingAppointments,
    config,
    timezone
  )
}

export function generateDetailedAvailabilityRange(
  startDate: Date,
  endDate: Date,
  businessHours: BusinessHoursInput,
  specialDates: SpecialDatesInput,
  existingAppointments: ExistingAppointment[],
  config: SlotGenerationConfig,
  timezone: string = 'Europe/London'
): DetailedDayAvailability[] {
  return generateLegacyDetailedAvailabilityRange(
    startDate,
    endDate,
    businessHours,
    specialDates,
    existingAppointments,
    config,
    timezone
  ).map(day => reconcileDetailedDay(day, existingAppointments, config, timezone))
}
