import { RateLimitRule } from 'types/rate-limit'

/**
 * Rate limit rules for different endpoints
 */
export const RATE_LIMIT_RULES: Record<string, RateLimitRule> = {
  // Authentication endpoints
  'auth:login': {
    endpoint: 'auth:login',
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
    message: 'Too many login attempts. Please try again later.',
  },

  'auth:signup': {
    endpoint: 'auth:signup',
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many signup attempts. Please try again later.',
  },

  'auth:password-reset-request': {
    endpoint: 'auth:password-reset-request',
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many password reset requests. Please try again later.',
  },

  'auth:password-reset-complete': {
    endpoint: 'auth:password-reset-complete',
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
    message: 'Too many password reset attempts. Please try again later.',
  },

  'auth:verify-email': {
    endpoint: 'auth:verify-email',
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many verification attempts. Please try again later.',
  },

  'auth:mfa-verify': {
    endpoint: 'auth:mfa-verify',
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
    message: 'Too many MFA verification attempts. Please try again later.',
  },

  // Booking endpoints
  'booking:create': {
    endpoint: 'booking:create',
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many booking attempts. Please try again later.',
  },

  'booking:cancel': {
    endpoint: 'booking:cancel',
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many cancellation attempts. Please try again later.',
  },

  'booking:reschedule': {
    endpoint: 'booking:reschedule',
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many reschedule attempts. Please try again later.',
  },

  // API endpoints
  'api:general': {
    endpoint: 'api:general',
    maxAttempts: 100,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many requests. Please slow down.',
  },

  'api:search': {
    endpoint: 'api:search',
    maxAttempts: 30,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many search requests. Please slow down.',
  },

  // Email endpoints
  'email:send': {
    endpoint: 'email:send',
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many emails sent. Please try again later.',
  },

  // SMS endpoints
  'sms:send': {
    endpoint: 'sms:send',
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many SMS sent. Please try again later.',
  },

  // Handle availability check
  'handle:check': {
    endpoint: 'handle:check',
    maxAttempts: 20,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many handle checks. Please slow down.',
  },
}

/**
 * Get rate limit rule for endpoint
 */
export function getRateLimitRule(endpoint: string): RateLimitRule {
  return RATE_LIMIT_RULES[endpoint] || RATE_LIMIT_RULES['api:general']
}

/**
 * Default rate limit rule (fallback)
 */
export const DEFAULT_RATE_LIMIT_RULE: RateLimitRule = {
  endpoint: 'default',
  maxAttempts: 60,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many requests. Please try again later.',
}

/**
 * Rate limit response headers
 */
export const RATE_LIMIT_HEADERS = {
  LIMIT: 'X-RateLimit-Limit',
  REMAINING: 'X-RateLimit-Remaining',
  RESET: 'X-RateLimit-Reset',
  RETRY_AFTER: 'Retry-After',
} as const

/**
 * Rate limit bypass keys (for testing/admin)
 */
export const RATE_LIMIT_BYPASS_KEYS = [
  'test-bypass-key',
  // Add more bypass keys as needed
] as const

/**
 * Check if key should bypass rate limiting
 */
export function shouldBypassRateLimit(key: string): boolean {
  return RATE_LIMIT_BYPASS_KEYS.includes(key as never)
}
