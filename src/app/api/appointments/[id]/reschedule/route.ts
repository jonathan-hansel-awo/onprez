import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { rescheduleAppointmentSchema } from '@/lib/validation/booking'
import { rescheduleAppointment } from '@/lib/services/booking'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { requireAppointmentRole } from '@/lib/auth/appointment-access'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { appointment } = await requireAppointmentRole(user.id, id, ['ADMIN', 'MANAGER', 'STAFF'])

    const body = await request.json()
    const validation = rescheduleAppointmentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { date, startTime, reason } = validation.data

    const result = await rescheduleAppointment(id, appointment.businessId, date, startTime, reason)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, conflicts: result.conflicts },
        { status: result.conflicts ? 409 : 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: { appointment: result.appointment },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Reschedule appointment error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reschedule appointment' },
      { status: 500 }
    )
  }
}
