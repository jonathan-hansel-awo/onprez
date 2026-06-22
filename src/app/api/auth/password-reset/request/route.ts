import { NextRequest, NextResponse } from 'next/server'
import { requestPasswordReset } from '@/lib/services/password-reset'
import { checkRateLimit } from '@/lib/services/rate-limit'
import { z } from 'zod'
import { createHash } from 'crypto'

const requestResetSchema = z.object({
  email: z.string().email('Invalid email address'),
})

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  return forwarded ? forwarded.split(',')[0]?.trim() || 'unknown' : realIp || 'unknown'
}

function hashRateLimitValue(value: string) {
  return createHash('sha256').update(value.toLowerCase().trim()).digest('hex')
}

function genericResponse() {
  return NextResponse.json({
    success: true,
    message: 'If an account exists for that email, we will send password reset instructions.',
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validation = requestResetSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email address',
          errors: validation.error.issues.map(err => ({
            field: err.path[0],
            message: err.message,
          })),
        },
        { status: 400 }
      )
    }

    const email = validation.data.email.toLowerCase().trim()
    const ipAddress = getClientIp(request)
    const userAgent = request.headers.get('user-agent') || undefined

    const rateLimitKey = `password-reset:${ipAddress}:${hashRateLimitValue(email)}`
    const rateLimit = await checkRateLimit(rateLimitKey, 'auth:password-reset-request')

    if (!rateLimit.allowed) {
      const resetInSeconds = Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)

      return NextResponse.json(
        {
          success: false,
          message: 'Too many password reset requests. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': Math.floor(rateLimit.resetAt.getTime() / 1000).toString(),
            'Retry-After': (rateLimit.retryAfter || resetInSeconds).toString(),
          },
        }
      )
    }

    await requestPasswordReset(email, ipAddress, userAgent)

    return genericResponse()
  } catch (error) {
    console.error('Password reset request API error:', error)

    // Generic even on service failure, so callers cannot distinguish account state.
    return genericResponse()
  }
}
