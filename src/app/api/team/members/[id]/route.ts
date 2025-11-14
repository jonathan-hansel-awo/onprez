import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { z } from 'zod'

const updateRoleSchema = z.object({
  role: z.enum(['STAFF', 'ADMIN']),
})

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()
    const validation = updateRoleSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    const member = await prisma.businessMember.findUnique({
      where: { id },
      include: { business: true },
    })

    if (!member) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 })
    }

    // Check if user owns the business
    if (member.business.ownerId !== user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const updatedMember = await prisma.businessMember.update({
      where: { id },
      data: { role: validation.data.role },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Role updated successfully',
      data: { member: updatedMember },
    })
  } catch (error) {
    console.error('Update member role error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update role' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const member = await prisma.businessMember.findUnique({
      where: { id },
      include: { business: true },
    })

    if (!member) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 })
    }

    // Check if user owns the business
    if (member.business.ownerId !== user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    await prisma.businessMember.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Team member removed successfully',
    })
  } catch (error) {
    console.error('Remove team member error:', error)
    return NextResponse.json({ success: false, error: 'Failed to remove member' }, { status: 500 })
  }
}
