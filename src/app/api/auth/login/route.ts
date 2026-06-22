import { NextRequest, NextResponse } from 'next/server'
import { loginUser, parseUserAgent } from '@/lib/services/login'
import { checkRateLimit } from '@/lib/services/rate-limit'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
})

type SafeLoginUser = {
  id?: string
  email?: string
  emailVerified?: boolean
  name?: string | null
  businessId?: string | null
  handle?: string | null
}

function toSafeUser(user: unknown): SafeLoginUser | undefined {
  if (!user || typeof user !== 'object') {
    return undefined
  }

  const value = user as Record<string, unknown>

  return {
    id: typeof value.id === 'string' ? value.id : undefined,
    email: typeof value.email === 'string' ? value.email : undefined,
    emailVerified: typeof value.emailVerified === 'boolean' ? value.emailVerified : undefined,
    name: typeof value.name === 'string' || value.name === null ? value.name : undefined,
    businessId:
      typeof value.businessId === 'string' || value.businessId === null
        ? value.businessId
        : undefined,
    handle: typeof value.handle === 'string' || value.handle === null ? value.handle : undefined,
  }
}

function getSafeLoginFailureMessage(error?: string) {
  // Allow only intentionally user-safe messages.
  if (error === 'EMAIL_NOT_VERIFIED') {
    return 'Please verify your email before logging in.'
  }

  if (error === 'ACCOUNT_LOCKED') {
    return 'This account is temporarily locked. Please try again later.'
  }

  if (error === 'MFA_REQUIRED') {
    return 'MFA verification is required.'
  }

  return 'Invalid email or password'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validation = loginSchema.safeParse(body)

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

    const { email, password, rememberMe } = validation.data

    const ipAddress =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const rateLimitKey = `login:${ipAddress}`
    const rateLimit = await checkRateLimit(rateLimitKey, 'auth:login')

    if (!rateLimit.allowed) {
      const resetInSeconds = Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)
      const resetInMinutes = Math.ceil(resetInSeconds / 60)

      return NextResponse.json(
        {
          success: false,
          message: `Too many login attempts. Please try again in ${resetInMinutes} minute${resetInMinutes > 1 ? 's' : ''}.`,
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

    const deviceParsed = parseUserAgent(userAgent)

    const result = await loginUser(
      {
        email,
        password,
        rememberMe,
      },
      {
        userAgent,
        ipAddress,
        platform: deviceParsed.platform,
        browser: deviceParsed.browser,
      }
    )

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: getSafeLoginFailureMessage(result.error),
        },
        { status: 401 }
      )
    }

    if (result.requiresMfa && result.mfaToken) {
      return NextResponse.json({
        success: true,
        requiresMfa: true,
        mfaToken: result.mfaToken,
      })
    }

    if (!result.accessToken || !result.refreshToken) {
      console.error('Login succeeded without tokens')

      return NextResponse.json(
        {
          success: false,
          message: 'Login failed',
        },
        { status: 500 }
      )
    }

    const response = NextResponse.json({
      success: true,
      user: toSafeUser(result.user),
    })

    response.cookies.set('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
      path: '/',
    })

    response.cookies.set('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login API error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred during login',
      },
      { status: 500 }
    )
  }
}
