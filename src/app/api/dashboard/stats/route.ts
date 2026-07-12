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
    const businessId = context.businessId

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

    const [
      totalBookings,
      totalRevenue,
      totalCustomers,
      pendingBookings,
      lastMonthBookings,
      lastMonthRevenue,
    ] = await Promise.all([
      prisma.appointment.count({
        where: {
          businessId,
          createdAt: { gte: startOfMonth },
        },
      }),

      prisma.appointment.aggregate({
        where: {
          businessId,
          createdAt: { gte: startOfMonth },
          paymentStatus: 'PAID',
        },
        _sum: { totalAmount: true },
      }),

      prisma.customer.count({
        where: { businessId },
      }),

      prisma.appointment.count({
        where: {
          businessId,
          status: 'PENDING',
        },
      }),

      prisma.appointment.count({
        where: {
          businessId,
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
      }),

      prisma.appointment.aggregate({
        where: {
          businessId,
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
          paymentStatus: 'PAID',
        },
        _sum: { totalAmount: true },
      }),
    ])

    const currentRevenue = Number(totalRevenue._sum.totalAmount || 0)
    const previousRevenue = Number(lastMonthRevenue._sum.totalAmount || 0)

    const bookingsTrend =
      lastMonthBookings > 0 ? ((totalBookings - lastMonthBookings) / lastMonthBookings) * 100 : 0

    const revenueTrend =
      previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalBookings,
          totalRevenue: currentRevenue,
          totalCustomers,
          pendingBookings,
          bookingsTrend: Math.round(bookingsTrend * 10) / 10,
          revenueTrend: Math.round(revenueTrend * 10) / 10,
        },
      },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Get dashboard stats error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 })
  }
}
