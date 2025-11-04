import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/get-user'
import { verifyPassword } from '@/lib/auth/password'
import { prisma } from '@/lib/prisma'
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

    const body = await request.json()
    const validation = viewCodesSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid input', errors: validation.error.issues },
        { status: 400 }
      )
    }

    const { password } = validation.data

    // Verify password
    const userWithPassword = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    })

    if (!userWithPassword) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    const isPasswordValid = await verifyPassword(password, userWithPassword.passwordHash)

    if (!isPasswordValid) {
      return NextResponse.json({ success: false, message: 'Invalid password' }, { status: 401 })
    }

    // Get backup codes
    const backupCodes = await prisma.mfaBackupCode.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        hashedCode: true,
        usedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await logSecurityEvent({
      userId: user.id,
      action: 'backup_codes_viewed',
      details: { email: user.email },
      ipAddress,
      userAgent,
      severity: 'info',
    })

    // Note: We return metadata about codes, not the actual codes
    // Actual codes were only shown once during setup
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
