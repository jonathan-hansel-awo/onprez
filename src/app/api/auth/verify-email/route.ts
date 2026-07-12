import { NextRequest, NextResponse } from 'next/server'
import { verifyEmail } from '@/lib/services/email-verification'
import { checkRateLimit } from '@/lib/services/rate-limit'
import { z } from 'zod'
import { apiError, logApiError } from '@/lib/api/error-response'

const verifyEmailSchema = z.object({
  token: z.string().min(16, 'Verification token is invalid').max(512),
})

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  return forwarded ? forwarded.split(',')[0]?.trim() || 'unknown' : realIp || 'unknown'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = verifyEmailSchema.safeParse(body)

    if (!validation.success) {
      return apiError('VALIDATION_ERROR', 'Invalid verification token', 400)
    }

    const ipAddress = getClientIp(request)
    const userAgent = request.headers.get('user-agent') || undefined

    const rateLimitKey = `verify-email:${ipAddress}`
    const rateLimit = await checkRateLimit(rateLimitKey, 'auth:verify-email')

    if (!rateLimit.allowed) {
      const resetInSeconds = Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)

      return apiError(
        'RATE_LIMITED',
        'Too many verification attempts. Please try again later.',
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

    const result = await verifyEmail(validation.data.token, ipAddress, userAgent)

    if (!result.success) {
      return apiError('BAD_REQUEST', 'Verification failed or the token has expired.', 400)
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully.',
    })
  } catch (error) {
    logApiError('verify-email-api', error)
    return apiError('INTERNAL_ERROR', 'An error occurred during verification', 500)
  }
}
