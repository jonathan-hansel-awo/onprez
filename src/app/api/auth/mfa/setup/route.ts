import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { checkRateLimit } from '@/lib/services/rate-limit'
import { setupMfa } from '@/lib/services/mfa'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const rateLimitKey = `mfa-setup:${user.id}:${ipAddress}`
    const rateLimit = await checkRateLimit(rateLimitKey, 'auth:mfa-setup')

    if (!rateLimit.allowed) {
      const resetInSeconds = Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)

      return NextResponse.json(
        { success: false, message: 'Rate limit exceeded' },
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

    if (user.mfaEnabled) {
      return NextResponse.json(
        { success: false, message: 'MFA is already enabled' },
        { status: 400 }
      )
    }

    const result = await setupMfa(user.id, user.email, ipAddress, userAgent)

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data,
    })
  } catch (error) {
    console.error('MFA setup API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
