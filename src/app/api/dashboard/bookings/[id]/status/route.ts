import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { AppointmentStatus } from '@prisma/client'
import { z } from 'zod'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { requireAppointmentRole } from '@/lib/auth/appointment-access'
import { AppointmentTransitionError, transitionAppointment } from '@/lib/services/appointment-state'

const statusUpdateSchema = z.object({
  status: z.nativeEnum(AppointmentStatus),
  reason: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(1000).optional(),
  notifyCustomer: z.boolean().default(true),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Authenticate user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's business
    const { appointment: appointmentAccess } = await requireAppointmentRole(user.id, id, [
      'ADMIN',
      'MANAGER',
      'STAFF',
    ])

    const businessId = appointmentAccess.businessId

    // Parse request body
    const body = await request.json()
    const validation = statusUpdateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { status: newStatus, reason, notes, notifyCustomer } = validation.data
    const result = await transitionAppointment({
      appointmentId: id,
      businessId,
      toStatus: newStatus,
      changedBy: user.id,
      changedByType: 'USER',
      reason,
      notes,
      cancellationSource: 'BUSINESS',
      notifyCustomer,
    })
    const updatedAppointment = result.appointment

    return NextResponse.json({
      success: true,
      data: {
        id: updatedAppointment.id,
        status: updatedAppointment.status,
        previousStatus: updatedAppointment.previousStatus,
        confirmedAt: updatedAppointment.confirmedAt,
        completedAt: updatedAppointment.completedAt,
        cancelledAt: updatedAppointment.cancelledAt,
        service: updatedAppointment.service,
        customer: updatedAppointment.customer,
        notificationSent: result.notificationSent,
      },
    })
  } catch (error) {
    if (error instanceof AppointmentTransitionError) {
      return NextResponse.json(
        { success: false, error: error.message },
        {
          status: error.code === 'NOT_FOUND' ? 404 : error.code === 'CONCURRENT_UPDATE' ? 409 : 400,
        }
      )
    }

    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Update appointment status error:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to update appointment status' },
      { status: 500 }
    )
  }
}
