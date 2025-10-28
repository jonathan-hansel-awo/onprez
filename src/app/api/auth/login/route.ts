import { NextRequest, NextResponse } from 'next/server'
import { loginUser, parseUserAgent } from '@/lib/services/login'
import { checkRateLimit } from '@/lib/services/rate-limit'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
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

    // Get client info
    const ipAddress =
      request.headers.get('x-forwarded-for') || request.headers.get('real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Check rate limit (5 attempts per 15 minutes per IP)
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

    // Parse device info
    const deviceInfo = parseUserAgent(userAgent)

    // Attempt login
    const result = await loginUser(
      { email, password, rememberMe },
      {
        userAgent,
        ipAddress,
        ...deviceInfo,
      }
    )

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.error,
        },
        { status: 401 }
      )
    }

    // If MFA is required
    if (result.requiresMfa) {
      return NextResponse.json({
        success: true,
        requiresMfa: true,
        mfaToken: result.mfaToken,
      })
    }

    // Set HTTP-only cookies for tokens
    const response = NextResponse.json({
      success: true,
      user: result.user,
    })

    // Set access token cookie
    response.cookies.set('accessToken', result.accessToken!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // 30 days or 1 day
      path: '/',
    })

    // Set refresh token cookie
    response.cookies.set('refreshToken', result.refreshToken!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60, // 30 days or 7 days
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
