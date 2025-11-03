/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '@/lib/prisma'
import { verifyMfaToken, verifyBackupCode } from './mfa'
import { createSession } from './session'
import { logSecurityEvent } from './security-logging'
import { generateToken } from '@/lib/utils/token' // ADD THIS IMPORT
import { createHash } from 'crypto' // ADD THIS IMPORT

interface MfaChallengeResult {
  success: boolean
  message: string
  data?: {
    accessToken: string
    refreshToken: string
    user: {
      id: string
      email: string
      emailVerified: boolean
    }
  }
  error?: string
}

interface VerifyMfaChallengeParams {
  tempToken: string
  code: string
  isBackupCode?: boolean
  trustDevice?: boolean
  deviceInfo?: {
    browser?: string
    os?: string
    device?: string
  }
  ipAddress: string
  userAgent: string
}

/**
 * Generate device fingerprint
 */
function generateDeviceFingerprint(deviceInfo: any, userAgent: string): string {
  const data = JSON.stringify({ deviceInfo, userAgent })
  return createHash('sha256').update(data).digest('hex')
}

/**
 * Verify MFA challenge with TOTP or backup code
 */
export async function verifyMfaChallenge({
  tempToken,
  code,
  isBackupCode = false,
  trustDevice = false,
  deviceInfo,
  ipAddress,
  userAgent,
}: VerifyMfaChallengeParams): Promise<MfaChallengeResult> {
  try {
    // Validate temp token
    const mfaTempToken = await prisma.mfaTempToken.findUnique({
      where: { token: tempToken },
      include: { user: true },
    })

    if (!mfaTempToken) {
      return {
        success: false,
        message: 'Invalid or expired MFA session',
        error: 'INVALID_TEMP_TOKEN',
      }
    }

    if (mfaTempToken.usedAt) {
      return {
        success: false,
        message: 'MFA session already used',
        error: 'TOKEN_ALREADY_USED',
      }
    }

    if (mfaTempToken.expiresAt < new Date()) {
      return {
        success: false,
        message: 'MFA session expired. Please log in again.',
        error: 'TOKEN_EXPIRED',
      }
    }

    const user = mfaTempToken.user

    // Verify MFA code
    let verificationResult
    if (isBackupCode) {
      verificationResult = await verifyBackupCode(user.id, code, ipAddress, userAgent)
    } else {
      verificationResult = await verifyMfaToken(user.id, code, ipAddress, userAgent)
    }

    if (!verificationResult.success) {
      // Track failed MFA attempts
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: { increment: 1 },
          lastFailedLogin: new Date(),
        },
      })

      return {
        success: false,
        message: verificationResult.message,
        error: verificationResult.error,
      }
    }

    // Mark temp token as used
    await prisma.mfaTempToken.update({
      where: { id: mfaTempToken.id },
      data: { usedAt: new Date() },
    })

    // Create session
    const sessionResult = await createSession({
      userId: user.id,
      deviceInfo: deviceInfo || {},
      userAgent,
      ipAddress,
      rememberMe: trustDevice,
    })

    if (!sessionResult.success || !sessionResult.data) {
      return {
        success: false,
        message: 'Failed to create session',
        error: 'SESSION_CREATION_FAILED',
      }
    }

    // Store trusted device if requested
    if (trustDevice) {
      await prisma.trustedDevice.create({
        data: {
          userId: user.id,
          deviceFingerprint: generateDeviceFingerprint(deviceInfo, userAgent),
          deviceName: `${deviceInfo?.browser || 'Unknown'} on ${deviceInfo?.os || 'Unknown'}`,
          ipAddress,
          userAgent,
          lastUsedAt: new Date(),
        },
      })

      await logSecurityEvent({
        userId: user.id,
        action: 'trusted_device_added',
        details: { deviceInfo },
        ipAddress,
        userAgent,
        severity: 'info',
      })
    }

    // Reset failed login attempts
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastFailedLogin: null,
        lastLoginAt: new Date(),
      },
    })

    await logSecurityEvent({
      userId: user.id,
      action: 'mfa_login_success',
      details: {
        method: isBackupCode ? 'backup_code' : 'totp',
        trustedDevice: trustDevice,
      },
      ipAddress,
      userAgent,
      severity: 'info',
    })

    return {
      success: true,
      message: 'Login successful',
      data: {
        accessToken: sessionResult.data.accessToken,
        refreshToken: sessionResult.data.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerified,
        },
      },
    }
  } catch (error) {
    console.error('MFA challenge verification error:', error)
    return {
      success: false,
      message: 'Failed to verify MFA challenge',
      error: 'VERIFICATION_FAILED',
    }
  }
}

/**
 * Check if device is trusted
 */
export async function isDeviceTrusted(
  userId: string,
  deviceInfo: any,
  userAgent: string
): Promise<boolean> {
  try {
    const fingerprint = generateDeviceFingerprint(deviceInfo, userAgent)

    const trustedDevice = await prisma.trustedDevice.findFirst({
      where: {
        userId,
        deviceFingerprint: fingerprint,
        revokedAt: null,
      },
    })

    if (trustedDevice) {
      // Update last used
      await prisma.trustedDevice.update({
        where: { id: trustedDevice.id },
        data: { lastUsedAt: new Date() },
      })
      return true
    }

    return false
  } catch (error) {
    console.error('Check trusted device error:', error)
    return false
  }
}

/**
 * Resend MFA challenge (regenerate temp token)
 */
export async function resendMfaChallenge(
  oldTempToken: string,
  ipAddress: string,
  userAgent: string
): Promise<{ success: boolean; tempToken?: string; message: string }> {
  try {
    const mfaTempToken = await prisma.mfaTempToken.findUnique({
      where: { token: oldTempToken },
      include: { user: true },
    })

    if (!mfaTempToken || mfaTempToken.expiresAt < new Date()) {
      return {
        success: false,
        message: 'Session expired. Please log in again.',
      }
    }

    // Generate new temp token
    const newTempToken = generateToken(32)

    // Invalidate old token and create new one
    await prisma.$transaction([
      prisma.mfaTempToken.update({
        where: { id: mfaTempToken.id },
        data: { usedAt: new Date() },
      }),
      prisma.mfaTempToken.create({
        data: {
          userId: mfaTempToken.userId,
          token: newTempToken,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      }),
    ])

    await logSecurityEvent({
      userId: mfaTempToken.userId,
      action: 'mfa_challenge_resent',
      details: {},
      ipAddress,
      userAgent,
      severity: 'info',
    })

    return {
      success: true,
      tempToken: newTempToken,
      message: 'MFA challenge extended',
    }
  } catch (error) {
    console.error('Resend MFA challenge error:', error)
    return {
      success: false,
      message: 'Failed to extend MFA session',
    }
  }
}
