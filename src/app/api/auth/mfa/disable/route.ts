import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/get-user'
import { verifyPassword } from '@/lib/auth/password'
import { prisma } from '@/lib/prisma'
import { logSecurityEvent } from '@/lib/services/security-logging'

const disableSchema = z.object({
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = disableSchema.safeParse(body)

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

    // Disable MFA
    await prisma.$transaction([
      // Delete MFA secret
      prisma.mfaSecret.deleteMany({
        where: { userId: user.id },
      }),
      // Delete backup codes
      prisma.mfaBackupCode.deleteMany({
        where: { userId: user.id },
      }),
      // Delete trusted devices
      prisma.trustedDevice.deleteMany({
        where: { userId: user.id },
      }),
      // Update user
      prisma.user.update({
        where: { id: user.id },
        data: { mfaEnabled: false },
      }),
    ])

    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await logSecurityEvent({
      userId: user.id,
      action: 'mfa_disabled',
      details: { email: user.email },
      ipAddress,
      userAgent,
      severity: 'warning',
    })

    return NextResponse.json({
      success: true,
      message: 'MFA disabled successfully',
    })
  } catch (error) {
    console.error('Disable MFA API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
