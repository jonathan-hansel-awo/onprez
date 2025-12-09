import { z } from 'zod'
import {
  validateBookingWindow,
  getEffectiveBookingLimits,
  type BookingWindowConfig,
} from '@/lib/utils/availability'

/**
 * Time format validation (HH:MM)
 */
const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/

/**
 * Create appointment schema (public booking)
 */
export const createAppointmentSchema = z.object({
  businessId: z.string().cuid(),
  serviceId: z.string().cuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)'),
  startTime: z.string().regex(timeRegex, 'Invalid time format (use HH:MM)'),
  customerName: z.string().min(1, 'Name is required').max(100),
  customerEmail: z.string().email('Invalid email address'),
  customerPhone: z.string().max(20).optional().nullable(),
  customerNotes: z.string().max(1000).optional().nullable(),
})

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>

/**
 * Create appointment schema (admin/dashboard)
 */
export const createAppointmentAdminSchema = createAppointmentSchema.extend({
  customerId: z.string().cuid().optional(),
  businessNotes: z.string().max(1000).optional().nullable(),
  status: z.enum(['PENDING', 'CONFIRMED']).optional(),
  skipConflictCheck: z.boolean().optional(),
})

export type CreateAppointmentAdminInput = z.infer<typeof createAppointmentAdminSchema>

/**
 * Update appointment schema
 */
export const updateAppointmentSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  startTime: z.string().regex(timeRegex).optional(),
  status: z
    .enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'])
    .optional(),
  customerName: z.string().min(1).max(100).optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().max(20).optional().nullable(),
  customerNotes: z.string().max(1000).optional().nullable(),
  businessNotes: z.string().max(1000).optional().nullable(),
  cancellationReason: z.string().max(500).optional(),
})

export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>

/**
 * Reschedule appointment schema
 */
export const rescheduleAppointmentSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  startTime: z.string().regex(timeRegex, 'Invalid time format'),
  reason: z.string().max(500).optional(),
  notifyCustomer: z.boolean().optional().default(true),
})

export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>

/**
 * Check availability schema
 */
export const checkAvailabilitySchema = z.object({
  businessId: z.string().cuid(),
  serviceId: z.string().cuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(timeRegex),
  duration: z.number().int().min(5).max(480).optional(),
  excludeAppointmentId: z.string().cuid().optional(),
})

export type CheckAvailabilityInput = z.infer<typeof checkAvailabilitySchema>

/**
 * Appointment list query schema
 */
export const appointmentQuerySchema = z.object({
  status: z
    .enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'])
    .optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  customerId: z.string().cuid().optional(),
  serviceId: z.string().cuid().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(['startTime', 'createdAt', 'status']).optional().default('startTime'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
})

export type AppointmentQueryInput = z.infer<typeof appointmentQuerySchema>

// Update the validateBookingTime function to include window validation
export async function validateBookingTime(
  businessId: string,
  serviceId: string,
  requestedDate: Date,
  requestedStartTime: string
): Promise<{ valid: boolean; error?: string }> {
  // Get business with settings
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      businessHours: true,
      specialDates: true,
    },
  })

  if (!business) {
    return { valid: false, error: 'Business not found' }
  }

  // Get service
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  })

  if (!service) {
    return { valid: false, error: 'Service not found' }
  }

  // Get business booking settings
  const businessSettings = (business.settings as Record<string, unknown>) || {}
  const bookingConfig = (businessSettings.booking as Record<string, unknown>) || {}

  const config: BookingWindowConfig = {
    maxAdvanceDays: (bookingConfig.advanceBookingDays as number) || 30,
    minAdvanceHours: (bookingConfig.minAdvanceHours as number) || 0,
    sameDayBooking: (bookingConfig.sameDayBooking as boolean) ?? true,
    sameDayLeadTime: (bookingConfig.sameDayLeadTime as number) || 60,
    timezone: business.timezone,
  }

  // Build requested datetime
  const [hours, minutes] = requestedStartTime.split(':').map(Number)
  const requestedDateTime = new Date(requestedDate)
  requestedDateTime.setHours(hours, minutes, 0, 0)

  // Validate booking window
  const windowValidation = validateBookingWindow(requestedDateTime, config, {
    maxAdvanceDays: service.maxAdvanceBookingDays,
    minAdvanceHours: service.minAdvanceBookingHours,
  })

  if (!windowValidation.canBook) {
    return { valid: false, error: windowValidation.reason }
  }

  // Continue with existing validation (business hours, special dates, etc.)
  const dateString = requestedDate.toISOString().split('T')[0]
  const dayOfWeek = requestedDate.getDay()

  // Check special dates
  const specialDate = business.specialDates.find(sd => {
    const sdDate = new Date(sd.date)
    return sdDate.toISOString().split('T')[0] === dateString
  })

  if (specialDate?.isClosed) {
    return { valid: false, error: `Business is closed on ${specialDate.name}` }
  }

  // Check business hours
  const dayHours = business.businessHours.find(bh => bh.dayOfWeek === dayOfWeek)

  let isOpen = false
  let openTime: string | undefined
  let closeTime: string | undefined

  if (specialDate && !specialDate.isClosed && specialDate.openTime && specialDate.closeTime) {
    isOpen = true
    openTime = specialDate.openTime
    closeTime = specialDate.closeTime
  } else if (dayHours && !dayHours.isClosed) {
    isOpen = true
    openTime = dayHours.openTime
    closeTime = dayHours.closeTime
  }

  if (!isOpen) {
    return { valid: false, error: 'Business is closed on this day' }
  }

  // Check if time is within business hours
  const requestedMinutes = hours * 60 + minutes
  const openMinutes = timeToMinutes(openTime!)
  const closeMinutes = timeToMinutes(closeTime!)
  const endMinutes = requestedMinutes + service.duration

  if (requestedMinutes < openMinutes) {
    return { valid: false, error: `Business opens at ${openTime}` }
  }

  if (endMinutes > closeMinutes) {
    return { valid: false, error: `Appointment would end after closing time (${closeTime})` }
  }

  return { valid: true }
}

// Helper function (add if not already present)
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}
