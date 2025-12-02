/* eslint-disable @typescript-eslint/no-explicit-any */
import { BusinessHours } from '@prisma/client'

interface Service {
  useBusinessHours: boolean
  availableDays: number[]
  customAvailability?: any
  duration: number
  bufferTime: number
}

interface Business {
  businessHours: BusinessHours[]
  timezone: string
}

/**
 * Check if service is available on a specific date
 */
export function isServiceAvailableOnDate(
  service: Service,
  date: Date,
  business: Business
): boolean {
  const dayOfWeek = date.getDay()

  // Check if day is in available days
  if (!service.availableDays.includes(dayOfWeek)) {
    return false
  }

  // If using business hours, check business hours
  if (service.useBusinessHours) {
    const businessHour = business.businessHours.find(bh => bh.dayOfWeek === dayOfWeek)
    if (!businessHour || businessHour.isClosed) {
      return false
    }
  }

  return true
}

/**
 * Get available time slots for a service on a specific date
 */
export function getServiceTimeSlots(
  service: Service,
  date: Date,
  business: Business
): { start: string; end: string }[] {
  const dayOfWeek = date.getDay()

  if (!isServiceAvailableOnDate(service, date, business)) {
    return []
  }

  // If custom availability exists, use it
  if (!service.useBusinessHours && service.customAvailability) {
    const dayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
      dayOfWeek
    ]
    return service.customAvailability[dayKey]?.slots || []
  }

  // Otherwise use business hours
  const businessHour = business.businessHours.find(bh => bh.dayOfWeek === dayOfWeek)
  if (!businessHour || businessHour.isClosed) {
    return []
  }

  return [
    {
      start: businessHour.openTime,
      end: businessHour.closeTime,
    },
  ]
}

/**
 * Calculate total service time including buffer
 */
export function getServiceTotalTime(service: Service): number {
  return service.duration + service.bufferTime
}
