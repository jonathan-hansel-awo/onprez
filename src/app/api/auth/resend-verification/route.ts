import { NextRequest, NextResponse } from 'next/server'
import { resendVerificationEmail } from '@/lib/services/email-verification'
import { checkRateLimit } from '@/lib/services/rate-limit'
import { z } from 'zod'
import { createHash } from 'crypto'

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

    const email = validation.data.email.toLowerCase().trim()
    const ipAddress = getClientIp(request)
    const userAgent = request.headers.get('user-agent') || undefined

    const rateLimitKey = `resend-verification:${ipAddress}:${hashRateLimitValue(email)}`
    const rateLimit = await checkRateLimit(rateLimitKey, 'auth:resend-verification')

    if (!rateLimit.allowed) {
      const resetInSeconds = Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)

      return NextResponse.json(
        {
          success: false,
          message: 'Too many verification requests. Please try again later.',
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

    await resendVerificationEmail(email, ipAddress, userAgent)

    return genericResponse()
  } catch (error) {
    console.error('Resend verification API error:', error)

    // Still generic to avoid making email-delivery/account-state probing easy.
    return genericResponse()
  }
}
