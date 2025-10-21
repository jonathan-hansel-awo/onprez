/**
 * Default service values
 */
export const DEFAULT_SERVICE_VALUES = {
  duration: 60, // 1 hour
  bufferTime: 0,
  currency: 'USD',
  priceType: 'FIXED' as const,
  requiresApproval: false,
  requiresDeposit: false,
  featured: false,
  active: true,
  order: 0,
}

/**
 * Service validation rules
 */
export const SERVICE_VALIDATION = {
  name: {
    minLength: 2,
    maxLength: 100,
  },
  description: {
    maxLength: 2000,
  },
  tagline: {
    maxLength: 100,
  },
  price: {
    min: 0,
    max: 999999.99,
  },
  duration: {
    min: 5, // 5 minutes
    max: 480, // 8 hours
  },
  bufferTime: {
    min: 0,
    max: 120, // 2 hours
  },
}

/**
 * Popular service durations
 */
export const POPULAR_DURATIONS = [15, 30, 45, 60, 90, 120] as const

/**
 * Service category icons (emoji)
 */
export const SERVICE_CATEGORY_ICONS = [
  '✂️', // Haircut
  '💅', // Nails
  '💆', // Massage
  '🧘', // Yoga
  '💪', // Fitness
  '🎨', // Art/Creative
  '📸', // Photo
  '🎓', // Education
  '🏠', // Home
  '🐕', // Pet
  '🍽️', // Food
  '🎭', // Entertainment
] as const

/**
 * Service category colors
 */
export const SERVICE_CATEGORY_COLORS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
] as const
