import { Customer, Review } from '@prisma/client'

/**
 * Customer with relations
 */
export type CustomerWithRelations = Customer & {
  _count?: {
    appointments: number
    reviews: number
  }
  business?: {
    id: string
    name: string
    slug: string
  }
}

/**
 * Customer with appointments
 */
export type CustomerWithAppointments = Customer & {
  appointments: Array<{
    id: string
    startTime: Date
    status: string
    service: {
      name: string
    }
  }>
}

/**
 * Customer preferences structure
 */
export interface CustomerPreferences {
  preferredStaff?: string[]
  preferredServices?: string[]
  preferredDays?: number[] // 0-6
  preferredTimes?: string[] // "morning", "afternoon", "evening"
  specialRequests?: string
  allergies?: string[]
  medicalConditions?: string[]
}

/**
 * Customer custom fields
 */
export interface CustomerCustomFields {
  [key: string]: string | number | boolean | null
}

/**
 * Create customer data
 */
export interface CreateCustomerData {
  email: string
  name: string
  firstName?: string
  lastName?: string
  phone?: string
  birthday?: Date
  gender?: string
  preferences?: CustomerPreferences
  emailOptIn?: boolean
  smsOptIn?: boolean
  marketingOptIn?: boolean
  tags?: string[]
  notes?: string
  source?: string
  referredBy?: string
}

/**
 * Update customer data
 */
export interface UpdateCustomerData {
  email?: string
  name?: string
  firstName?: string
  lastName?: string
  phone?: string
  alternatePhone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  birthday?: Date
  gender?: string
  preferredLanguage?: string
  preferences?: CustomerPreferences
  emailOptIn?: boolean
  smsOptIn?: boolean
  marketingOptIn?: boolean
  tags?: string[]
  customFields?: CustomerCustomFields
  notes?: string
  privateNotes?: string
  isVip?: boolean
  isBlocked?: boolean
  blockReason?: string
  source?: string
  referredBy?: string
}

/**
 * Customer search/filter options
 */
export interface CustomerFilterOptions {
  businessId?: string
  search?: string // Search by name, email, phone
  tags?: string[]
  isVip?: boolean
  isBlocked?: boolean
  hasUpcomingBookings?: boolean
  lastBookingBefore?: Date
  lastBookingAfter?: Date
  minTotalSpent?: number
  minBookings?: number
}

/**
 * Customer statistics
 */
export interface CustomerStats {
  totalCustomers: number
  activeCustomers: number // Booked in last 90 days
  newCustomers: number // Created in last 30 days
  vipCustomers: number
  averageLifetimeValue: number
  averageBookingsPerCustomer: number
  retentionRate: number
}

/**
 * Customer segmentation
 */
export type CustomerSegment =
  | 'new' // First booking within 30 days
  | 'active' // Booked in last 90 days
  | 'at-risk' // No booking in 90-180 days
  | 'inactive' // No booking in 180+ days
  | 'vip' // High value customer
  | 'regular' // Frequent booker

/**
 * Get customer segment
 */
export function getCustomerSegment(customer: Customer): CustomerSegment {
  if (customer.isVip) {
    return 'vip'
  }

  if (!customer.lastBookingAt) {
    return 'new'
  }

  const daysSinceLastBooking = Math.floor(
    (Date.now() - customer.lastBookingAt.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysSinceLastBooking <= 90) {
    return customer.completedBookings >= 5 ? 'regular' : 'active'
  }

  if (daysSinceLastBooking <= 180) {
    return 'at-risk'
  }

  return 'inactive'
}

/**
 * Customer segment labels
 */
export const CUSTOMER_SEGMENT_LABELS: Record<CustomerSegment, string> = {
  new: 'New Customer',
  active: 'Active',
  'at-risk': 'At Risk',
  inactive: 'Inactive',
  vip: 'VIP',
  regular: 'Regular',
}

/**
 * Customer segment colors
 */
export const CUSTOMER_SEGMENT_COLORS: Record<CustomerSegment, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'at-risk': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  vip: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  regular: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
}

/**
 * Format customer name
 */
export function formatCustomerName(customer: Customer): string {
  if (customer.firstName && customer.lastName) {
    return `${customer.firstName} ${customer.lastName}`
  }
  return customer.name
}

/**
 * Get customer initials
 */
export function getCustomerInitials(customer: Customer): string {
  if (customer.firstName && customer.lastName) {
    return `${customer.firstName[0]}${customer.lastName[0]}`.toUpperCase()
  }

  const names = customer.name.split(' ')
  if (names.length >= 2) {
    return `${names[0][0]}${names[1][0]}`.toUpperCase()
  }

  return customer.name.substring(0, 2).toUpperCase()
}

/**
 * Calculate customer lifetime value
 */
export function calculateLifetimeValue(customer: Customer): number {
  return Number(customer.totalSpent)
}

/**
 * Calculate customer retention score (0-100)
 */
export function calculateRetentionScore(customer: Customer): number {
  if (!customer.firstBookingAt || !customer.lastBookingAt) {
    return 0
  }

  const daysSinceFirst = Math.floor(
    (Date.now() - customer.firstBookingAt.getTime()) / (1000 * 60 * 60 * 24)
  )

  const daysSinceLast = Math.floor(
    (Date.now() - customer.lastBookingAt.getTime()) / (1000 * 60 * 60 * 24)
  )

  // If new customer (< 30 days), give neutral score
  if (daysSinceFirst < 30) {
    return 50
  }

  // Calculate score based on recency and frequency
  const recencyScore = Math.max(0, 100 - (daysSinceLast / 180) * 100)
  const frequencyScore = Math.min(100, (customer.completedBookings / daysSinceFirst) * 365 * 20)

  // Weighted average (60% recency, 40% frequency)
  return Math.round(recencyScore * 0.6 + frequencyScore * 0.4)
}

/**
 * Check if customer is at risk of churning
 */
export function isAtRiskOfChurning(customer: Customer): boolean {
  if (!customer.lastBookingAt) {
    return false
  }

  const daysSinceLastBooking = Math.floor(
    (Date.now() - customer.lastBookingAt.getTime()) / (1000 * 60 * 60 * 24)
  )

  // At risk if no booking in 90-180 days
  return daysSinceLastBooking > 90 && daysSinceLastBooking <= 180
}

/**
 * Customer contact sources
 */
export const CUSTOMER_SOURCES = [
  'Website',
  'Instagram',
  'Facebook',
  'Google Search',
  'Referral',
  'Walk-in',
  'Phone',
  'Email',
  'Other',
] as const

/**
 * Gender options
 */
export const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'] as const

/**
 * Language options
 */
export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
] as const
