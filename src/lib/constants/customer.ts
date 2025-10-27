/**
 * Default customer values
 */
export const DEFAULT_CUSTOMER_VALUES = {
  emailOptIn: true,
  smsOptIn: false,
  marketingOptIn: false,
  isVip: false,
  isBlocked: false,
  totalBookings: 0,
  completedBookings: 0,
  cancelledBookings: 0,
  noShowCount: 0,
  totalSpent: 0,
  country: 'US',
  preferredLanguage: 'en',
}

/**
 * Customer validation rules
 */
export const CUSTOMER_VALIDATION = {
  name: {
    minLength: 2,
    maxLength: 100,
  },
  email: {
    maxLength: 255,
  },
  phone: {
    minLength: 10,
    maxLength: 20,
  },
  notes: {
    maxLength: 5000,
  },
}

/**
 * VIP customer criteria
 */
export const VIP_CRITERIA = {
  minTotalSpent: 1000, // $1000+ total spent
  minBookings: 10, // 10+ completed bookings
  minAverageRating: 4.5, // 4.5+ average rating
}

/**
 * At-risk customer criteria
 */
export const AT_RISK_CRITERIA = {
  daysSinceLastBooking: 90, // No booking in 90+ days
}

/**
 * Inactive customer criteria
 */
export const INACTIVE_CRITERIA = {
  daysSinceLastBooking: 180, // No booking in 180+ days
}

/**
 * Customer tag colors (for UI)
 */
export const CUSTOMER_TAG_COLORS = [
  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
] as const

/**
 * Common customer tags
 */
export const COMMON_CUSTOMER_TAGS = [
  'VIP',
  'Regular',
  'First-time',
  'Referral',
  'High-value',
  'At-risk',
  'Loyalty program',
  'Newsletter subscriber',
] as const

/**
 * Communication preferences
 */
export const COMMUNICATION_PREFERENCES = {
  email: {
    label: 'Email',
    description: 'Receive booking confirmations and updates',
  },
  sms: {
    label: 'SMS',
    description: 'Receive text message reminders',
  },
  marketing: {
    label: 'Marketing',
    description: 'Receive promotional offers and newsletters',
  },
} as const
