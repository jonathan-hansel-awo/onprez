/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '@/lib/prisma'
import { generateTokenPair, verifyToken, JWTError } from './jwt'
import type {
  CreateSessionParams,
  SessionData,
  SessionValidation,
  SessionListItem,
  DeviceInfo,
} from './session-types'

/**
 * Session Service Error
 */
export class SessionError extends Error {
  constructor(
    message: string,
    public code:
      | 'SESSION_NOT_FOUND'
      | 'SESSION_EXPIRED'
      | 'INVALID_TOKEN'
      | 'CREATION_FAILED'
      | 'UPDATE_FAILED'
      | 'DELETE_FAILED'
  ) {
    super(message)
    this.name = 'SessionError'
  }
}

/**
 * Session duration constants (in days)
 */
const SESSION_DURATION = {
  NORMAL: 7, // 7 days
  REMEMBER_ME: 30, // 30 days
} as const

/**
 * Create a new session
 * @param params - Session creation parameters
 * @returns Session data with tokens
 */
export async function createSession(params: CreateSessionParams): Promise<{
  session: SessionData
  accessToken: string
  refreshToken: string
}> {
  try {
    // Generate token pair
    const { accessToken, refreshToken } = generateTokenPair({
      userId: params.userId,
      email: params.email,
      businessId: params.businessId,
    })

    // Calculate expiry date
    const durationDays = params.rememberMe ? SESSION_DURATION.REMEMBER_ME : SESSION_DURATION.NORMAL

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + durationDays)

    // Create session in database
    const session = await prisma.session.create({
      data: {
        userId: params.userId,
        token: accessToken,
        refreshToken: refreshToken,
        deviceInfo: params.deviceInfo as any,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        expiresAt,
        lastActivityAt: new Date(),
      },
    })

    return {
      session: {
        id: session.id,
        userId: session.userId,
        token: session.token,
        refreshToken: session.refreshToken!,
        deviceInfo: session.deviceInfo as DeviceInfo | undefined,
        ipAddress: session.ipAddress || undefined,
        userAgent: session.userAgent || undefined,
        lastActivity: session.lastActivityAt,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
      },
      accessToken,
      refreshToken,
    }
  } catch (error) {
    throw new SessionError(`Failed to create session: ${error}`, 'CREATION_FAILED')
  }
}

/**
 * Validate a session by token
 * @param token - Access token to validate
 * @returns Session validation result
 */
export async function validateSession(token: string): Promise<SessionValidation> {
  try {
    // Verify JWT token
    const verified = verifyToken(token, 'access')

    if (verified.expired) {
      return {
        valid: false,
        reason: 'expired',
      }
    }

    // Find session in database
    const session = await prisma.session.findUnique({
      where: { token },
    })

    if (!session) {
      return {
        valid: false,
        reason: 'not_found',
      }
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      // Delete expired session
      await prisma.session.delete({
        where: { id: session.id },
      })

      return {
        valid: false,
        reason: 'expired',
      }
    }

    // Update last activity
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActivityAt: new Date() },
    })

    return {
      valid: true,
      session: {
        id: session.id,
        userId: session.userId,
        token: session.token,
        refreshToken: session.refreshToken!,
        deviceInfo: session.deviceInfo as DeviceInfo | undefined,
        ipAddress: session.ipAddress || undefined,
        userAgent: session.userAgent || undefined,
        lastActivity: session.lastActivityAt,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
      },
    }
  } catch (error) {
    if (error instanceof JWTError) {
      return {
        valid: false,
        reason: 'invalid_token',
      }
    }

    throw error
  }
}

/**
 * Refresh a session using refresh token
 * @param refreshToken - Refresh token
 * @returns New session data with new tokens
 */
export async function refreshSession(refreshToken: string): Promise<{
  session: SessionData
  accessToken: string
  refreshToken: string
}> {
  try {
    // Verify refresh token
    const verified = verifyToken(refreshToken, 'refresh')

    if (verified.expired) {
      throw new SessionError('Refresh token has expired', 'SESSION_EXPIRED')
    }

    // Find session in database
    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    })

    if (!session) {
      throw new SessionError('Session not found', 'SESSION_NOT_FOUND')
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      // Delete expired session
      await prisma.session.delete({
        where: { id: session.id },
      })

      throw new SessionError('Session has expired', 'SESSION_EXPIRED')
    }

    // Generate new token pair
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokenPair({
      userId: session.userId,
      email: session.user.email,
    })

    // Update session with new tokens
    const updatedSession = await prisma.session.update({
      where: { id: session.id },
      data: {
        token: newAccessToken,
        refreshToken: newRefreshToken,
        lastActivityAt: new Date(),
      },
    })

    return {
      session: {
        id: updatedSession.id,
        userId: updatedSession.userId,
        token: updatedSession.token,
        refreshToken: updatedSession.refreshToken!,
        deviceInfo: updatedSession.deviceInfo as DeviceInfo | undefined,
        ipAddress: updatedSession.ipAddress || undefined,
        userAgent: updatedSession.userAgent || undefined,
        lastActivity: updatedSession.lastActivityAt,
        expiresAt: updatedSession.expiresAt,
        createdAt: updatedSession.createdAt,
      },
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    }
  } catch (error) {
    if (error instanceof SessionError) {
      throw error
    }
    throw new SessionError('Failed to refresh session', 'UPDATE_FAILED')
  }
}

/**
 * Delete a session (logout)
 * @param token - Session token to delete
 */
export async function deleteSession(token: string): Promise<void> {
  try {
    await prisma.session.delete({
      where: { token },
    })
  } catch (error) {
    // Ignore if session doesn't exist
    if ((error as any)?.code === 'P2025') {
      return
    }
    throw new SessionError('Failed to delete session', 'DELETE_FAILED')
  }
}

/**
 * Delete all sessions for a user
 * @param userId - User ID
 */
export async function deleteAllUserSessions(userId: string): Promise<number> {
  try {
    const result = await prisma.session.deleteMany({
      where: { userId },
    })

    return result.count
  } catch (error) {
    throw new SessionError(`Failed to delete user sessions: ${error}`, 'DELETE_FAILED')
  }
}

/**
 * Get all active sessions for a user
 * @param userId - User ID
 * @param currentToken - Current session token to mark as current
 * @returns List of sessions
 */
export async function getUserSessions(
  userId: string,
  currentToken?: string
): Promise<SessionListItem[]> {
  try {
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() }, // Only non-expired sessions
      },
      orderBy: { lastActivityAt: 'desc' },
    })

    return sessions.map(session => ({
      id: session.id,
      // Handle deviceInfo which could be string or already parsed object
      deviceInfo: session.deviceInfo
        ? ((typeof session.deviceInfo === 'string'
            ? JSON.parse(session.deviceInfo)
            : session.deviceInfo) as DeviceInfo)
        : undefined,
      ipAddress: session.ipAddress || undefined,
      lastActivity: session.lastActivityAt,
      createdAt: session.createdAt,
      isCurrent: session.token === currentToken,
    }))
  } catch (error) {
    throw new SessionError(`Failed to get user sessions: ${error}`, 'SESSION_NOT_FOUND')
  }
}

/**
 * Delete a specific session by ID
 * @param sessionId - Session ID
 * @param userId - User ID (for authorization)
 */
export async function deleteSessionById(sessionId: string, userId: string): Promise<void> {
  try {
    await prisma.session.delete({
      where: {
        id: sessionId,
        userId, // Ensure user can only delete their own sessions
      },
    })
  } catch (error) {
    if ((error as any)?.code === 'P2025') {
      throw new SessionError('Session not found', 'SESSION_NOT_FOUND')
    }
    throw new SessionError('Failed to delete session', 'DELETE_FAILED')
  }
}

/**
 * Clean up expired sessions (should be run periodically)
 * @returns Number of sessions deleted
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    })

    return result.count
  } catch (error) {
    throw new SessionError(`Failed to cleanup expired sessions: ${error}`, 'DELETE_FAILED')
  }
}

/**
 * Parse device information from user agent
 * @param userAgent - User agent string
 * @returns Device information
 */
export function parseDeviceInfo(userAgent: string): DeviceInfo {
  const deviceInfo: DeviceInfo = {}

  // Detect browser
  if (userAgent.includes('Chrome')) {
    deviceInfo.browser = 'Chrome'
  } else if (userAgent.includes('Firefox')) {
    deviceInfo.browser = 'Firefox'
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    deviceInfo.browser = 'Safari'
  } else if (userAgent.includes('Edge')) {
    deviceInfo.browser = 'Edge'
  }

  // Detect OS
  if (userAgent.includes('Windows')) {
    deviceInfo.os = 'Windows'
  } else if (userAgent.includes('Mac')) {
    deviceInfo.os = 'macOS'
  } else if (userAgent.includes('Linux')) {
    deviceInfo.os = 'Linux'
  } else if (userAgent.includes('Android')) {
    deviceInfo.os = 'Android'
  } else if (
    userAgent.includes('iOS') ||
    userAgent.includes('iPhone') ||
    userAgent.includes('iPad')
  ) {
    deviceInfo.os = 'iOS'
  }

  // Detect device type
  if (userAgent.includes('Mobile')) {
    deviceInfo.deviceType = 'mobile'
  } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
    deviceInfo.deviceType = 'tablet'
  } else {
    deviceInfo.deviceType = 'desktop'
  }

  return deviceInfo
}
