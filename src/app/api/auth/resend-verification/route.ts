import { NextRequest, NextResponse } from 'next/server'
import { resendVerificationEmail } from '@/lib/services/email-verification'
import { checkRateLimit } from '@/lib/services/rate-limit'
import { z } from 'zod'
import { createHash } from 'crypto'
import { apiError, logApiError } from '@/lib/api/error-response'

const resendVerificationSchema = z.object({
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
    message: 'If the account exists and needs verification, we will send a new verification email.',
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = resendVerificationSchema.safeParse(body)

    if (!validation.success) {
      return apiError('VALIDATION_ERROR', 'Invalid input', 400, {
        details: validation.error.issues.map(err => ({
          field: err.path[0],
          message: err.message,
        })),
      })
    }

    const email = validation.data.email.toLowerCase().trim()
    const ipAddress = getClientIp(request)
    const userAgent = request.headers.get('user-agent') || undefined

    const rateLimitKey = `resend-verification:${ipAddress}:${hashRateLimitValue(email)}`
    const rateLimit = await checkRateLimit(rateLimitKey, 'auth:resend-verification')

    if (!rateLimit.allowed) {
      const resetInSeconds = Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)

      return apiError(
        'RATE_LIMITED',
        'Too many verification requests. Please try again later.',
        429,
        {
          headers: {
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': Math.floor(rateLimit.resetAt.getTime() / 1000).toString(),
            'Retry-After': (rateLimit.retryAfter || resetInSeconds).toString(),
          },
        }
      )
    }

    await resendVerificationEmail(email, ipAddress, userAgent)

    return genericResponse()
  } catch (error) {
    logApiError('resend-verification-api', error)

    // Still generic to avoid making email-delivery/account-state probing easy.
    return genericResponse()
  }
}
