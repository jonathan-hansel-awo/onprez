import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/get-user'
import { verifyPassword } from '@/lib/auth/password'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/services/rate-limit'
import { logSecurityEvent } from '@/lib/services/security-logging'

const viewCodesSchema = z.object({
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    if (!user.mfaEnabled) {
      return NextResponse.json({ success: false, message: 'MFA is not enabled' }, { status: 400 })
    }

    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const rateLimitKey = `mfa-backup-codes:${user.id}:${ipAddress}`
    const rateLimit = await checkRateLimit(rateLimitKey, 'auth:mfa-sensitive')

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

    const body = await request.json()
    const validation = viewCodesSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid input', errors: validation.error.issues },
        { status: 400 }
      )
    }

    const userWithPassword = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    })

    if (!userWithPassword) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    const isPasswordValid = await verifyPassword(
      validation.data.password,
      userWithPassword.passwordHash
    )

    if (!isPasswordValid) {
      return NextResponse.json({ success: false, message: 'Invalid password' }, { status: 401 })
    }

    const backupCodes = await prisma.mfaBackupCode.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        usedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    await logSecurityEvent({
      userId: user.id,
      action: 'backup_codes_viewed',
      details: {},
      ipAddress,
      userAgent,
      severity: 'info',
    })

    return NextResponse.json({
      success: true,
      data: {
        total: backupCodes.length,
        used: backupCodes.filter(c => c.usedAt).length,
        unused: backupCodes.filter(c => !c.usedAt).length,
        codes: backupCodes.map(code => ({
          id: code.id,
          used: !!code.usedAt,
          usedAt: code.usedAt,
          createdAt: code.createdAt,
        })),
      },
    })
  } catch (error) {
    console.error('View backup codes API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
