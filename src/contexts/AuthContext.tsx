'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { AuthUser } from '@/types/auth'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (accessToken: string, refreshToken: string) => void
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        return true
      } else {
        setUser(null)
        return false
      }
    } catch (error) {
      console.error('Fetch user error:', error)
      setUser(null)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  // Auto-refresh user on route change (for protected routes)
  useEffect(() => {
    if (!loading && pathname.startsWith('/account')) {
      fetchUser()
    }
  }, [pathname, loading, fetchUser])

  // Check token expiry periodically
  useEffect(() => {
    const checkTokenExpiry = async () => {
      const token = localStorage.getItem('accessToken')
      if (token && user) {
        // Try to fetch user - if it fails, token is expired
        const isValid = await fetchUser()
        if (!isValid && pathname.startsWith('/account')) {
          // Token expired, redirect to login
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          router.push(`/login?redirect=${encodeURIComponent(pathname)}&expired=true`)
        }
      }
    }

    // Check every 5 minutes
    const interval = setInterval(checkTokenExpiry, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [user, pathname, router, fetchUser])

  const login = (accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    fetchUser()
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout error:', error)
    }

    // Clear all stored data
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')

    // Clear any other cached data
    sessionStorage.clear()

    setUser(null)
    router.push('/login')
  }

  const refreshUser = async () => {
    await fetchUser()
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
