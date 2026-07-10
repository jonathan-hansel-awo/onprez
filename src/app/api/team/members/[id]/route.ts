import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { z } from 'zod'
import { businessAuthErrorResponse, requireBusinessRole } from '@/lib/auth/business-access'

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
      select: {
        id: true,
        businessId: true,
        userId: true,
        role: true,
      },
    })

    if (!member) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 })
    }

    // Owner-only because this route can grant ADMIN.
    await requireBusinessRole(user.id, member.businessId, [])

    if (member.userId === user.id) {
      return NextResponse.json(
        { success: false, error: 'You cannot change your own team role' },
        { status: 400 }
      )
    }

    const updatedMember = await prisma.businessMember.update({
      where: { id },
      data: { role: validation.data.role },
      select: {
        id: true,
        businessId: true,
        userId: true,
        role: true,
        joinedAt: true,
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
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

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
      select: {
        id: true,
        businessId: true,
        userId: true,
        role: true,
      },
    })

    if (!member) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 })
    }

    // Owner-only because this can remove ADMIN users.
    await requireBusinessRole(user.id, member.businessId, [])

    if (member.userId === user.id) {
      return NextResponse.json(
        { success: false, error: 'You cannot remove yourself from your own team' },
        { status: 400 }
      )
    }

    const result = await prisma.businessMember.deleteMany({
      where: {
        id,
        businessId: member.businessId,
      },
    })

    if (result.count !== 1) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Team member removed successfully',
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Remove team member error:', error)
    return NextResponse.json({ success: false, error: 'Failed to remove member' }, { status: 500 })
  }
}
