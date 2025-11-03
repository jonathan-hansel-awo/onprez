/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '@/lib/prisma'
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt'

interface CreateSessionParams {
  userId: string
  deviceInfo: any
  userAgent: string
  ipAddress: string
  rememberMe?: boolean
}

interface CreateSessionResult {
  success: boolean
  data?: {
    accessToken: string
    refreshToken: string
  }
  message?: string
}

/**
 * Create a new session for a user
 */
export async function createSession({
  userId,
  deviceInfo,
  userAgent,
  ipAddress,
  rememberMe = false,
}: CreateSessionParams): Promise<CreateSessionResult> {
  try {
    // Get user email for token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })

    if (!user) {
      return {
        success: false,
        message: 'User not found',
      }
    }

    const sessionDuration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
    const expiresAt = new Date(Date.now() + sessionDuration)

    const accessToken = generateAccessToken({
      userId,
      email: user.email,
    })
    const refreshToken = generateRefreshToken({
      userId,
      email: user.email,
    })

    await prisma.session.create({
      data: {
        userId,
        token: accessToken,
        refreshToken,
        expiresAt,
        userAgent,
        ipAddress,
        deviceInfo: JSON.stringify(deviceInfo),
      },
    })

    return {
      success: true,
      data: {
        accessToken,
        refreshToken,
      },
    }
  } catch (error) {
    console.error('Create session error:', error)
    return {
      success: false,
      message: 'Failed to create session',
    }
  }
}

/**
 * Delete a session
 */
export async function deleteSession(token: string): Promise<boolean> {
  try {
    await prisma.session.delete({
      where: { token },
    })
    return true
  } catch (error) {
    console.error('Delete session error:', error)
    return false
  }
}

/**
 * Delete all user sessions
 */
export async function deleteAllUserSessions(userId: string): Promise<boolean> {
  try {
    await prisma.session.deleteMany({
      where: { userId },
    })
    return true
  } catch (error) {
    console.error('Delete all sessions error:', error)
    return false
  }
}

/**
 * Validate session
 */
export async function validateSession(token: string): Promise<{
  valid: boolean
  userId?: string
  email?: string
}> {
  try {
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!session) {
      return { valid: false }
    }

    if (session.expiresAt < new Date()) {
      // Delete expired session
      await prisma.session.delete({
        where: { id: session.id },
      })
      return { valid: false }
    }

    return {
      valid: true,
      userId: session.user.id,
      email: session.user.email,
    }
  } catch (error) {
    console.error('Validate session error:', error)
    return { valid: false }
  }
}
