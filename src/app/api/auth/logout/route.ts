import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { logSecurityEvent } from '@/lib/services/security-logging'
import { hashSessionToken } from '@/lib/auth/token-hash'
import { apiError, logApiError } from '@/lib/api/error-response'

function createLogoutResponse(message = 'Logged out successfully') {
  const response = NextResponse.json({
    success: true,
    message,
  })

  response.cookies.set('accessToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })

  response.cookies.set('refreshToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })

  return response
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('accessToken')?.value

    const user = await getCurrentUser()

    // Logout should still clear stale/invalid cookies.
    if (!user) {
      return createLogoutResponse()
    }

    if (accessToken) {
      await prisma.session.deleteMany({
        where: {
          userId: user.id,
          token: hashSessionToken(accessToken),
        },
      })
    }

    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await logSecurityEvent({
      userId: user.id,
      action: 'logout',
      details: {},
      ipAddress,
      userAgent,
      severity: 'info',
    })

    return createLogoutResponse()
  } catch (error) {
    logApiError('logout-api', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
