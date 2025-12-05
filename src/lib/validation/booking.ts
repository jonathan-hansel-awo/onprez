import { z } from 'zod'

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
