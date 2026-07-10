import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { businessAuthErrorResponse, requireBusinessAccess } from '@/lib/auth/business-access'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json({ success: false, error: 'Business ID required' }, { status: 400 })
    }

    const context = await requireBusinessAccess(user.id, businessId)

    const [
      totalServices,
      activeServices,
      featuredServices,
      totalBookings,
      totalRevenue,
      mostBooked,
    ] = await Promise.all([
      prisma.service.count({
        where: { businessId: context.businessId },
      }),
      prisma.service.count({
        where: { businessId: context.businessId, active: true },
      }),
      prisma.service.count({
        where: { businessId: context.businessId, featured: true },
      }),
      prisma.appointment.count({
        where: { businessId: context.businessId },
      }),
      prisma.appointment.aggregate({
        where: {
          businessId: context.businessId,
          status: 'COMPLETED',
        },
        _sum: {
          totalAmount: true,
        },
      }),
      prisma.appointment.groupBy({
        by: ['serviceId'],
        where: { businessId: context.businessId },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 5,
      }),
    ])

    const mostBookedIds = mostBooked.map(m => m.serviceId)

    const mostBookedServices = await prisma.service.findMany({
      where: {
        id: { in: mostBookedIds },
        businessId: context.businessId,
      },
      select: {
        id: true,
        name: true,
        price: true,
      },
    })

    const mostBookedWithDetails = mostBooked.map(mb => {
      const service = mostBookedServices.find(s => s.id === mb.serviceId)

      return {
        serviceId: mb.serviceId,
        name: service?.name || 'Unknown',
        bookings: mb._count.id,
        revenue: service ? Number(service.price) * mb._count.id : 0,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        totalServices,
        activeServices,
        inactiveServices: totalServices - activeServices,
        featuredServices,
        totalBookings,
        totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
        mostBooked: mostBookedWithDetails,
      },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Service stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
