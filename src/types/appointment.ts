import {
  Appointment,
  AppointmentStatus,
  CancellationSource,
  PaymentStatus,
  Service,
  Customer,
  Business,
} from '@prisma/client'

/**
 * Minimal type for status check functions
 */
export type AppointmentStatusCheck = Pick<Appointment, 'status' | 'startTime' | 'endTime'>

/**
 * Appointment with relations
 */
export type AppointmentWithRelations = Appointment & {
  service: Service
  customer: Customer
  business?: Pick<Business, 'id' | 'name' | 'slug' | 'timezone'>
}

/**
 * Appointment status labels
 */
export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No Show',
  RESCHEDULED: 'Rescheduled',
}

/**
 * Appointment status colors (for UI)
 */
export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  NO_SHOW: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  RESCHEDULED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
}

/**
 * Payment status labels
 */
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: 'Unpaid',
  PARTIALLY_PAID: 'Partially Paid',
  PAID: 'Paid',
  REFUNDED: 'Refunded',
  FAILED: 'Failed',
}

/**
 * Create appointment data
 */
export interface CreateAppointmentData {
  businessId: string
  serviceId: string
  customerId: string
  startTime: Date
  endTime: Date
  duration: number
  timezone: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  customerNotes?: string
  requiresDeposit?: boolean
  depositAmount?: number
  totalAmount: number
  bookingSource?: string
  bookingIp?: string
}

/**
 * Update appointment data
 */
export interface UpdateAppointmentData {
  startTime?: Date
  endTime?: Date
  status?: AppointmentStatus
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  customerNotes?: string
  businessNotes?: string
  paymentStatus?: PaymentStatus
}

/**
 * Reschedule appointment data
 */
export interface RescheduleAppointmentData {
  newStartTime: Date
  newEndTime: Date
  reason?: string
}

/**
 * Cancel appointment data
 */
export interface CancelAppointmentData {
  source: CancellationSource
  reason?: string
  cancelledBy?: string
}

/**
 * Appointment filter options
 */
export interface AppointmentFilterOptions {
  businessId?: string
  serviceId?: string
  customerId?: string
  status?: AppointmentStatus
  startDate?: Date
  endDate?: Date
  search?: string
}

/**
 * Check if appointment is upcoming
 */
export function isUpcoming(appointment: AppointmentStatusCheck): boolean {
  return (
    appointment.startTime > new Date() &&
    (appointment.status === 'PENDING' || appointment.status === 'CONFIRMED')
  )
}

/**
 * Check if appointment is past
 */
export function isPast(appointment: AppointmentStatusCheck): boolean {
  return appointment.startTime < new Date()
}

/**
 * Check if appointment can be cancelled
 */
export function canBeCancelled(appointment: AppointmentStatusCheck): boolean {
  return (
    (appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') &&
    appointment.startTime > new Date()
  )
}

/**
 * Check if appointment can be rescheduled
 */
export function canBeRescheduled(appointment: AppointmentStatusCheck): boolean {
  return (
    (appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') &&
    appointment.startTime > new Date()
  )
}

/**
 * Check if appointment can be marked as completed
 */
export function canBeCompleted(appointment: AppointmentStatusCheck): boolean {
  return appointment.status === 'CONFIRMED' && appointment.startTime <= new Date()
}

/**
 * Check if appointment can be marked as no-show
 */
export function canBeMarkedNoShow(appointment: AppointmentStatusCheck): boolean {
  return appointment.status === 'CONFIRMED' && appointment.endTime < new Date()
}

/**
 * Get appointment duration in minutes
 */
export function getAppointmentDuration(startTime: Date, endTime: Date): number {
  return Math.round((endTime.getTime() - startTime.getTime()) / 1000 / 60)
}

/**
 * Format appointment time range
 */
export function formatAppointmentTimeRange(
  startTime: Date,
  endTime: Date,
  timezone?: string
): string {
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
  }

  const start = startTime.toLocaleTimeString('en-US', options)
  const end = endTime.toLocaleTimeString('en-US', options)

  return `${start} - ${end}`
}

/**
 * Format appointment date
 */
export function formatAppointmentDate(date: Date, timezone?: string): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: timezone,
  }

  return date.toLocaleDateString('en-US', options)
}

/**
 * Get time until appointment
 */
export function getTimeUntilAppointment(startTime: Date): string {
  const now = new Date()
  const diff = startTime.getTime() - now.getTime()

  if (diff < 0) {
    return 'Past'
  }

  const minutes = Math.floor(diff / 1000 / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days} day${days === 1 ? '' : 's'}`
  }

  if (hours > 0) {
    return `${hours} hour${hours === 1 ? '' : 's'}`
  }

  return `${minutes} minute${minutes === 1 ? '' : 's'}`
}

/**
 * Calculate appointment statistics
 */
export interface AppointmentStats {
  total: number
  pending: number
  confirmed: number
  completed: number
  cancelled: number
  noShow: number
  upcomingCount: number
  todayCount: number
}

/**
 * Appointment conflict check result
 */
export interface ConflictCheckResult {
  hasConflict: boolean
  conflictingAppointments?: Appointment[]
  reason?: string
}
