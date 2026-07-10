import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { resolveWritableBusinessContext } from '@/lib/auth/business-route-utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const context = await resolveWritableBusinessContext(user.id, undefined, ['ADMIN'])

    const business = await prisma.business.findUnique({
      where: { id: context.businessId },
      select: {
        id: true,
        ownerId: true,
        createdAt: true,
      },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const [members, owner] = await Promise.all([
      prisma.businessMember.findMany({
        where: { businessId: context.businessId },
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
              createdAt: true,
            },
          },
        },
        orderBy: { joinedAt: 'asc' },
      }),

      prisma.user.findUnique({
        where: { id: business.ownerId },
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
      }),
    ])

    const allMembers = [
      {
        id: 'owner',
        businessId: business.id,
        userId: business.ownerId,
        role: 'OWNER',
        joinedAt: business.createdAt,
        user: owner,
      },
      ...members,
    ]

    return NextResponse.json({
      success: true,
      data: { members: allMembers },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Get team members error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch team members' },
      { status: 500 }
    )
  }
}
