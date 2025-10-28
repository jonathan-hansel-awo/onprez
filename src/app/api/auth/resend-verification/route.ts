import { NextRequest, NextResponse } from 'next/server'
import { resendVerificationEmail } from '@/lib/services/email-verification'
import { checkRateLimit } from '@/lib/services/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email is required',
        },
        { status: 400 }
      )
    }

    // Get client info
    const ipAddress =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || undefined

    // Check rate limit (max 3 attempts per hour per IP)
    const rateLimitKey = `resend-verification:${ipAddress}`
    const rateLimit = await checkRateLimit(rateLimitKey, 'auth:resend-verification') // 3 per hour

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many verification requests. Please try again later.',
        },
        { status: 429 }
      )
    }

    // Resend verification email
    const result = await resendVerificationEmail(email, ipAddress, userAgent)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Resend verification API error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred. Please try again.',
      },
      { status: 500 }
    )
  }
}
