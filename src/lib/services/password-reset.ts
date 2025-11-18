import { prisma } from '@/lib/prisma'
import { sendPasswordChangedEmail, sendPasswordResetEmail } from '@/lib/services/email'
import { logSecurityEvent } from '@/lib/services/security-logging'
import { generatePasswordResetToken } from '@/lib/utils/token'
import { hashPassword } from '@/lib/auth/password'
import { getAppUrl } from '../utils/get-app-url'

export interface CompletePasswordResetInput {
  token: string
  newPassword: string
}

export interface CompletePasswordResetResult {
  success: boolean
  message: string
}

export interface RequestPasswordResetResult {
  success: boolean
  message: string
}

/**
 * Complete password reset with new password
 */
export async function completePasswordReset(
  input: CompletePasswordResetInput,
  ipAddress: string,
  userAgent?: string
): Promise<CompletePasswordResetResult> {
  const { token, newPassword } = input

  try {
    // Find reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            businesses: true,
          },
        },
      },
    })

    if (!resetToken) {
      return {
        success: false,
        message: 'Invalid or expired reset token',
      }
    }

    // Check if already used
    if (resetToken.usedAt) {
      return {
        success: false,
        message: 'This reset link has already been used',
      }
    }

    // Check if expired
    if (new Date() > resetToken.expiresAt) {
      return {
        success: false,
        message: 'Reset link has expired. Please request a new one.',
      }
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword)
    if (!passwordValidation.isValid) {
      return {
        success: false,
        message: passwordValidation.message,
      }
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword)

    // Update password, mark token as used, reset failed attempts, unlock account, and delete all sessions in a transaction
    await prisma.$transaction(async tx => {
      // Update user password and security fields
      await tx.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash,
          failedLoginAttempts: 0,
          accountLocked: false,
          lastFailedLogin: null,
        },
      })

      // Mark reset token as used
      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      })

      // Invalidate all existing sessions
      await tx.session.deleteMany({
        where: { userId: resetToken.userId },
      })
    })

    // Send password changed confirmation email
    const businessName = resetToken.user.businesses[0]?.name || 'Your Business'
    await sendPasswordChangedEmail(resetToken.user.email, businessName)

    // Log security event
    await logSecurityEvent({
      userId: resetToken.userId,
      action: 'password_reset_completed',
      details: {
        email: resetToken.user.email,
        sessionsInvalidated: true,
      },
      ipAddress,
      userAgent,
      severity: 'info',
    })

    return {
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    }
  } catch (error) {
    console.error('Complete password reset error:', error)

    await logSecurityEvent({
      action: 'password_reset_completion_error',
      details: {
        token: token.substring(0, 10) + '...',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      ipAddress,
      userAgent,
      severity: 'error',
    })

    return {
      success: false,
      message: 'Failed to reset password. Please try again.',
    }
  }
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  message: string
} {
  if (password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long',
    }
  }

  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter',
    }
  }

  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one lowercase letter',
    }
  }

  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one number',
    }
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one special character',
    }
  }

  return {
    isValid: true,
    message: 'Password is strong',
  }
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
    const resetUrl = `${getAppUrl()}/reset-password?token=${resetToken}`
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
