import { NextRequest, NextResponse } from 'next/server'
import { getAppointmentSeries, cancelAppointmentSeries } from '@/lib/services/multi-day-booking'
import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { requireAppointmentAccess, requireAppointmentRole } from '@/lib/auth/appointment-access'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await requireAppointmentAccess(user.id, id)

    const series = await getAppointmentSeries(id)

    if (!series) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: series,
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Get appointment series error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get appointment series' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json().catch(() => ({}))

    await requireAppointmentRole(user.id, id, ['ADMIN', 'MANAGER', 'STAFF'])

    const result = await cancelAppointmentSeries(id, body.reason, user.id)

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
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Cancel appointment series error:', error)
    return NextResponse.json({ success: false, error: 'Failed to cancel series' }, { status: 500 })
  }
}
