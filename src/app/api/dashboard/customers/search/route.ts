import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { resolveReadableBusinessContext } from '@/lib/auth/business-route-utils'

function parseLimit(value: string | null) {
  const parsed = Number.parseInt(value || '10', 10)

  if (!Number.isFinite(parsed)) {
    return 10
  }

  return Math.min(Math.max(parsed, 1), 20)
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const context = await resolveReadableBusinessContext(user.id)
    const businessId = context.businessId

    const { searchParams } = new URL(request.url)
    const query = (searchParams.get('q') || '').trim()
    const limit = parseLimit(searchParams.get('limit'))

    if (query.length < 2) {
      return NextResponse.json({
        success: true,
        data: { customers: [] },
      })
    }

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
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Customer search error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to search customers' },
      { status: 500 }
    )
  }
}
