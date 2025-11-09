import { BusinessCategory } from '@prisma/client'
import z from 'zod'

export const businessSettingsSchema = z.object({
  // === Feature Toggles ===
  faqEnabled: z.boolean().optional(),
  inquiriesEnabled: z.boolean().optional(),
  bookingEnabled: z.boolean().optional(),

  // === Booking Settings ===
  bufferTime: z.number().int().min(0).max(120).optional(),
  advanceBookingDays: z.number().int().min(1).max(365).optional(),
  sameDayBooking: z.boolean().optional(),
  cancellationPolicy: z.string().max(1000).optional(),
  requireDeposit: z.boolean().optional(),
  depositAmount: z.number().min(0).max(100).optional(),

  // === Notification Preferences ===
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  bookingConfirmation: z.boolean().optional(),
  reminderEnabled: z.boolean().optional(),
  reminderHours: z.number().int().min(1).max(168).optional(),
  notifyOnNewInquiry: z.boolean().optional(),
  notifyOnNewBooking: z.boolean().optional(),

  // === Contact Preferences ===
  preferredContactMethod: z.enum(['email', 'phone', 'sms']).optional(),
  emergencyPhone: z.string().max(20).optional(),
  afterHoursMessage: z.string().max(500).optional(),
  autoReplyEnabled: z.boolean().optional(),
  autoReplyMessage: z.string().max(1000).optional(),

  // === Display Settings ===
  showPrices: z.boolean().optional(),
  showDuration: z.boolean().optional(),
  requireApproval: z.boolean().optional(),
  allowWaitlist: z.boolean().optional(),
  showTeamMembers: z.boolean().optional(),

  // === Business Info ===
  about: z.string().max(2000).optional(),
  specialties: z.array(z.string().max(50)).max(20).optional(),
  languages: z.array(z.string().length(2)).max(10).optional(),
  paymentMethods: z.array(z.string().max(50)).max(15).optional(),

  // === Timezone & Locale ===
  displayTimezone: z.string().optional(),
  acceptInternationalBookings: z.boolean().optional(),
})

export type BusinessSettingsInput = z.infer<typeof businessSettingsSchema>

/**
 * Update business profile schema (basic info)
 */
export const updateBusinessProfileSchema = z.object({
  name: z.string().min(1, 'Business name is required').max(100).optional(),
  category: z.nativeEnum(BusinessCategory).optional(),
  description: z.string().max(2000).optional(),
  tagline: z.string().max(200).optional(),

  // Contact info
  email: z.string().email('Invalid email').optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  website: z.string().url('Invalid URL').optional().nullable(),

  // Address
  address: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  zipCode: z.string().max(20).optional().nullable(),
  country: z.string().length(2).optional().nullable(),

  // Location
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  timezone: z.string().optional(),

  // SEO
  seoTitle: z.string().max(60).optional().nullable(),
  seoDescription: z.string().max(160).optional().nullable(),
  seoKeywords: z.array(z.string().max(50)).max(20).optional(),

  // Status
  isPublished: z.boolean().optional(),
})

export type UpdateBusinessProfileInput = z.infer<typeof updateBusinessProfileSchema>

/**
 * Social links schema
 */
export const socialLinksSchema = z.object({
  instagram: z.string().url('Invalid Instagram URL').optional().nullable(),
  facebook: z.string().url('Invalid Facebook URL').optional().nullable(),
  twitter: z.string().url('Invalid Twitter URL').optional().nullable(),
  linkedin: z.string().url('Invalid LinkedIn URL').optional().nullable(),
  tiktok: z.string().url('Invalid TikTok URL').optional().nullable(),
  youtube: z.string().url('Invalid YouTube URL').optional().nullable(),
})

export type SocialLinksInput = z.infer<typeof socialLinksSchema>

/**
 * Business branding schema
 */
export const businessBrandingSchema = z.object({
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color')
    .optional()
    .nullable(),
  secondaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color')
    .optional()
    .nullable(),
  accentColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color')
    .optional()
    .nullable(),
  fontFamily: z.string().max(50).optional().nullable(),
  logoUrl: z.string().url('Invalid logo URL').optional().nullable(),
  coverImageUrl: z.string().url('Invalid cover image URL').optional().nullable(),
})

export type BusinessBrandingInput = z.infer<typeof businessBrandingSchema>

/**
 * Combined update business schema (for partial updates)
 */
export const updateBusinessSchema = z.object({
  // Basic profile
  profile: updateBusinessProfileSchema.optional(),

  // Settings
  settings: businessSettingsSchema.optional(),

  // Social links
  socialLinks: socialLinksSchema.optional(),

  // Branding
  branding: businessBrandingSchema.optional(),
})

export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>

/**
 * Business hours validation
 */
export const businessHoursSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  openTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (use HH:MM)'),
  closeTime: z
    .string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (use HH:MM)'),
  isClosed: z.boolean(),
  notes: z.string().max(200).optional().nullable(),
})

export type BusinessHoursInput = z.infer<typeof businessHoursSchema>

/**
 * Bulk update business hours (all 7 days)
 */
export const updateBusinessHoursSchema = z.object({
  hours: z.array(businessHoursSchema).length(7, 'Must provide hours for all 7 days'),
})

export type UpdateBusinessHoursInput = z.infer<typeof updateBusinessHoursSchema>

/**
 * Timezone validation helper
 */
export const timezoneSchema = z.string().refine(
  tz => {
    try {
      // Test if timezone is valid by trying to format a date with it
      new Intl.DateTimeFormat('en', { timeZone: tz }).format(new Date())
      return true
    } catch {
      return false
    }
  },
  { message: 'Invalid timezone identifier' }
)

/**
 * Query parameters for business settings API
 */
export const businessSettingsQuerySchema = z.object({
  section: z.enum(['all', 'profile', 'settings', 'branding', 'social', 'hours']).optional(),
})

export type BusinessSettingsQuery = z.infer<typeof businessSettingsQuerySchema>
