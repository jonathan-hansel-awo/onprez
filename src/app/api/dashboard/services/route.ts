import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') !== 'false'

    // Get user's business
    const ownedBusiness = await prisma.business.findFirst({
      where: { ownerId: user.id },
      select: { id: true },
    })

    const membership = await prisma.businessMember.findFirst({
      where: { userId: user.id },
      select: { businessId: true },
    })

    const businessId = ownedBusiness?.id || membership?.businessId
    if (!businessId) {
      return NextResponse.json({ success: false, error: 'No business found' }, { status: 404 })
    }

    const services = await prisma.service.findMany({
      where: {
        businessId,
        ...(activeOnly ? { active: true } : {}),
      },
      select: {
        id: true,
        name: true,
        price: true,
        duration: true,
        active: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json({
      success: true,
      data: { services },
    })
  } catch (error) {
    console.error('Get services error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch services' }, { status: 500 })
  }
}
