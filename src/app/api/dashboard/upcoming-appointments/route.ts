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

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '5')

    const now = new Date()

    // Get upcoming appointments
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        businessId: business.id,
        startTime: { gte: now },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      include: {
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
      data: { appointments: upcomingAppointments },
    })
  } catch (error) {
    console.error('Get upcoming appointments error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch appointments' },
      { status: 500 }
    )
  }
}
