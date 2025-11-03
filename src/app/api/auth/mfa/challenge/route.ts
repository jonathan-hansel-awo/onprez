import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/services/rate-limit'
import { verifyMfaChallenge } from '@/lib/services/mfa-challenge'

const challengeSchema = z.object({
  tempToken: z.string().min(1),
  code: z.string().min(6).max(20),
  isBackupCode: z.boolean().optional().default(false),
  trustDevice: z.boolean().optional().default(false),
  deviceInfo: z
    .object({
      browser: z.string().optional(),
      os: z.string().optional(),
      device: z.string().optional(),
    })
    .optional(),
})

export async function POST(request: NextRequest) {
  try {
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Rate limiting
    const rateLimitKey = `mfa-challenge:${ipAddress}`
    const rateLimit = await checkRateLimit(rateLimitKey, 'auth:mfa-challenge')

    if (!rateLimit.allowed) {
      const resetInSeconds = Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)

      return NextResponse.json(
        { success: false, message: 'Too many attempts. Please try again later.' },
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

    // Parse request body
    const body = await request.json()
    const validation = challengeSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid input', errors: validation.error.issues },
        { status: 400 }
      )
    }

    const { tempToken, code, isBackupCode, trustDevice, deviceInfo } = validation.data

    // Verify MFA challenge
    const result = await verifyMfaChallenge({
      tempToken,
      code,
      isBackupCode,
      trustDevice,
      deviceInfo,
      ipAddress,
      userAgent,
    })

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data,
    })
  } catch (error) {
    console.error('MFA challenge API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
