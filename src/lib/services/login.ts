import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth/password'
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt'
import { logSecurityEvent } from '@/lib/services/security-logging'
import { sendNewDeviceAlert } from '@/lib/services/email'
import { generateToken } from '../utils/token'
import { hashMfaTempToken } from './mfa-challenge'

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

async function logSecurityEventSafely(event: Parameters<typeof logSecurityEvent>[0]) {
  try {
    await logSecurityEvent(event)
  } catch (error) {
    console.error('Security logging failed:', error)
  }
}

/**
 * Authenticate user with email and password.
 */
export async function loginUser(
  credentials: LoginInput,
  deviceInfo: DeviceInfo
): Promise<LoginResult> {
  const email = credentials.email.trim().toLowerCase()
  const { password, rememberMe } = credentials
  const { userAgent, ipAddress } = deviceInfo

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        passwordHash: true,
        accountLocked: true,
        failedLoginAttempts: true,
        mfaEnabled: true,
        sessions: {
          where: {
            expiresAt: { gt: new Date() },
          },
          select: {
            userAgent: true,
            ipAddress: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    const authAttempt = await prisma.authAttempt.create({
      data: {
        userId: user?.id,
        email,
        ipAddress,
        userAgent,
        attemptType: 'login',
        success: false,
      },
    })

    if (!user) {
      await logSecurityEventSafely({
        action: 'login_failed',
        details: { reason: 'invalid_credentials' },
        ipAddress,
        userAgent,
        severity: 'warning',
      })

      return {
        success: false,
        error: 'Invalid email or password',
      }
    }

    if (user.accountLocked) {
      await logSecurityEventSafely({
        userId: user.id,
        action: 'login_failed',
        details: { reason: 'account_locked' },
        ipAddress,
        userAgent,
        severity: 'warning',
      })

      return {
        success: false,
        error: 'Account is locked. Please contact support or reset your password.',
      }
    }

    if (!user.emailVerified) {
      await logSecurityEventSafely({
        userId: user.id,
        action: 'login_failed',
        details: { reason: 'email_not_verified' },
        ipAddress,
        userAgent,
        severity: 'warning',
      })

      return {
        success: false,
        error: 'Please verify your email address before logging in.',
      }
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash)

    if (!isPasswordValid) {
      const failedAttempts = (user.failedLoginAttempts ?? 0) + 1
      const shouldLock = failedAttempts >= 5

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedAttempts,
          accountLocked: shouldLock,
          lastFailedLogin: new Date(),
        },
      })

      await logSecurityEventSafely({
        userId: user.id,
        action: 'login_failed',
        details: {
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

    if (user.mfaEnabled) {
      const tempToken = generateToken(32)
      const hashedTempToken = hashMfaTempToken(tempToken)
      const now = new Date()

      await prisma.$transaction([
        prisma.mfaTempToken.updateMany({
          where: {
            userId: user.id,
            usedAt: null,
            expiresAt: { gt: now },
          },
          data: {
            usedAt: now,
          },
        }),
        prisma.mfaTempToken.create({
          data: {
            userId: user.id,
            token: hashedTempToken,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          },
        }),
      ])

      await logSecurityEventSafely({
        userId: user.id,
        action: 'mfa_challenge_initiated',
        details: {},
        ipAddress,
        userAgent,
        severity: 'info',
      })

      return {
        success: true,
        requiresMfa: true,
        mfaToken: tempToken,
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastLoginAt: new Date(),
      },
    })

    const isNewDevice = !user.sessions.some(
      session => session.userAgent === userAgent && session.ipAddress === ipAddress
    )

    const sessionDuration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
    const expiresAt = new Date(Date.now() + sessionDuration)

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    })

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
    })

    await prisma.session.create({
      data: {
        userId: user.id,
        token: accessToken,
        refreshToken,
        expiresAt,
        userAgent,
        ipAddress,
        deviceInfo: JSON.stringify({
          platform: deviceInfo.platform,
          browser: deviceInfo.browser,
        }),
      },
    })

    await prisma.authAttempt.update({
      where: { id: authAttempt.id },
      data: { success: true },
    })

    if (isNewDevice) {
      try {
        await sendNewDeviceAlert(user.email, {
          deviceInfo: userAgent,
          ipAddress,
          timestamp: new Date(),
          location: 'Unknown',
        })
      } catch (error) {
        console.error('New device alert failed:', error)
      }

      await logSecurityEventSafely({
        userId: user.id,
        action: 'new_device_login',
        details: { isNewDevice: true },
        ipAddress,
        userAgent,
        severity: 'info',
      })
    }

    await logSecurityEventSafely({
      userId: user.id,
      action: 'login_success',
      details: {
        rememberMe: Boolean(rememberMe),
        isNewDevice,
      },
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

    await logSecurityEventSafely({
      action: 'login_error',
      details: {
        reason: 'login_service_error',
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
 * Parse user agent for device info.
 */
export function parseUserAgent(userAgent: string): {
  platform?: string
  browser?: string
} {
  const platform = userAgent.match(/(Windows|Mac|Linux|Android|iOS)/i)?.[0]
  const browser = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)/i)?.[0]

  return { platform, browser }
}
