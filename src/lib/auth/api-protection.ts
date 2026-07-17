/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from './get-user'
import type { AuthUser, AuthRequirement } from '@/types/auth'
import { apiError, logApiError } from '@/lib/api/error-response'
import { withRequestLogging } from '@/lib/observability/logger'

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
    return withRequestLogging(request, async () => {
      try {
        // Get current user
        const user = await getCurrentUser()

        // Check if auth is required
        if (requirements.requireAuth !== false && !user) {
          return apiError('UNAUTHORIZED', 'Unauthorized', 401)
        }

        // If no user and auth not required, continue without user
        if (!user) {
          return handler({ user: null as any, request })
        }

        // Check email verification
        if (requirements.requireEmailVerified && !user.emailVerified) {
          return apiError('FORBIDDEN', 'Email verification required', 403)
        }

        // Check MFA requirement
        if (requirements.requireMfa && !user.mfaEnabled) {
          return apiError('FORBIDDEN', 'MFA required', 403)
        }

        // Check role requirement
        if (requirements.allowedRoles && !requirements.allowedRoles.includes(user.role)) {
          return apiError('FORBIDDEN', 'Insufficient permissions', 403)
        }

        // All checks passed, call handler
        return handler({ user, request })
      } catch (error) {
        logApiError('auth-wrapper', error)
        return apiError('INTERNAL_ERROR', 'Internal server error', 500)
      }
    })
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
