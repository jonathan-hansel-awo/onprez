import { z } from 'zod'

export const multiDayPatternSchema = z.object({
  type: z.enum(['consecutive', 'weekly', 'custom']),
  // For consecutive: number of days in a row
  consecutiveDays: z.number().min(2).max(14).optional(),
  // For weekly: which days of the week (0=Sun, 6=Sat)
  weeklyDays: z.array(z.number().min(0).max(6)).optional(),
  // For weekly: number of weeks
  weekCount: z.number().min(1).max(12).optional(),
  // For custom: specific dates
  customDates: z.array(z.string()).optional(),
})

export const createMultiDayAppointmentSchema = z.object({
  businessId: z.string(),
  serviceId: z.string(),
  customerId: z.string().optional(),

  // Customer info (if no customerId)
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),

  // Multi-day configuration
  startDate: z.string(), // YYYY-MM-DD
  startTime: z.string(), // HH:MM
  pattern: multiDayPatternSchema,

  // Notes
  customerNotes: z.string().optional(),
  businessNotes: z.string().optional(),
})

export type MultiDayPattern = z.infer<typeof multiDayPatternSchema>
export type CreateMultiDayAppointment = z.infer<typeof createMultiDayAppointmentSchema>
