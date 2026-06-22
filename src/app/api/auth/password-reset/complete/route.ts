import { NextRequest, NextResponse } from 'next/server'
import { completePasswordReset } from '@/lib/services/password-reset'
import { checkRateLimit } from '@/lib/services/rate-limit'
import { z } from 'zod'
import { createHash } from 'crypto'

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be no more than 128 characters')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

const completeResetSchema = z.object({
  token: z.string().min(16, 'Reset token is invalid').max(512),
  newPassword: passwordSchema,
})

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  return forwarded ? forwarded.split(',')[0]?.trim() || 'unknown' : realIp || 'unknown'
}

function hashRateLimitValue(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validation = completeResetSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid input',
          errors: validation.error.issues.map(err => ({
            field: err.path[0],
            message: err.message,
          })),
        },
        { status: 400 }
      )
    }

    const { token, newPassword } = validation.data

    const ipAddress = getClientIp(request)
    const userAgent = request.headers.get('user-agent') || undefined

    const rateLimitKey = `password-reset-complete:${ipAddress}:${hashRateLimitValue(token)}`
    const rateLimit = await checkRateLimit(rateLimitKey, 'auth:password-reset-complete')

    if (!rateLimit.allowed) {
      const resetInSeconds = Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)

      return NextResponse.json(
        {
          success: false,
          message: 'Too many password reset attempts. Please try again later.',
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

    const result = await completePasswordReset({ token, newPassword }, ipAddress, userAgent)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Password reset failed or the reset link has expired.',
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    })
  } catch (error) {
    console.error('Password reset completion API error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred. Please try again.',
      },
      { status: 500 }
    )
  }
}
