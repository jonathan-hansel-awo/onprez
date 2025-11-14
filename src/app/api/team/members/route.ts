import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'

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

    // Get all team members
    const members = await prisma.businessMember.findMany({
      where: { businessId: business.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    })

    // Add the owner to the list
    const owner = await prisma.user.findUnique({
      where: { id: business.ownerId },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    })

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

    return NextResponse.json({ success: true, data: { members: allMembers } })
  } catch (error) {
    console.error('Get team members error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch team members' },
      { status: 500 }
    )
  }
}
