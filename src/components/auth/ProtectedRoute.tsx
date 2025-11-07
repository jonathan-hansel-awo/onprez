'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/types/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireEmailVerified?: boolean
  requireMfa?: boolean
  allowedRoles?: UserRole[]
  fallback?: React.ReactNode
}

export function ProtectedRoute({
  children,
  requireEmailVerified = false,
  requireMfa = false,
  allowedRoles,
  fallback,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push('/login')
      return
    }

    if (requireEmailVerified && !user.emailVerified) {
      router.push('/verify-email')
      return
    }

    if (requireMfa && !user.mfaEnabled) {
      router.push('/account/security')
      return
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.push('/unauthorized')
      return
    }
  }, [user, loading, router, requireEmailVerified, requireMfa, allowedRoles])

  if (loading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-onprez-blue" />
        </div>
      )
    )
  }

  if (!user) {
    return null
  }

  if (requireEmailVerified && !user.emailVerified) {
    return null
  }

  if (requireMfa && !user.mfaEnabled) {
    return null
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}
