import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    // Verify ownership
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    })

    if (!business || business.ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get statistics
    const [
      totalServices,
      activeServices,
      featuredServices,
      totalBookings,
      totalRevenue,
      mostBooked,
    ] = await Promise.all([
      // Total services
      prisma.service.count({
        where: { businessId },
      }),

      // Active services
      prisma.service.count({
        where: { businessId, active: true },
      }),

      // Featured services
      prisma.service.count({
        where: { businessId, featured: true },
      }),

      // Total bookings
      prisma.appointment.count({
        where: { businessId },
      }),

      // Total revenue (sum of all completed appointments)
      prisma.appointment.aggregate({
        where: {
          businessId,
          status: 'COMPLETED',
        },
        _sum: {
          totalAmount: true,
        },
      }),

      // Most booked services
      prisma.appointment.groupBy({
        by: ['serviceId'],
        where: { businessId },
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

    // Get service details for most booked
    const mostBookedIds = mostBooked.map(m => m.serviceId)
    const mostBookedServices = await prisma.service.findMany({
      where: { id: { in: mostBookedIds } },
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
      totalServices,
      activeServices,
      inactiveServices: totalServices - activeServices,
      featuredServices,
      totalBookings,
      totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
      mostBooked: mostBookedWithDetails,
    })
  } catch (error) {
    console.error('Service stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
  }
}
