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