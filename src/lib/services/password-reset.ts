import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/services/email'
import { logSecurityEvent } from '@/lib/services/security-logging'
import { generatePasswordResetToken } from '@/lib/utils/token'

export interface RequestPasswordResetResult {
  success: boolean
  message: string
}

/**
 * Request password reset
 */
export async function requestPasswordReset(
  email: string,
  ipAddress: string,
  userAgent?: string
): Promise<RequestPasswordResetResult> {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { businesses: true },
    })

    // Don't reveal if user exists or not for security
    if (!user) {
      // Still log this for security monitoring
      await logSecurityEvent({
        action: 'password_reset_requested_nonexistent',
        details: { email },
        ipAddress,
        userAgent,
        severity: 'warning',
      })

      return {
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.',
      }
    }

    // Delete any existing unused reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
    })

    // Generate new reset token (valid for 1 hour)
    const { token: resetToken, expiresAt: resetExpiresAt } = generatePasswordResetToken()

    // Create reset token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt: resetExpiresAt,
      },
    })

    // Send password reset email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
    const businessName = user.businesses[0]?.name || 'Your Business'

    await sendPasswordResetEmail(user.email, resetUrl, businessName)

    // Log security event
    await logSecurityEvent({
      userId: user.id,
      action: 'password_reset_requested',
      details: { email },
      ipAddress,
      userAgent,
      severity: 'info',
    })

    return {
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.',
    }
  } catch (error) {
    console.error('Password reset request error:', error)

    await logSecurityEvent({
      action: 'password_reset_request_error',
      details: {
        email,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      ipAddress,
      userAgent,
      severity: 'error',
    })

    return {
      success: false,
      message: 'Failed to process password reset request. Please try again.',
    }
  }
}
