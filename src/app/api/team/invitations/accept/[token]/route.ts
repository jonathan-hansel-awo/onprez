import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'

export async function GET(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params

    if (!token || token.length < 32) {
      return NextResponse.json({ success: false, error: 'Invalid invitation' }, { status: 404 })
    }

    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        business: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!invitation) {
      return NextResponse.json({ success: false, error: 'Invalid invitation' }, { status: 404 })
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Invitation already used or cancelled' },
        { status: 400 }
      )
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      })

      return NextResponse.json({ success: false, error: 'Invitation expired' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        businessName: invitation.business.name,
        role: invitation.role,
        email: invitation.email,
      },
    })
  } catch (error) {
    console.error('Get invitation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load invitation' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { token } = await context.params

    if (!token || token.length < 32) {
      return NextResponse.json({ success: false, error: 'Invalid invitation' }, { status: 404 })
    }

    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      select: {
        id: true,
        businessId: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        business: {
          select: {
            name: true,
            ownerId: true,
          },
        },
      },
    })

    if (!invitation) {
      return NextResponse.json({ success: false, error: 'Invalid invitation' }, { status: 404 })
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Invitation already used or cancelled' },
        { status: 400 }
      )
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      })

      return NextResponse.json({ success: false, error: 'Invitation expired' }, { status: 400 })
    }

    if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'Invitation email does not match your account' },
        { status: 400 }
      )
    }

    if (invitation.business.ownerId === user.id) {
      return NextResponse.json(
        { success: false, error: 'You are already the owner of this business' },
        { status: 400 }
      )
    }

    const existingMember = await prisma.businessMember.findUnique({
      where: {
        businessId_userId: {
          businessId: invitation.businessId,
          userId: user.id,
        },
      },
      select: {
        id: true,
      },
    })

    if (existingMember) {
      return NextResponse.json(
        { success: false, error: 'You are already a member of this team' },
        { status: 400 }
      )
    }

    await prisma.$transaction([
      prisma.businessMember.create({
        data: {
          businessId: invitation.businessId,
          userId: user.id,
          role: invitation.role,
        },
      }),

      prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the team!',
      data: {
        businessId: invitation.businessId,
        businessName: invitation.business.name,
      },
    })
  } catch (error) {
    console.error('Accept invitation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to accept invitation' },
      { status: 500 }
    )
  }
}
