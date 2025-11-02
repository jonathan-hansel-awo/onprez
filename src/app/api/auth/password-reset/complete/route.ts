import { NextRequest, NextResponse } from 'next/server'
import { completePasswordReset } from '@/lib/services/password-reset'
import { checkRateLimit } from '@/lib/services/rate-limit'
import { z } from 'zod'

const completeResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
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

    // Get client info
    const ipAddress =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || undefined

    // Check rate limit (5 attempts per 10 minutes per IP)
    const rateLimitKey = `password-reset-complete:${ipAddress}`
    const rateLimit = await checkRateLimit(rateLimitKey, 'auth:password-reset-complete')

    if (!rateLimit.allowed) {
      const resetInSeconds = Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)
      const resetInMinutes = Math.ceil(resetInSeconds / 60)

      return NextResponse.json(
        {
          success: false,
          message: `Too many password reset attempts. Please try again in ${resetInMinutes} minute${resetInMinutes > 1 ? 's' : ''}.`,
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

    // Complete password reset
    const result = await completePasswordReset({ token, newPassword }, ipAddress, userAgent)

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
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
