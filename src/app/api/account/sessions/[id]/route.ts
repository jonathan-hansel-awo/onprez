import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { logSecurityEvent } from '@/lib/services/security-logging'

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    // Verify session belongs to user
    const session = await prisma.session.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!session) {
      return NextResponse.json({ success: false, message: 'Session not found' }, { status: 404 })
    }

    // Delete session
    await prisma.session.delete({
      where: { id },
    })

    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await logSecurityEvent({
      userId: user.id,
      action: 'session_terminated',
      details: {
        sessionId: id,
        sessionIp: session.ipAddress,
      },
      ipAddress,
      userAgent,
      severity: 'info',
    })

    return NextResponse.json({
      success: true,
      message: 'Session terminated successfully',
    })
  } catch (error) {
    console.error('Delete session API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
