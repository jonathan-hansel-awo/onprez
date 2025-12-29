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
    const query = searchParams.get('q') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20)

    if (query.length < 2) {
      return NextResponse.json({
        success: true,
        data: { customers: [] },
      })
    }

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

    // Search customers
    const customers = await prisma.customer.findMany({
      where: {
        businessId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        totalBookings: true,
        lastBookingAt: true,
      },
      orderBy: [{ totalBookings: 'desc' }, { lastBookingAt: 'desc' }],
      take: limit,
    })

    return NextResponse.json({
      success: true,
      data: { customers },
    })
  } catch (error) {
    console.error('Customer search error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to search customers' },
      { status: 500 }
    )
  }
}
