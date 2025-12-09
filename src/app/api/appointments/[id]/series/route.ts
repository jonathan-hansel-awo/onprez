import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { cookies } from 'next/headers'
import { getAppointmentSeries, cancelAppointmentSeries } from '@/lib/services/multi-day-booking'
import { prisma } from '@/lib/prisma'

// GET - Get all appointments in a series
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const series = await getAppointmentSeries(id)

    if (!series) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: series,
    })
  } catch (error) {
    console.error('Get appointment series error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get appointment series' },
      { status: 500 }
    )
  }
}

// DELETE - Cancel entire series
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('accessToken')?.value

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json().catch(() => ({}))

    // Verify ownership
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        business: {
          select: { ownerId: true },
        },
      },
    })

    if (!appointment) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 })
    }

    if (appointment.business.ownerId !== payload.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const result = await cancelAppointmentSeries(id, body.reason, payload.userId)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        cancelled: result.cancelled,
        message: `Cancelled ${result.cancelled} appointments in series`,
      },
    })
  } catch (error) {
    console.error('Cancel appointment series error:', error)
    return NextResponse.json({ success: false, error: 'Failed to cancel series' }, { status: 500 })
  }
}
