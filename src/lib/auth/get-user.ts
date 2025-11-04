import { cookies, headers } from 'next/headers'
import { verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/prisma'

export interface CurrentUser {
  id: string
  email: string
  emailVerified: boolean
  mfaEnabled: boolean
}

/**
 * Get current authenticated user from token
 * Use this in Server Components and API routes
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
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
      },
    })

    return user
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

/**
 * Get current user or throw error
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}
