import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse, requireBusinessRole } from '@/lib/auth/business-access'

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const invitation = await prisma.teamInvitation.findUnique({
      where: { id },
      select: {
        id: true,
        businessId: true,
        role: true,
        status: true,
      },
    })

    if (!invitation) {
      return NextResponse.json({ success: false, error: 'Invitation not found' }, { status: 404 })
    }

    const contextAccess = await requireBusinessRole(user.id, invitation.businessId, ['ADMIN'])

    if (invitation.role === 'ADMIN' && !contextAccess.isOwner) {
      return NextResponse.json(
        { success: false, error: 'Only the business owner can cancel admin invitations' },
        { status: 403 }
      )
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Only pending invitations can be cancelled' },
        { status: 400 }
      )
    }

    const result = await prisma.teamInvitation.updateMany({
      where: {
        id,
        businessId: invitation.businessId,
        status: 'PENDING',
      },
      data: { status: 'CANCELLED' },
    })

    if (result.count !== 1) {
      return NextResponse.json({ success: false, error: 'Invitation not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation cancelled successfully',
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Cancel invitation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to cancel invitation' },
      { status: 500 }
    )
  }
}
