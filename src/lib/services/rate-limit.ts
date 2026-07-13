import { getRateLimitRule } from '@/lib/constants/rate-limit'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'
import { RateLimitCheckResult, calculateResetTime, calculateRetryAfter } from '@/types/rate-limit'

/**
 * Check rate limit for a key and endpoint
 */
export async function checkRateLimit(key: string, endpoint: string): Promise<RateLimitCheckResult> {
  const rule = getRateLimitRule(endpoint)
  const now = new Date()
  const nextResetAt = calculateResetTime(now, rule.windowMs)

  // One database statement both creates/resets and increments the counter.
  // This prevents concurrent requests from all observing the same old count
  // and slipping through before separate update calls complete.
  const [rateLimit] = await prisma.$queryRaw<Array<{ count: number; expiresAt: Date }>>(
    Prisma.sql`
      INSERT INTO "rate_limits" (
        "id", "key", "endpoint", "count", "windowStart", "expiresAt", "createdAt", "updatedAt"
      )
      VALUES (
        ${randomUUID()}, ${key}, ${endpoint}, 1, ${now}, ${nextResetAt}, ${now}, ${now}
      )
      ON CONFLICT ("key", "endpoint") DO UPDATE
      SET
        "count" = CASE
          WHEN "rate_limits"."expiresAt" <= ${now} THEN 1
          ELSE "rate_limits"."count" + 1
        END,
        "windowStart" = CASE
          WHEN "rate_limits"."expiresAt" <= ${now} THEN ${now}
          ELSE "rate_limits"."windowStart"
        END,
        "expiresAt" = CASE
          WHEN "rate_limits"."expiresAt" <= ${now} THEN ${nextResetAt}
          ELSE "rate_limits"."expiresAt"
        END,
        "updatedAt" = ${now}
      RETURNING "count", "expiresAt"
    `
  )

  if (!rateLimit) {
    throw new Error('Rate limit counter update returned no record')
  }

  const allowed = rateLimit.count <= rule.maxAttempts

  return {
    allowed,
    limit: rule.maxAttempts,
    remaining: Math.max(0, rule.maxAttempts - rateLimit.count),
    resetAt: rateLimit.expiresAt,
    ...(!allowed && { retryAfter: calculateRetryAfter(rateLimit.expiresAt) }),
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
