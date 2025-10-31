ailimport { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth/password'
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt'
import { logSecurityEvent } from '@/lib/services/security-logging'
import { sendNewDeviceAlert } from '@/lib/services/email'

export interface LoginInput {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginResult {
  success: boolean
  requiresMfa?: boolean
  mfaToken?: string
  accessToken?: string
  refreshToken?: string
  user?: {
    id: string
    email: string
    emailVerified: boolean
  }
  error?: string
}

interface DeviceInfo {
  userAgent: string
  ipAddress: string
  platform?: string
  browser?: string
}

/**
 * Authenticate user with email and password
 */
export async function loginUser(
  credentials: LoginInput,
  deviceInfo: DeviceInfo
): Promise<LoginResult> {
  const { email, password, rememberMe } = credentials
  const { userAgent, ipAddress } = deviceInfo

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        sessions: {
          where: {
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    // Record login attempt
    await prisma.authAttempt.create({
      data: {
        userId: user?.id,
        email,
        ipAddress,
        userAgent,
        attemptType: 'login',
        success: false, // Will update if successful
      },
    })

    if (!user) {
      // Don't reveal if user exists
      await logSecurityEvent({
        action: 'login_failed',
        details: { email, reason: 'invalid_credentials' },
        ipAddress,
        userAgent,
        severity: 'warning',
      })

      return {
        success: false,
        error: 'Invalid email or password',
      }
    }

    // Check if account is locked
    if (user.accountLocked) {
      await logSecurityEvent({
        userId: user.id,
        action: 'login_failed',
        details: { email, reason: 'account_locked' },
        ipAddress,
        userAgent,
        severity: 'warning',
      })

      return {
        success: false,
        error: 'Account is locked. Please contact support or reset your password.',
      }
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return {
        success: false,
        error: 'Please verify your email address before logging in.',
      }
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash)

    if (!isPasswordValid) {
      // Increment failed attempts
      const failedAttempts = user.failedLoginAttempts + 1
      const shouldLock = failedAttempts >= 5

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedAttempts,
          accountLocked: shouldLock,
          lastFailedLogin: new Date(),
        },
      })

      await logSecurityEvent({
        userId: user.id,
        action: 'login_failed',
        details: {
          email,
          reason: 'invalid_password',
          failedAttempts,
          accountLocked: shouldLock,
        },
        ipAddress,
        userAgent,
        severity: shouldLock ? 'error' : 'warning',
      })

      if (shouldLock) {
        return {
          success: false,
          error:
            'Account locked due to too many failed login attempts. Please reset your password.',
        }
      }

      return {
        success: false,
        error: 'Invalid email or password',
      }
    }

    // Check if MFA is enabled
    if (user.mfaEnabled) {
      // Generate temporary MFA token
      const mfaToken = generateAccessToken({
        userId: user.id,
        type: 'mfa_challenge',
      })

      await logSecurityEvent({
        userId: user.id,
        action: 'mfa_challenge_initiated',
        details: { email },
        ipAddress,
        userAgent,
        severity: 'info',
      })

      return {
        success: true,
        requiresMfa: true,
        mfaToken,
      }
    }

    // Reset failed attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastLoginAt: new Date(),
      },
    })

    // Check if this is a new device
    const isNewDevice = !user.sessions.some(
      session => session.userAgent === userAgent && session.ipAddress === ipAddress
    )

    // Create session
    const sessionDuration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // 30 days or 1 day
    const expiresAt = new Date(Date.now() + sessionDuration)

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    })

    const refreshToken = generateRefreshToken({
      userId: user.id,
    })

    await prisma.session.create({
      data: {
        userId: user.id,
        token: accessToken,
        refreshToken,
        expiresAt,
        userAgent,
        ipAddress,
        deviceInfo: {
          platform: deviceInfo.platform,
          browser: deviceInfo.browser,
        },
      },
    })

    // Update auth attempt to successful
    await prisma.authAttempt.updateMany({
      where: {
        userId: user.id,
        email,
        success: false,
        createdAt: { gte: new Date(Date.now() - 60000) }, // Last minute
      },
      data: { success: true },
    })

    // Send new device alert if needed
    if (isNewDevice) {
      await sendNewDeviceAlert(user.email, {
        deviceInfo: userAgent,
        ipAddress,
        timestamp: new Date(),
        location: 'Unknown', // Could integrate with IP geolocation service
      })

      await logSecurityEvent({
        userId: user.id,
        action: 'new_device_login',
        details: { email, userAgent, ipAddress },
        ipAddress,
        userAgent,
        severity: 'info',
      })
    }

    // Log successful login
    await logSecurityEvent({
      userId: user.id,
      action: 'login_success',
      details: { email, rememberMe, isNewDevice },
      ipAddress,
      userAgent,
      severity: 'info',
    })

    return {
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    }
  } catch (error) {
    console.error('Login error:', error)

    await logSecurityEvent({
      action: 'login_error',
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
      error: 'An error occurred during login. Please try again.',
    }
  }
}

/**
 * Parse user agent for device info
 */
export function parseUserAgent(userAgent: string): {
  platform?: string
  browser?: string
} {
  const platform = userAgent.match(/(Windows|Mac|Linux|Android|iOS)/i)?.[0]
  const browser = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)/i)?.[0]

  return { platform, browser }
}
