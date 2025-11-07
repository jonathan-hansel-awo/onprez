import { cookies, headers } from 'next/headers'
import { verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/prisma'
import type { AuthUser, UserRole } from '@/types/auth'

/**
 * Get current authenticated user from token
 * Use this in Server Components and API routes
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    // Try to get token from cookies first (preferred)
    const cookieStore = await cookies()
    let accessToken = cookieStore.get('accessToken')?.value

    // Fallback to Authorization header
    if (!accessToken) {
      const headersList = await headers()
      const authHeader = headersList.get('authorization')
      accessToken = authHeader?.replace('Bearer ', '')
    }

    if (!accessToken) {
      return null
    }

    // Verify token
    const tokenPayload = await verifyToken(accessToken)
    if (!tokenPayload) {
      return null
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: tokenPayload.payload.userId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        mfaEnabled: true,
        role: true,
      },
    })

    if (!user) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      mfaEnabled: user.mfaEnabled,
      role: user.role as UserRole,
    }
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

/**
 * Get current user or throw error
 */
export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

/**
 * Require user with email verification
 */
export async function requireVerifiedUser(): Promise<AuthUser> {
  const user = await requireUser()
  if (!user.emailVerified) {
    throw new Error('Email verification required')
  }
  return user
}

/**
 * Require user with MFA enabled
 */
export async function requireMfaUser(): Promise<AuthUser> {
  const user = await requireUser()
  if (!user.mfaEnabled) {
    throw new Error('MFA required')
  }
  return user
}

/**
 * Require user with specific role
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthUser> {
  const user = await requireUser()
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Insufficient permissions')
  }
  return user
}

/**
 * Check if user has role
 */
export function hasRole(user: AuthUser, roles: UserRole[]): boolean {
  return roles.includes(user.role)
}

/**
 * Check if user is admin
 */
export function isAdmin(user: AuthUser): boolean {
  return user.role === 'ADMIN'
}
