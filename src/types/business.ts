import { Business, BusinessCategory, BusinessHours } from '@prisma/client'

/**
 * Business with related data
 */
export type BusinessWithRelations = Business & {
  businessHours?: BusinessHours[]
  _count?: {
    services: number
    appointments: number
    customers: number
  }
}

/**
 * Social media links structure
 */
export interface SocialLinks {
  instagram?: string
  facebook?: string
  twitter?: string
  linkedin?: string
  tiktok?: string
  youtube?: string
}

/**
 * Business branding structure
 */
export interface BusinessBranding {
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  fontFamily?: string
  logoUrl?: string
  coverImageUrl?: string
}

/**
 * Business settings structure
 */
export interface BusinessSettings {
  // Booking settings
  bufferTime?: number // minutes between appointments
  advanceBookingDays?: number // how far ahead can customers book
  sameDayBooking?: boolean
  cancellationPolicy?: string

  // Notification settings
  emailNotifications?: boolean
  smsNotifications?: boolean
  bookingConfirmation?: boolean
  reminderEnabled?: boolean
  reminderHours?: number // hours before appointment

  // Display settings
  showPrices?: boolean
  showDuration?: boolean
  requireApproval?: boolean
  allowWaitlist?: boolean

  // Business info
  about?: string
  specialties?: string[]
  languages?: string[]
  paymentMethods?: string[]
}

/**
 * Business hours structure
 */
export interface BusinessHoursData {
  dayOfWeek: number // 0-6
  openTime: string // "09:00"
  closeTime: string // "17:00"
  isClosed: boolean
  notes?: string
}

/**
 * Day of week labels
 */
export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

/**
 * Business category labels
 */
export const BUSINESS_CATEGORY_LABELS: Record<BusinessCategory, string> = {
  SALON: 'Hair Salon',
  BARBERSHOP: 'Barbershop',
  SPA: 'Spa',
  MASSAGE: 'Massage Therapy',
  NAILS: 'Nail Salon',
  BEAUTY: 'Beauty Services',
  FITNESS: 'Fitness Center',
  YOGA: 'Yoga Studio',
  PERSONAL_TRAINING: 'Personal Training',
  THERAPY: 'Therapy',
  COUNSELING: 'Counseling',
  TUTORING: 'Tutoring',
  CONSULTING: 'Consulting',
  PHOTOGRAPHY: 'Photography',
  VIDEOGRAPHY: 'Videography',
  EVENT_PLANNING: 'Event Planning',
  CATERING: 'Catering',
  CLEANING: 'Cleaning Services',
  HOME_SERVICES: 'Home Services',
  PET_SERVICES: 'Pet Services',
  OTHER: 'Other',
}

/**
 * Create business data
 */
export interface CreateBusinessData {
  name: string
  slug: string
  category: BusinessCategory
  description?: string
  tagline?: string
  email?: string
  phone?: string
  timezone?: string
}

/**
 * Update business data
 */
export interface UpdateBusinessData {
  name?: string
  slug?: string
  category?: BusinessCategory
  description?: string
  tagline?: string
  email?: string
  phone?: string
  website?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  timezone?: string
  socialLinks?: SocialLinks
  settings?: BusinessSettings
  branding?: BusinessBranding
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string[]
  isPublished?: boolean
}

/**
 * Business slug validation
 */
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const RESERVED_SLUGS = [
  'admin',
  'api',
  'app',
  'auth',
  'blog',
  'dashboard',
  'help',
  'login',
  'logout',
  'pricing',
  'privacy',
  'signup',
  'support',
  'terms',
  'about',
  'contact',
  'home',
  'onprez',
]

export function isValidSlug(slug: string): boolean {
  return (
    SLUG_REGEX.test(slug) &&
    !RESERVED_SLUGS.includes(slug.toLowerCase()) &&
    slug.length >= 3 &&
    slug.length <= 30
  )
}

export function formatSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 30)
}

// Add these timezones (replace existing TIMEZONES)
export interface TimezoneOption {
  value: string
  label: string
  offset: string
  region: string
}

export const TIMEZONES: TimezoneOption[] = [
  // UK & Ireland
  { value: 'Europe/London', label: 'London (GMT/BST)', offset: '+00:00', region: 'UK & Ireland' },
  { value: 'Europe/Dublin', label: 'Dublin (GMT/IST)', offset: '+00:00', region: 'UK & Ireland' },

  // Western Europe
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)', offset: '+01:00', region: 'Western Europe' },
  {
    value: 'Europe/Berlin',
    label: 'Berlin (CET/CEST)',
    offset: '+01:00',
    region: 'Western Europe',
  },
  {
    value: 'Europe/Amsterdam',
    label: 'Amsterdam (CET/CEST)',
    offset: '+01:00',
    region: 'Western Europe',
  },
  {
    value: 'Europe/Brussels',
    label: 'Brussels (CET/CEST)',
    offset: '+01:00',
    region: 'Western Europe',
  },
  {
    value: 'Europe/Madrid',
    label: 'Madrid (CET/CEST)',
    offset: '+01:00',
    region: 'Western Europe',
  },
  { value: 'Europe/Rome', label: 'Rome (CET/CEST)', offset: '+01:00', region: 'Western Europe' },
  {
    value: 'Europe/Zurich',
    label: 'Zurich (CET/CEST)',
    offset: '+01:00',
    region: 'Western Europe',
  },

  // Northern Europe
  { value: 'Europe/Oslo', label: 'Oslo (CET/CEST)', offset: '+01:00', region: 'Northern Europe' },
  {
    value: 'Europe/Stockholm',
    label: 'Stockholm (CET/CEST)',
    offset: '+01:00',
    region: 'Northern Europe',
  },
  {
    value: 'Europe/Copenhagen',
    label: 'Copenhagen (CET/CEST)',
    offset: '+01:00',
    region: 'Northern Europe',
  },
  {
    value: 'Europe/Helsinki',
    label: 'Helsinki (EET/EEST)',
    offset: '+02:00',
    region: 'Northern Europe',
  },

  // Eastern Europe
  {
    value: 'Europe/Athens',
    label: 'Athens (EET/EEST)',
    offset: '+02:00',
    region: 'Eastern Europe',
  },
  {
    value: 'Europe/Warsaw',
    label: 'Warsaw (CET/CEST)',
    offset: '+01:00',
    region: 'Eastern Europe',
  },
  {
    value: 'Europe/Prague',
    label: 'Prague (CET/CEST)',
    offset: '+01:00',
    region: 'Eastern Europe',
  },
  {
    value: 'Europe/Budapest',
    label: 'Budapest (CET/CEST)',
    offset: '+01:00',
    region: 'Eastern Europe',
  },
  { value: 'Europe/Moscow', label: 'Moscow (MSK)', offset: '+03:00', region: 'Eastern Europe' },

  // North America
  { value: 'America/New_York', label: 'New York (ET)', offset: '-05:00', region: 'North America' },
  { value: 'America/Chicago', label: 'Chicago (CT)', offset: '-06:00', region: 'North America' },
  { value: 'America/Denver', label: 'Denver (MT)', offset: '-07:00', region: 'North America' },
  {
    value: 'America/Los_Angeles',
    label: 'Los Angeles (PT)',
    offset: '-08:00',
    region: 'North America',
  },
  { value: 'America/Toronto', label: 'Toronto (ET)', offset: '-05:00', region: 'North America' },

  // Asia-Pacific
  { value: 'Asia/Dubai', label: 'Dubai (GST)', offset: '+04:00', region: 'Middle East' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)', offset: '+08:00', region: 'Southeast Asia' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)', offset: '+09:00', region: 'East Asia' },
  {
    value: 'Australia/Sydney',
    label: 'Sydney (AEST/AEDT)',
    offset: '+10:00',
    region: 'Australia & NZ',
  },
  {
    value: 'Australia/Melbourne',
    label: 'Melbourne (AEST/AEDT)',
    offset: '+10:00',
    region: 'Australia & NZ',
  },
  {
    value: 'Pacific/Auckland',
    label: 'Auckland (NZST/NZDT)',
    offset: '+12:00',
    region: 'Australia & NZ',
  },
]

export function getTimezonesByRegion(): Record<string, TimezoneOption[]> {
  const grouped: Record<string, TimezoneOption[]> = {}
  TIMEZONES.forEach(tz => {
    if (!grouped[tz.region]) grouped[tz.region] = []
    grouped[tz.region].push(tz)
  })
  return grouped
}

// Update BusinessSettings interface (merge with existing)
export interface BusinessSettings {
  // Feature Toggles
  faqEnabled?: boolean
  inquiriesEnabled?: boolean
  bookingEnabled?: boolean

  // Booking Settings
  bufferTime?: number
  advanceBookingDays?: number
  sameDayBooking?: boolean
  cancellationPolicy?: string
  requireDeposit?: boolean
  depositAmount?: number

  // Notifications
  emailNotifications?: boolean
  smsNotifications?: boolean
  bookingConfirmation?: boolean
  reminderEnabled?: boolean
  reminderHours?: number
  notifyOnNewInquiry?: boolean
  notifyOnNewBooking?: boolean

  // Contact Preferences
  preferredContactMethod?: 'email' | 'phone' | 'sms'
  emergencyPhone?: string
  afterHoursMessage?: string
  autoReplyEnabled?: boolean
  autoReplyMessage?: string

  // Display Settings
  showPrices?: boolean
  showDuration?: boolean
  requireApproval?: boolean
  allowWaitlist?: boolean
  showTeamMembers?: boolean

  // Business Info
  about?: string
  specialties?: string[]
  languages?: string[]
  paymentMethods?: string[]

  // Timezone
  displayTimezone?: string
  acceptInternationalBookings?: boolean
}

// Update DEFAULT_BUSINESS_SETTINGS (merge with existing)
export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  faqEnabled: false,
  inquiriesEnabled: true,
  bookingEnabled: true,
  bufferTime: 15,
  advanceBookingDays: 30,
  sameDayBooking: true,
  requireDeposit: false,
  emailNotifications: true,
  smsNotifications: false,
  bookingConfirmation: true,
  reminderEnabled: true,
  reminderHours: 24,
  notifyOnNewInquiry: true,
  notifyOnNewBooking: true,
  preferredContactMethod: 'email',
  autoReplyEnabled: false,
  showPrices: true,
  showDuration: true,
  requireApproval: false,
  allowWaitlist: false,
  showTeamMembers: true,
  acceptInternationalBookings: false,
}

export interface ReminderSettings {
  enabled: boolean
  emailEnabled: boolean
  smsEnabled: boolean // Future
  reminderTimes: number[] // Hours before appointment (e.g., [24, 2])
  defaultMessage?: string
}

export interface BusinessSettings {
  businessHours?: Record<string, { open: string; close: string; closed?: boolean }>
  bufferTime?: number
  advanceBookingDays?: number
  reminders?: ReminderSettings
}
