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

/**
 * Verify email with token
 */
export async function verifyEmail(
  token: string,
  ipAddress: string,
  userAgent?: string
): Promise<VerifyEmailResult> {
  try {
    // Find token
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!verificationToken) {
      return {
        success: false,
        message: 'Invalid or expired verification token',
      }
    }

    // Check if already verified
    if (verificationToken.verifiedAt) {
      return {
        success: false,
        message: 'Email has already been verified',
      }
    }

    // Check if expired
    if (new Date() > verificationToken.expiresAt) {
      return {
        success: false,
        message: 'Verification token has expired. Please request a new one.',
      }
    }

    // Update user and token in transaction
    await prisma.$transaction(async tx => {
      // Mark token as verified
      await tx.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { verifiedAt: new Date() },
      })

      // Update user email verification status
      await tx.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerified: true },
      })
    })

    // Log security event
    await logSecurityEvent({
      userId: verificationToken.userId,
      action: 'email_verified',
      details: {
        email: verificationToken.email,
      },
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

    // Log failed verification
    await logSecurityEvent({
      action: 'email_verification_failed',
      details: {
        token: token.substring(0, 10) + '...',
        error: error instanceof Error ? error.message : 'Unknown error',
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
 * Resend verification email
 */
export async function resendVerificationEmail(
  email: string,
  ipAddress: string,
  userAgent?: string
): Promise<ResendVerificationResult> {
  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { businesses: true },
    })

    if (!user) {
      // Don't reveal if user exists or not for security
      return {
        success: true,
        message: 'If an account with this email exists, a verification email has been sent.',
      }
    }

    // Check if already verified
    if (user.emailVerified) {
      return {
        success: false,
        message: 'Email is already verified',
      }
    }

    // Delete old verification tokens for this user
    await prisma.emailVerificationToken.deleteMany({
      where: {
        userId: user.id,
        verifiedAt: null,
      },
    })

    // Generate new token
    const { token: verificationToken, expiresAt: verificationExpiresAt } =
      generateVerificationToken()

    // Create new verification token
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: verificationToken,
        email: user.email,
        expiresAt: verificationExpiresAt,
      },
    })

    // Send verification email
    const verificationUrl = `${env.APP_URL || env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`
    const businessName = user.businesses[0]?.name || 'Your Business'

    await sendVerificationEmail(user.email, verificationUrl, businessName)

    // Log security event
    await logSecurityEvent({
      userId: user.id,
      action: 'verification_email_resent',
      details: {
        email: user.email,
      },
      ipAddress,
      userAgent,
      severity: 'info',
    })

    return {
      success: true,
      message: 'Verification email sent successfully!',
    }
  } catch (error) {
    console.error('Resend verification error:', error)

    // Log failed resend
    await logSecurityEvent({
      action: 'verification_email_resend_failed',
      details: {
        email,
        error: error instanceof Error ? error.message : 'Unknown error',
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
