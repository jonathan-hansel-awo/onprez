import { RateLimit, RateLimitConfig } from '@prisma/client'

/**
 * Rate limit configuration
 */
export interface RateLimitRule {
  endpoint: string
  maxAttempts: number
  windowMs: number
  blockDurationMs?: number
  message?: string
}

/**
 * Rate limit check result
 */
export interface RateLimitCheckResult {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: Date
  retryAfter?: number // seconds until can retry
}

/**
 * Rate limit key types
 */
export type RateLimitKeyType = 'ip' | 'user' | 'email' | 'custom'

/**
 * Rate limit violation
 */
export interface RateLimitViolation {
  key: string
  endpoint: string
  attempts: number
  limit: number
  timestamp: Date
  userAgent?: string
}

/**
 * Rate limit statistics
 */
export interface RateLimitStats {
  totalRequests: number
  blockedRequests: number
  topEndpoints: Array<{
    endpoint: string
    requests: number
  }>
  topViolators: Array<{
    key: string
    violations: number
  }>
}

/**
 * Generate rate limit key
 */
export function generateRateLimitKey(
  type: RateLimitKeyType,
  identifier: string,
  endpoint: string
): string {
  return `${type}:${identifier}:${endpoint}`
}

/**
 * Parse rate limit key
 */
export function parseRateLimitKey(key: string): {
  type: RateLimitKeyType
  identifier: string
  endpoint: string
} | null {
  const parts = key.split(':')
  if (parts.length !== 3) {
    return null
  }

  return {
    type: parts[0] as RateLimitKeyType,
    identifier: parts[1],
    endpoint: parts[2],
  }
}

/**
 * Calculate reset time
 */
export function calculateResetTime(windowStart: Date, windowMs: number): Date {
  return new Date(windowStart.getTime() + windowMs)
}

/**
 * Calculate retry after (in seconds)
 */
export function calculateRetryAfter(resetAt: Date): number {
  const now = new Date()
  const diff = resetAt.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / 1000))
}

/**
 * Check if rate limit has expired
 */
export function isRateLimitExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt
}

/**
 * Format rate limit message
 */
export function formatRateLimitMessage(endpoint: string, retryAfter: number): string {
  const minutes = Math.ceil(retryAfter / 60)

  if (minutes >= 60) {
    const hours = Math.ceil(minutes / 60)
    return `Too many attempts for ${endpoint}. Please try again in ${hours} hour${hours === 1 ? '' : 's'}.`
  }

  if (minutes > 1) {
    return `Too many attempts for ${endpoint}. Please try again in ${minutes} minutes.`
  }

  return `Too many attempts for ${endpoint}. Please try again in ${retryAfter} second${retryAfter === 1 ? '' : 's'}.`
}
