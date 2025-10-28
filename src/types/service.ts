import { Service, ServiceCategory, PriceType } from '@prisma/client'

/**
 * Service with category
 */
export type ServiceWithCategory = Service & {
  category?: ServiceCategory | null
}

/**
 * Service with full relations
 */
export type ServiceWithRelations = Service & {
  category?: ServiceCategory | null
  business?: {
    id: string
    name: string
    slug: string
  }
  _count?: {
    appointments: number
  }
}

/**
 * Price type labels
 */
export const PRICE_TYPE_LABELS: Record<PriceType, string> = {
  FIXED: 'Fixed Price',
  RANGE: 'Price Range',
  STARTING_AT: 'Starting At',
  FREE: 'Free',
}

/**
 * Create service data
 */
export interface CreateServiceData {
  name: string
  description?: string
  tagline?: string
  price: number
  priceType?: PriceType
  priceRangeMin?: number
  priceRangeMax?: number
  duration: number
  bufferTime?: number
  categoryId?: string
  imageUrl?: string
  requiresApproval?: boolean
  requiresDeposit?: boolean
  depositAmount?: number
  preparationNotes?: string
  aftercareNotes?: string
}

/**
 * Update service data
 */
export interface UpdateServiceData {
  name?: string
  description?: string
  tagline?: string
  price?: number
  priceType?: PriceType
  priceRangeMin?: number
  priceRangeMax?: number
  duration?: number
  bufferTime?: number
  categoryId?: string | null
  imageUrl?: string
  galleryImages?: string[]
  requiresApproval?: boolean
  requiresDeposit?: boolean
  depositAmount?: number
  maxAdvanceBookingDays?: number
  featured?: boolean
  active?: boolean
  order?: number
  seoTitle?: string
  seoDescription?: string
  preparationNotes?: string
  aftercareNotes?: string
}

/**
 * Service category data
 */
export interface ServiceCategoryData {
  name: string
  description?: string
  order?: number
  color?: string
  icon?: string
}

/**
 * Duration options (in minutes)
 */
export const DURATION_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 150, label: '2.5 hours' },
  { value: 180, label: '3 hours' },
] as const

/**
 * Format duration for display
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return hours === 1 ? '1 hour' : `${hours} hours`
  }

  return `${hours}h ${remainingMinutes}m`
}

/**
 * Format price for display
 */
export function formatPrice(
  price: number,
  priceType: PriceType,
  priceRangeMin?: number | null,
  priceRangeMax?: number | null,
  currency: string = 'USD'
): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  switch (priceType) {
    case 'FIXED':
      return formatter.format(price)

    case 'RANGE':
      if (priceRangeMin && priceRangeMax) {
        return `${formatter.format(priceRangeMin)} - ${formatter.format(priceRangeMax)}`
      }
      return formatter.format(price)

    case 'STARTING_AT':
      return `From ${formatter.format(price)}`

    case 'FREE':
      return 'Free'

    default:
      return formatter.format(price)
  }
}

/**
 * Validate service pricing
 */
export function validateServicePricing(data: {
  price: number
  priceType: PriceType
  priceRangeMin?: number
  priceRangeMax?: number
}): { valid: boolean; error?: string } {
  const { price, priceType, priceRangeMin, priceRangeMax } = data

  if (priceType === 'FREE') {
    return { valid: true }
  }

  if (price < 0) {
    return { valid: false, error: 'Price cannot be negative' }
  }

  if (priceType === 'RANGE') {
    if (!priceRangeMin || !priceRangeMax) {
      return { valid: false, error: 'Price range requires min and max values' }
    }

    if (priceRangeMin > priceRangeMax) {
      return { valid: false, error: 'Min price cannot be greater than max price' }
    }

    if (priceRangeMin < 0 || priceRangeMax < 0) {
      return { valid: false, error: 'Price range values cannot be negative' }
    }
  }

  return { valid: true }
}

/**
 * Calculate service end time
 */
export function calculateServiceEndTime(
  startTime: Date,
  duration: number,
  bufferTime: number = 0
): Date {
  const endTime = new Date(startTime)
  endTime.setMinutes(endTime.getMinutes() + duration + bufferTime)
  return endTime
}
