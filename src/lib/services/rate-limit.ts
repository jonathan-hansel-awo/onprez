import { getRateLimitRule } from '@/lib/constants/rate-limit'
import { prisma } from '@/lib/prisma'
import {
  RateLimitCheckResult,
  isRateLimitExpired,
  calculateResetTime,
  calculateRetryAfter,
} from '@/types/rate-limit'

/**
 * Check rate limit for a key and endpoint
 */
export async function checkRateLimit(key: string, endpoint: string): Promise<RateLimitCheckResult> {
  const rule = getRateLimitRule(endpoint)
  const now = new Date()

  // Find or create rate limit record
  let rateLimit = await prisma.rateLimit.findUnique({
    where: {
      key_endpoint: {
        key,
        endpoint,
      },
    },
  })

  // If no record or expired, create/reset
  if (!rateLimit || isRateLimitExpired(rateLimit.expiresAt)) {
    const windowStart = now
    const expiresAt = calculateResetTime(windowStart, rule.windowMs)

    rateLimit = await prisma.rateLimit.upsert({
      where: {
        key_endpoint: {
          key,
          endpoint,
        },
      },
      create: {
        key,
        endpoint,
        count: 1,
        windowStart,
        expiresAt,
      },
      update: {
        count: 1,
        windowStart,
        expiresAt,
      },
    })

    return {
      allowed: true,
      limit: rule.maxAttempts,
      remaining: rule.maxAttempts - 1,
      resetAt: expiresAt,
    }
  }

  // Check if limit exceeded
  if (rateLimit.count >= rule.maxAttempts) {
    return {
      allowed: false,
      limit: rule.maxAttempts,
      remaining: 0,
      resetAt: rateLimit.expiresAt,
      retryAfter: calculateRetryAfter(rateLimit.expiresAt),
    }
  }

  // Increment counter
  rateLimit = await prisma.rateLimit.update({
    where: {
      key_endpoint: {
        key,
        endpoint,
      },
    },
    data: {
      count: {
        increment: 1,
      },
    },
  })

  return {
    allowed: true,
    limit: rule.maxAttempts,
    remaining: rule.maxAttempts - rateLimit.count,
    resetAt: rateLimit.expiresAt,
  }
}

/**
 * Reset rate limit for a key and endpoint
 */
export async function resetRateLimit(key: string, endpoint: string): Promise<void> {
  await prisma.rateLimit.deleteMany({
    where: {
      key,
      endpoint,
    },
  })
}

/**
 * Clean up expired rate limits
 */
export async function cleanupExpiredRateLimits(): Promise<number> {
  const result = await prisma.rateLimit.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  })

  return result.count
}

/**
 * Get rate limit statistics
 */
export async function getRateLimitStats(
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalRecords: number
  activeRecords: number
  expiredRecords: number
}> {
  const now = new Date()

  const where = {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  }

  const [total, active, expired] = await Promise.all([
    prisma.rateLimit.count({ where }),
    prisma.rateLimit.count({
      where: {
        ...where,
        expiresAt: { gt: now },
      },
    }),
    prisma.rateLimit.count({
      where: {
        ...where,
        expiresAt: { lte: now },
      },
    }),
  ])

  return {
    totalRecords: total,
    activeRecords: active,
    expiredRecords: expired,
  }
}

/**
 * Block a key for a specific duration
 */
export async function blockKey(key: string, endpoint: string, durationMs: number): Promise<void> {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + durationMs)
  const rule = getRateLimitRule(endpoint)

  await prisma.rateLimit.upsert({
    where: {
      key_endpoint: {
        key,
        endpoint,
      },
    },
    create: {
      key,
      endpoint,
      count: rule.maxAttempts, // Set to max to block
      windowStart: now,
      expiresAt,
    },
    update: {
      count: rule.maxAttempts, // Set to max to block
      windowStart: now,
      expiresAt,
    },
  })
}

/**
 * Calculate progressive delay based on violation count
 * Progressive backoff: 1s, 2s, 5s, 10s, 30s, 60s, etc.
 */
export function calculateProgressiveDelay(violationCount: number): number {
  const delays = [1000, 2000, 5000, 10000, 30000, 60000, 120000, 300000]
  const index = Math.min(violationCount - 1, delays.length - 1)
  return delays[Math.max(0, index)]
}

/**
 * Get recommended delay before retry based on attempts
 */
export async function getProgressiveDelayForKey(key: string, endpoint: string): Promise<number> {
  const rateLimit = await prisma.rateLimit.findUnique({
    where: {
      key_endpoint: {
        key,
        endpoint,
      },
    },
  })

  if (!rateLimit) {
    return 0
  }

  const rule = getRateLimitRule(endpoint)
  const violationCount = Math.max(0, rateLimit.count - rule.maxAttempts)

  return calculateProgressiveDelay(violationCount + 1)
}
