import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { resolveReadableBusinessContext } from '@/lib/auth/business-route-utils'

function parseLimit(value: string | null) {
  const parsed = Number.parseInt(value || '5', 10)

  if (!Number.isFinite(parsed)) {
    return 5
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

    const searchParams = request.nextUrl.searchParams
    const limit = parseLimit(searchParams.get('limit'))

    const now = new Date()

    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        businessId,
        startTime: { gte: now },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        duration: true,
        status: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        totalAmount: true,
        paymentStatus: true,
        createdAt: true,
        service: {
          select: {
            name: true,
            duration: true,
          },
        },
        customer: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
      take: limit,
    })

    return NextResponse.json({
      success: true,
      data: {
        appointments: upcomingAppointments.map(appointment => ({
          ...appointment,
          totalAmount: Number(appointment.totalAmount),
        })),
      },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Get upcoming appointments error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch appointments' },
      { status: 500 }
    )
  }
}
