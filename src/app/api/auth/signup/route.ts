import { checkRateLimit } from '@/lib/services/rate-limit'
import { signupUser } from '@/lib/services/signup'
import { signupSchema } from '@/lib/validation/auth'
import { NextRequest, NextResponse } from 'next/server'

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  return forwarded ? forwarded.split(',')[0]?.trim() || 'unknown' : realIp || 'unknown'
}

function safeSignupFailureMessage(error?: string) {
  if (!error) {
    return 'Signup failed. Please check your details and try again.'
  }

  const normalized = error.toLowerCase()

  if (normalized.includes('handle')) {
    return 'That handle is not available. Please choose another.'
  }

  if (normalized.includes('email')) {
    return 'This email cannot be used to create an account.'
  }

  if (normalized.includes('password')) {
    return 'Password does not meet the requirements.'
  }

  return 'Signup failed. Please check your details and try again.'
}

export async function POST(request: NextRequest) {
  try {
    const ipAddress = getClientIp(request)

    const rateLimitKey = `signup:${ipAddress}`
    const rateLimit = await checkRateLimit(rateLimitKey, 'auth:signup')

    if (!rateLimit.allowed) {
      const resetInSeconds = Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)

      return NextResponse.json(
        {
          success: false,
          message: 'Too many signup attempts. Please try again later.',
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

    const body = await request.json()
    const validation = signupSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validation.error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      )
    }

    const userAgent = request.headers.get('user-agent') || undefined

    const result = await signupUser(validation.data, ipAddress, userAgent)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: safeSignupFailureMessage(result.error),
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully. Please check your email to verify your account.',
        data: {
          email: result.email,
          handle: result.handle,
          requiresVerification: result.requiresVerification,
        },
      },
      { status: 201 }
    )
  } catch (error) {
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
