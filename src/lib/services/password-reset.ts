import { createHmac } from 'crypto'
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

function getPasswordResetPepper(): string {
  const pepper = process.env.PASSWORD_RESET_TOKEN_PEPPER

  if (process.env.NODE_ENV === 'production' && !pepper) {
    throw new Error('PASSWORD_RESET_TOKEN_PEPPER is required in production')
  }

  return pepper || process.env.JWT_SECRET || 'development-only-password-reset-pepper'
}

export function hashPasswordResetToken(token: string): string {
  return createHmac('sha256', getPasswordResetPepper()).update(token).digest('hex')
}

async function logSecurityEventSafely(event: Parameters<typeof logSecurityEvent>[0]) {
  try {
    await logSecurityEvent(event)
  } catch (error) {
    console.error('Security logging failed:', error)
  }
}

/**
 * Complete password reset with new password.
 */
export async function completePasswordReset(
  input: CompletePasswordResetInput,
  ipAddress: string,
  userAgent?: string
): Promise<CompletePasswordResetResult> {
  const { token, newPassword } = input

  try {
    const hashedToken = hashPasswordResetToken(token)

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        OR: [
          { token: hashedToken },
          // Temporary legacy fallback for tokens created before hashing.
          { token },
        ],
      },
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

    if (resetToken.usedAt) {
      return {
        success: false,
        message: 'This reset link has already been used',
      }
    }

    const now = new Date()

    if (now > resetToken.expiresAt) {
      return {
        success: false,
        message: 'Reset link has expired. Please request a new one.',
      }
    }

    const passwordValidation = validatePasswordStrength(newPassword)

    if (!passwordValidation.isValid) {
      return {
        success: false,
        message: passwordValidation.message,
      }
    }

    const passwordHash = await hashPassword(newPassword)

    const completed = await prisma.$transaction(async tx => {
      const tokenUpdate = await tx.passwordResetToken.updateMany({
        where: {
          id: resetToken.id,
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: {
          usedAt: now,
          token: hashedToken,
        },
      })

      if (tokenUpdate.count !== 1) {
        return false
      }

      await tx.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash,
          failedLoginAttempts: 0,
          accountLocked: false,
          lastFailedLogin: null,
        },
      })

      // Invalidate any other outstanding reset tokens for this user.
      await tx.passwordResetToken.updateMany({
        where: {
          userId: resetToken.userId,
          usedAt: null,
        },
        data: {
          usedAt: now,
        },
      })

      await tx.session.deleteMany({
        where: { userId: resetToken.userId },
      })

      return true
    })

    if (!completed) {
      return {
        success: false,
        message: 'Invalid or expired reset token',
      }
    }

    const businessName = resetToken.user.businesses[0]?.name || 'Your Business'

    try {
      await sendPasswordChangedEmail(resetToken.user.email, businessName)
    } catch (error) {
      console.error('Password changed email failed:', error)
    }

    await logSecurityEventSafely({
      userId: resetToken.userId,
      action: 'password_reset_completed',
      details: {
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

    await logSecurityEventSafely({
      action: 'password_reset_completion_error',
      details: {
        reason: 'completion_error',
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
 * Validate password strength.
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

  if (password.length > 128) {
    return {
      isValid: false,
      message: 'Password must be no more than 128 characters long',
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
 * Request password reset.
 */
export async function requestPasswordReset(
  email: string,
  ipAddress: string,
  userAgent?: string
): Promise<RequestPasswordResetResult> {
  const normalizedEmail = email.toLowerCase().trim()

  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { businesses: true },
    })

    if (!user) {
      await logSecurityEventSafely({
        action: 'password_reset_requested_nonexistent',
        details: {},
        ipAddress,
        userAgent,
        severity: 'warning',
      })

      return {
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.',
      }
    }

    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
    })

    const { token: resetToken, expiresAt: resetExpiresAt } = generatePasswordResetToken()
    const hashedResetToken = hashPasswordResetToken(resetToken)

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: hashedResetToken,
        expiresAt: resetExpiresAt,
      },
    })

    const resetUrl = `${getAppUrl()}/reset-password?token=${resetToken}`
    const businessName = user.businesses[0]?.name || 'Your Business'

    await sendPasswordResetEmail(user.email, resetUrl, businessName)

    await logSecurityEventSafely({
      userId: user.id,
      action: 'password_reset_requested',
      details: {},
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

    await logSecurityEventSafely({
      action: 'password_reset_request_error',
      details: {
        reason: 'request_error',
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
