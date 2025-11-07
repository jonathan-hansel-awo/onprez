/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from './get-user'
import type { AuthUser, AuthRequirement } from '@/types/auth'

interface ProtectedHandlerContext {
  user: AuthUser
  request: NextRequest
}

type ProtectedHandler<T = any> = (
  context: ProtectedHandlerContext
) => Promise<NextResponse<T>> | NextResponse<T>

/**
 * Wrapper for protected API routes
 * Handles authentication and authorization checks
 */
export function withAuth(handler: ProtectedHandler, requirements: AuthRequirement = {}) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Get current user
      const user = await getCurrentUser()

      // Check if auth is required
      if (requirements.requireAuth !== false && !user) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
      }

      // If no user and auth not required, continue without user
      if (!user) {
        return handler({ user: null as any, request })
      }

      // Check email verification
      if (requirements.requireEmailVerified && !user.emailVerified) {
        return NextResponse.json(
          { success: false, message: 'Email verification required' },
          { status: 403 }
        )
      }

      // Check MFA requirement
      if (requirements.requireMfa && !user.mfaEnabled) {
        return NextResponse.json({ success: false, message: 'MFA required' }, { status: 403 })
      }

      // Check role requirement
      if (requirements.allowedRoles && !requirements.allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { success: false, message: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      // All checks passed, call handler
      return handler({ user, request })
    } catch (error) {
      console.error('Auth wrapper error:', error)
      return NextResponse.json(
        { success: false, message: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Quick wrapper for routes requiring any authenticated user
 */
export function requireAuth(handler: ProtectedHandler) {
  return withAuth(handler, { requireAuth: true })
}

/**
 * Quick wrapper for routes requiring verified email
 */
export function requireVerified(handler: ProtectedHandler) {
  return withAuth(handler, { requireAuth: true, requireEmailVerified: true })
}

/**
 * Quick wrapper for routes requiring MFA
 */
export function requireMfa(handler: ProtectedHandler) {
  return withAuth(handler, { requireAuth: true, requireMfa: true })
}

/**
 * Quick wrapper for admin-only routes
 */
export function requireAdmin(handler: ProtectedHandler) {
  return withAuth(handler, { requireAuth: true, allowedRoles: ['ADMIN'] })
}
