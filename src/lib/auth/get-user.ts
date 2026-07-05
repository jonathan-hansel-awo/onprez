import { cookies, headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { validateSession } from '@/lib/auth/session-service'
import type { AuthUser, UserRole } from '@/types/auth'

async function getAccessTokenFromRequest() {
  const cookieStore = await cookies()
  const cookieToken = cookieStore.get('accessToken')?.value?.trim()

  if (cookieToken) {
    return cookieToken
  }

  const headersList = await headers()
  const authHeader = headersList.get('authorization')

  if (!authHeader) {
    return undefined
  }

  const [scheme, token] = authHeader.split(' ')

  if (scheme?.toLowerCase() !== 'bearer' || !token?.trim()) {
    return undefined
  }

  return token.trim()
}

/**
 * Get current authenticated user from a DB-backed session.
 *
 * This must validate both:
 * 1. the JWT itself
 * 2. the session row in the database
 *
 * Without the DB session check, deleted/revoked sessions can keep working
 * until the JWT expires.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const accessToken = await getAccessTokenFromRequest()

    if (!accessToken) {
      return null
    }

    const validation = await validateSession(accessToken)

    if (!validation.valid || !validation.session) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { id: validation.session.userId },
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
 * Get current user or throw error.
 */
export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

/**
 * Require user with email verification.
 */
export async function requireVerifiedUser(): Promise<AuthUser> {
  const user = await requireUser()

  if (!user.emailVerified) {
    throw new Error('Email verification required')
  }

  return user
}

/**
 * Require user with MFA enabled.
 */
export async function requireMfaUser(): Promise<AuthUser> {
  const user = await requireUser()

  if (!user.mfaEnabled) {
    throw new Error('MFA required')
  }

  return user
}

/**
 * Require user with specific platform role.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthUser> {
  const user = await requireUser()

  if (!allowedRoles.includes(user.role)) {
    throw new Error('Insufficient permissions')
  }

  return user
}

/**
 * Check if user has role.
 */
export function hasRole(user: AuthUser, roles: UserRole[]): boolean {
  return roles.includes(user.role)
}

/**
 * Check if user is platform admin.
 */
export function isAdmin(user: AuthUser): boolean {
  return user.role === 'ADMIN'
}
