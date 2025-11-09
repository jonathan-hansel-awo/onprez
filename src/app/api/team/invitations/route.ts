import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { z } from 'zod'
import crypto from 'crypto'

const inviteSchema = z.object({
  email: z.string().email('Invalid email'),
  role: z.enum(['STAFF', 'ADMIN']),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const business = await prisma.business.findFirst({
      where: { ownerId: user.id },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const invitations = await prisma.teamInvitation.findMany({
      where: {
        businessId: business.id,
        status: { in: ['PENDING', 'ACCEPTED'] },
      },
      include: {
        invitedByUser: {
          select: { email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: { invitations } })
  } catch (error) {
    console.error('Get invitations error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invitations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = inviteSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { email, role } = validation.data

    const business = await prisma.business.findFirst({
      where: { ownerId: user.id },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    // Check if user already exists in team
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      const isInTeam = await prisma.business.findFirst({
        where: {
          id: business.id,
          ownerId: existingUser.id,
        },
      })

      if (isInTeam) {
        return NextResponse.json(
          { success: false, error: 'User is already a team member' },
          { status: 400 }
        )
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await prisma.teamInvitation.findFirst({
      where: {
        businessId: business.id,
        email,
        status: 'PENDING',
      },
    })

    if (existingInvitation) {
      return NextResponse.json(
        { success: false, error: 'Invitation already sent to this email' },
        { status: 400 }
      )
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    const invitation = await prisma.teamInvitation.create({
      data: {
        businessId: business.id,
        email,
        role,
        token,
        invitedBy: user.id,
        expiresAt,
      },
    })

    // TODO: Send invitation email
    // await sendInvitationEmail({
    //   to: email,
    //   businessName: business.name,
    //   inviterName: user.email,
    //   invitationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`,
    // })

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      data: { invitation },
    })
  } catch (error) {
    console.error('Create invitation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send invitation' },
      { status: 500 }
    )
  }
}
