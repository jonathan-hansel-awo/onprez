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

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Get current month stats
    const [
      totalBookings,
      totalRevenue,
      totalCustomers,
      pendingBookings,
      lastMonthBookings,
      lastMonthRevenue,
    ] = await Promise.all([
      // Total bookings this month
      prisma.appointment.count({
        where: {
          businessId: business.id,
          createdAt: { gte: startOfMonth },
        },
      }),
      // Total revenue this month
      prisma.appointment.aggregate({
        where: {
          businessId: business.id,
          createdAt: { gte: startOfMonth },
          paymentStatus: 'PAID',
        },
        _sum: { totalAmount: true },
      }),
      // Total unique customers
      prisma.customer.count({
        where: { businessId: business.id },
      }),
      // Pending bookings
      prisma.appointment.count({
        where: {
          businessId: business.id,
          status: 'PENDING',
        },
      }),
      // Last month bookings
      prisma.appointment.count({
        where: {
          businessId: business.id,
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
      }),
      // Last month revenue
      prisma.appointment.aggregate({
        where: {
          businessId: business.id,
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
          paymentStatus: 'PAID',
        },
        _sum: { totalAmount: true },
      }),
    ])

    // Calculate trends
    const bookingsTrend =
      lastMonthBookings > 0 ? ((totalBookings - lastMonthBookings) / lastMonthBookings) * 100 : 0

    const revenueTrend =
      lastMonthRevenue._sum.totalAmount && totalRevenue._sum.totalAmount
        ? ((Number(totalRevenue._sum.totalAmount) - Number(lastMonthRevenue._sum.totalAmount)) /
            Number(lastMonthRevenue._sum.totalAmount)) *
          100
        : 0

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalBookings,
          totalRevenue: totalRevenue._sum.totalAmount || 0,
          totalCustomers,
          pendingBookings,
          bookingsTrend: Math.round(bookingsTrend * 10) / 10,
          revenueTrend: Math.round(revenueTrend * 10) / 10,
        },
      },
    })
  } catch (error) {
    console.error('Get dashboard stats error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 })
  }
}
