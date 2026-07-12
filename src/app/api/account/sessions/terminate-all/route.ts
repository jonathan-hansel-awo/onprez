import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { logSecurityEvent } from '@/lib/services/security-logging'
import { hashSessionToken } from '@/lib/auth/token-hash'

const terminateAllSchema = z.object({
  keepCurrent: z.boolean().optional().default(true),
})

async function parseJsonBody(request: NextRequest) {
  try {
    return await request.json()
  } catch {
    return {}
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await parseJsonBody(request)
    const validation = terminateAllSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid input', errors: validation.error.issues },
        { status: 400 }
      )
    }

    const { keepCurrent } = validation.data

    const cookieStore = await cookies()
    const currentToken = cookieStore.get('accessToken')?.value

    const result =
      keepCurrent && currentToken
        ? await prisma.session.deleteMany({
            where: {
              userId: user.id,
              token: { not: hashSessionToken(currentToken) },
            },
          })
        : await prisma.session.deleteMany({
            where: {
              userId: user.id,
            },
          })

    const deletedCount = result.count

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
