import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from 'lib/services/rate-limit'
import { RATE_LIMIT_HEADERS } from 'lib/constants/rate-limit'

export interface RateLimitOptions {
  endpoint: string
  keyGenerator?: (req: NextRequest) => string
}

/**
 * Rate limit middleware for API routes
 */
export function withRateLimit(options: RateLimitOptions) {
  return async (req: NextRequest, handler: (req: NextRequest) => Promise<NextResponse>) => {
    const key = options.keyGenerator ? options.keyGenerator(req) : getDefaultKey(req)

    const result = await checkRateLimit(key, options.endpoint)

    // Add rate limit headers
    const headers = new Headers()
    headers.set(RATE_LIMIT_HEADERS.LIMIT, result.limit.toString())
    headers.set(RATE_LIMIT_HEADERS.REMAINING, result.remaining.toString())
    headers.set(RATE_LIMIT_HEADERS.RESET, Math.floor(result.resetAt.getTime() / 1000).toString())

    if (!result.allowed) {
      headers.set(RATE_LIMIT_HEADERS.RETRY_AFTER, result.retryAfter!.toString())

      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfter: result.retryAfter,
          resetAt: result.resetAt.toISOString(),
        },
        { status: 429, headers }
      )
    }

    const response = await handler(req)

    // Add headers to successful response
    headers.forEach((value, key) => {
      response.headers.set(key, value)
    })

    return response
  }
}

/**
 * Get default rate limit key from request
 */
function getDefaultKey(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown'
  return `ip:${ip}`
}
