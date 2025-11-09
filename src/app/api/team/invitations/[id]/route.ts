import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const invitation = await prisma.teamInvitation.findUnique({
      where: { id },
      include: { business: true },
    })

    if (!invitation) {
      return NextResponse.json({ success: false, error: 'Invitation not found' }, { status: 404 })
    }

    // Check if user owns the business
    if (invitation.business.ownerId !== user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    await prisma.teamInvitation.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })

    return NextResponse.json({
      success: true,
      message: 'Invitation cancelled successfully',
    })
  } catch (error) {
    console.error('Cancel invitation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to cancel invitation' },
      { status: 500 }
    )
  }
}
