import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { requireAppointmentRole } from '@/lib/auth/appointment-access'
import { sendAppointmentReminder } from '@/lib/services/reminder'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { appointment } = await requireAppointmentRole(user.id, id, ['ADMIN', 'MANAGER', 'STAFF'])

    if (new Date(appointment.startTime) <= new Date()) {
      return NextResponse.json(
        { success: false, error: 'Cannot send reminder for past appointments' },
        { status: 400 }
      )
    }

    const result = await sendAppointmentReminder(id, 'manual')

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send reminder' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Reminder sent successfully',
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Send reminder error:', error)
    return NextResponse.json({ success: false, error: 'Failed to send reminder' }, { status: 500 })
  }
}
