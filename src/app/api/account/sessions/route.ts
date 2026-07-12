import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { hashSessionToken } from '@/lib/auth/token-hash'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const cookieStore = await cookies()
    const currentToken = cookieStore.get('accessToken')?.value

    const sessions = await prisma.session.findMany({
      where: {
        userId: user.id,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActivityAt: 'desc' },
      select: {
        id: true,
        token: true, // server-side only; removed before response
        deviceInfo: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        updatedAt: true,
        lastActivityAt: true,
        expiresAt: true,
      },
    })

    const safeSessions = sessions.map(({ token, ...session }) => ({
      ...session,
      isCurrent: Boolean(currentToken && token === hashSessionToken(currentToken)),
    }))

    return NextResponse.json({
      success: true,
      data: { sessions: safeSessions },
    })
  } catch (error) {
    console.error('Get sessions API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
