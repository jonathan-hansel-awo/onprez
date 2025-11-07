import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { logSecurityEvent } from '@/lib/services/security-logging'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, message: 'Not logged in' }, { status: 401 })
    }

    // Get access token
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('accessToken')?.value

    // Delete session from database
    if (accessToken) {
      await prisma.session.deleteMany({
        where: {
          userId: user.id,
          token: accessToken,
        },
      })
    }

    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await logSecurityEvent({
      userId: user.id,
      action: 'logout',
      details: { email: user.email },
      ipAddress,
      userAgent,
      severity: 'info',
    })

    // Clear cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
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
  } catch (error) {
    console.error('Logout API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
