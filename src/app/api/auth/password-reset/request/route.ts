import { NextRequest, NextResponse } from 'next/server'
import { requestPasswordReset } from '@/lib/services/password-reset'
import { checkRateLimit } from '@/lib/services/rate-limit'
import { z } from 'zod'

const requestResetSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
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

    const { email } = validation.data

    // Get client info
    const ipAddress =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || undefined

    // Check rate limit (3 attempts per hour per IP)
    const rateLimitKey = `password-reset:${ipAddress}`
    const rateLimit = await checkRateLimit(rateLimitKey, 'auth:password-reset-request')

    if (!rateLimit.allowed) {
      const resetInSeconds = Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)
      const resetInMinutes = Math.ceil(resetInSeconds / 60)

      return NextResponse.json(
        {
          success: false,
          message: `Too many password reset requests. Please try again in ${resetInMinutes} minute${resetInMinutes > 1 ? 's' : ''}.`,
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

    // Request password reset
    const result = await requestPasswordReset(email, ipAddress, userAgent)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Password reset request API error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred. Please try again.',
      },
      { status: 500 }
    )
  }
}
