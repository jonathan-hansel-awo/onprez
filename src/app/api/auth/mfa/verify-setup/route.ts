import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/services/rate-limit'
import { verifyMfaSetup } from '@/lib/services/mfa'
import { verifyToken } from '@/lib/auth/jwt'

const verifySchema = z.object({
  userId: z.string().min(1),
  token: z.string().length(6).regex(/^\d+$/),
})

export async function POST(request: NextRequest) {
  try {
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Rate limiting
    const rateLimitKey = `mfa-verify:${ipAddress}`
    const rateLimit = await checkRateLimit(rateLimitKey, 'auth:mfa-verify')

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

    // Get authorization token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const verifiedToken = await verifyToken(token)

    if (!verifiedToken) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const validation = verifySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid input', errors: validation.error.issues },
        { status: 400 }
      )
    }

    const { userId, token: mfaToken } = validation.data

    // Verify user matches token
    if (userId !== verifiedToken.payload.userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 })
    }

    // Verify MFA setup
    const result = await verifyMfaSetup(userId, mfaToken, ipAddress, userAgent)

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    })
  } catch (error) {
    console.error('MFA verify setup API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
