import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { logSecurityEvent } from '@/lib/services/security-logging'
import { cookies } from 'next/headers'

const terminateAllSchema = z.object({
  keepCurrent: z.boolean().optional().default(true),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = terminateAllSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid input', errors: validation.error.issues },
        { status: 400 }
      )
    }

    const { keepCurrent } = validation.data

    // Get current session token
    const cookieStore = await cookies()
    const currentToken = cookieStore.get('accessToken')?.value

    let deletedCount: number

    if (keepCurrent && currentToken) {
      // Delete all sessions except current
      const result = await prisma.session.deleteMany({
        where: {
          userId: user.id,
          token: { not: currentToken },
        },
      })
      deletedCount = result.count
    } else {
      // Delete all sessions
      const result = await prisma.session.deleteMany({
        where: { userId: user.id },
      })
      deletedCount = result.count
    }

    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await logSecurityEvent({
      userId: user.id,
      action: 'all_sessions_terminated',
      details: {
        keepCurrent,
        deletedCount,
      },
      ipAddress,
      userAgent,
      severity: 'warning',
    })

    return NextResponse.json({
      success: true,
      message: `${deletedCount} session${deletedCount !== 1 ? 's' : ''} terminated successfully`,
      data: { deletedCount },
    })
  } catch (error) {
    console.error('Terminate all sessions API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
