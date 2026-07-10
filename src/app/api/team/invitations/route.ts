import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { z } from 'zod'
import crypto from 'crypto'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { resolveWritableBusinessContext } from '@/lib/auth/business-route-utils'

const inviteSchema = z.object({
  email: z.string().trim().email('Invalid email').max(254),
  role: z.enum(['STAFF', 'ADMIN']),
})

function buildInvitationUrl(request: NextRequest, token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  return `${appUrl}/invite/${token}`
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const context = await resolveWritableBusinessContext(user.id, undefined, ['ADMIN'])

    const invitations = await prisma.teamInvitation.findMany({
      where: {
        businessId: context.businessId,
        status: { in: ['PENDING', 'ACCEPTED'] },
      },
      select: {
        id: true,
        businessId: true,
        email: true,
        role: true,
        status: true,
        invitedBy: true,
        expiresAt: true,
        acceptedAt: true,
        createdAt: true,
        invitedByUser: {
          select: {
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: { invitations },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

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

    const email = validation.data.email.toLowerCase()
    const role = validation.data.role

    const context = await resolveWritableBusinessContext(user.id, undefined, ['ADMIN'])

    if (role === 'ADMIN' && !context.isOwner) {
      return NextResponse.json(
        { success: false, error: 'Only the business owner can invite admins' },
        { status: 403 }
      )
    }

    const business = await prisma.business.findUnique({
      where: { id: context.businessId },
      select: {
        id: true,
        name: true,
        ownerId: true,
      },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
      },
    })

    if (existingUser?.id === business.ownerId) {
      return NextResponse.json(
        { success: false, error: 'User is already the business owner' },
        { status: 400 }
      )
    }

    if (existingUser) {
      const existingMember = await prisma.businessMember.findUnique({
        where: {
          businessId_userId: {
            businessId: business.id,
            userId: existingUser.id,
          },
        },
        select: {
          id: true,
        },
      })

      if (existingMember) {
        return NextResponse.json(
          { success: false, error: 'User is already a team member' },
          { status: 400 }
        )
      }
    }

    const existingInvitation = await prisma.teamInvitation.findFirst({
      where: {
        businessId: business.id,
        email,
        status: 'PENDING',
      },
      select: {
        id: true,
      },
    })

    if (existingInvitation) {
      return NextResponse.json(
        { success: false, error: 'Invitation already sent to this email' },
        { status: 400 }
      )
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const invitation = await prisma.teamInvitation.create({
      data: {
        businessId: business.id,
        email,
        role,
        token,
        invitedBy: user.id,
        expiresAt,
      },
      select: {
        id: true,
        businessId: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        createdAt: true,
      },
    })

    const invitationUrl = buildInvitationUrl(request, token)

    // TODO: Send invitation email.
    // await sendInvitationEmail({
    //   to: email,
    //   businessName: business.name,
    //   inviterName: user.email,
    //   invitationUrl,
    // })

    return NextResponse.json(
      {
        success: true,
        message: 'Invitation created successfully',
        data: {
          invitation,
          invitationUrl,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Create invitation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send invitation' },
      { status: 500 }
    )
  }
}
