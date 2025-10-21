/**
 * Default appointment settings
 */
export const DEFAULT_APPOINTMENT_SETTINGS = {
  reminderHours: 24, // Send reminder 24 hours before
  maxReminderCount: 2, // Maximum reminders per appointment
  bookingSource: 'website',
}

/**
 * Appointment status workflow
 */
export const APPOINTMENT_STATUS_WORKFLOW = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'NO_SHOW', 'CANCELLED', 'RESCHEDULED'],
  COMPLETED: [], // Terminal state
  CANCELLED: [], // Terminal state
  NO_SHOW: [], // Terminal state
  RESCHEDULED: [], // Terminal state
} as const

/**
 * Cancellation reasons (suggested)
 */
export const CANCELLATION_REASONS = [
  'Schedule conflict',
  'Personal emergency',
  'Illness',
  'No longer needed',
  'Found alternative',
  'Price concerns',
  'Location too far',
  'Other',
] as const

/**
 * Reschedule reasons (suggested)
 */
export const RESCHEDULE_REASONS = [
  'Schedule conflict',
  'Personal reasons',
  'Request different time',
  'Emergency',
  'Other',
] as const

/**
 * Booking sources
 */
export const BOOKING_SOURCES = {
  WEBSITE: 'website',
  ADMIN: 'admin',
  API: 'api',
  PHONE: 'phone',
  WALK_IN: 'walk_in',
} as const

/**
 * Time before appointment to allow cancellation (in hours)
 */
export const CANCELLATION_WINDOW_HOURS = 24

/**
 * Time before appointment to allow rescheduling (in hours)
 */
export const RESCHEDULE_WINDOW_HOURS = 24

/**
 * Maximum advance booking days
 */
export const MAX_ADVANCE_BOOKING_DAYS = 90

/**
 * Minimum advance booking hours
 */
export const MIN_ADVANCE_BOOKING_HOURS = 2
