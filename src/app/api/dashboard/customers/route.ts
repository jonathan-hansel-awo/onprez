import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { resolveReadableBusinessContext } from '@/lib/auth/business-route-utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const context = await resolveReadableBusinessContext(user.id, request)
    const customers = await prisma.customer.findMany({
      where: { businessId: context.businessId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        totalBookings: true,
        totalSpent: true,
        lastBookingAt: true,
      },
      orderBy: [{ lastBookingAt: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    })

    return NextResponse.json({
      success: true,
      data: {
        customers: customers.map(customer => ({
          ...customer,
          totalSpent: Number(customer.totalSpent),
        })),
      },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Get dashboard customers error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}
