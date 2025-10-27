import { checkRateLimit } from '@/lib/services/rate-limit'
import { signupUser } from '@/lib/services/signup'
import { signupSchema } from '@/lib/validation/auth'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

export async function POST(request: NextRequest) {
  try {
    // Get IP address for rate limiting
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ipAddress = forwarded ? forwarded.split(',')[0] : realIp || 'unknown'

    // Check rate limit
    const rateLimitKey = `ip:${ipAddress}`
    const rateLimitResult = await checkRateLimit(rateLimitKey, 'auth:signup')

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many signup attempts. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': Math.floor(rateLimitResult.resetAt.getTime() / 1000).toString(),
            'Retry-After': rateLimitResult.retryAfter?.toString() || '0',
          },
        }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = signupSchema.parse(body)

    // Get user agent
    const userAgent = request.headers.get('user-agent') || undefined

    // Create user account
    const result = await signupUser(validatedData, ipAddress, userAgent)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.error || 'Signup failed',
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully. Please check your email to verify your account.',
        data: {
          userId: result.userId,
          email: result.email,
          businessId: result.businessId,
          handle: result.handle,
          requiresVerification: result.requiresVerification,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      )
    }

    console.error('Signup API error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred during signup. Please try again.',
      },
      { status: 500 }
    )
  }
}
