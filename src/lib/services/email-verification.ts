import { createHmac } from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/services/email'
import { logSecurityEvent } from '@/lib/services/security-logging'
import { generateVerificationToken } from '@/lib/utils/token'
import { env } from '@/lib/config/env'

export interface VerifyEmailResult {
  success: boolean
  message: string
  email?: string
}

export interface ResendVerificationResult {
  success: boolean
  message: string
}

function getEmailVerificationPepper(): string {
  const pepper = process.env.EMAIL_VERIFICATION_TOKEN_PEPPER

  if (process.env.NODE_ENV === 'production' && !pepper) {
    throw new Error('EMAIL_VERIFICATION_TOKEN_PEPPER is required in production')
  }

  return pepper || process.env.JWT_SECRET || 'development-only-email-verification-pepper'
}

export function hashEmailVerificationToken(token: string): string {
  return createHmac('sha256', getEmailVerificationPepper()).update(token).digest('hex')
}

async function logSecurityEventSafely(event: Parameters<typeof logSecurityEvent>[0]) {
  try {
    await logSecurityEvent(event)
  } catch (error) {
    console.error('Security logging failed:', error)
  }
}

function getAppBaseUrl() {
  return env.APP_URL || env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

/**
 * Verify email with token.
 */
export async function verifyEmail(
  token: string,
  ipAddress: string,
  userAgent?: string
): Promise<VerifyEmailResult> {
  try {
    const hashedToken = hashEmailVerificationToken(token)

    const verificationToken = await prisma.emailVerificationToken.findFirst({
      where: {
        OR: [
          { token: hashedToken },
          // Temporary legacy fallback for tokens created before hashing.
          { token },
        ],
      },
      include: { user: true },
    })

    if (!verificationToken) {
      return {
        success: false,
        message: 'Invalid or expired verification token',
      }
    }

    if (verificationToken.verifiedAt) {
      return {
        success: false,
        message: 'Email has already been verified',
      }
    }

    const now = new Date()

    if (now > verificationToken.expiresAt) {
      return {
        success: false,
        message: 'Verification token has expired. Please request a new one.',
      }
    }

    const verified = await prisma.$transaction(async tx => {
      const updateResult = await tx.emailVerificationToken.updateMany({
        where: {
          id: verificationToken.id,
          verifiedAt: null,
          expiresAt: { gt: now },
        },
        data: {
          verifiedAt: now,
          token: hashedToken,
        },
      })

      if (updateResult.count !== 1) {
        return false
      }

      await tx.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerified: true },
      })

      return true
    })

    if (!verified) {
      return {
        success: false,
        message: 'Invalid or expired verification token',
      }
    }

    await logSecurityEventSafely({
      userId: verificationToken.userId,
      action: 'email_verified',
      details: {},
      ipAddress,
      userAgent,
      severity: 'info',
    })

    return {
      success: true,
      message: 'Email verified successfully!',
      email: verificationToken.email,
    }
  } catch (error) {
    console.error('Email verification error:', error)

    await logSecurityEventSafely({
      action: 'email_verification_failed',
      details: {
        reason: 'verification_error',
      },
      ipAddress,
      userAgent,
      severity: 'warning',
    })

    return {
      success: false,
      message: 'Failed to verify email. Please try again.',
    }
  }
}

/**
 * Resend verification email.
 */
export async function resendVerificationEmail(
  email: string,
  ipAddress: string,
  userAgent?: string
): Promise<ResendVerificationResult> {
  const normalizedEmail = email.toLowerCase().trim()

  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { businesses: true },
    })

    // Generic response to avoid revealing account existence.
    if (!user || user.emailVerified) {
      return {
        success: true,
        message:
          'If an account with this email exists and needs verification, a verification email has been sent.',
      }
    }

    await prisma.emailVerificationToken.deleteMany({
      where: {
        userId: user.id,
        verifiedAt: null,
      },
    })

    const { token: verificationToken, expiresAt: verificationExpiresAt } =
      generateVerificationToken()

    const hashedVerificationToken = hashEmailVerificationToken(verificationToken)

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: hashedVerificationToken,
        email: user.email,
        expiresAt: verificationExpiresAt,
      },
    })

    const verificationUrl = `${getAppBaseUrl()}/verify-email?token=${verificationToken}`
    const businessName = user.businesses[0]?.name || 'Your Business'

    await sendVerificationEmail(user.email, verificationUrl, businessName)

    await logSecurityEventSafely({
      userId: user.id,
      action: 'verification_email_resent',
      details: {},
      ipAddress,
      userAgent,
      severity: 'info',
    })

    return {
      success: true,
      message:
        'If an account with this email exists and needs verification, a verification email has been sent.',
    }
  } catch (error) {
    console.error('Resend verification error:', error)

    await logSecurityEventSafely({
      action: 'verification_email_resend_failed',
      details: {
        reason: 'resend_error',
      },
      ipAddress,
      userAgent,
      severity: 'warning',
    })

    return {
      success: false,
      message: 'Failed to send verification email. Please try again later.',
    }
  }
}
