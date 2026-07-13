import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { requireAppointmentRole } from '@/lib/auth/appointment-access'
import { AppointmentTransitionError, transitionAppointment } from '@/lib/services/appointment-state'

const cancelSchema = z.object({
  reason: z.enum([
    'CUSTOMER_REQUEST',
    'BUSINESS_UNAVAILABLE',
    'STAFF_UNAVAILABLE',
    'EMERGENCY',
    'DUPLICATE_BOOKING',
    'NO_SHOW_POLICY',
    'OTHER',
  ]),
  customReason: z.string().max(500).optional(),
  notifyCustomer: z.boolean().default(true),
  waiveCancellationFee: z.boolean().default(false),
})

export type CancellationReason = z.infer<typeof cancelSchema>['reason']

const reasonLabels: Record<CancellationReason, string> = {
  CUSTOMER_REQUEST: 'Customer requested cancellation',
  BUSINESS_UNAVAILABLE: 'Business unavailable',
  STAFF_UNAVAILABLE: 'Staff unavailable',
  EMERGENCY: 'Emergency',
  DUPLICATE_BOOKING: 'Duplicate booking',
  NO_SHOW_POLICY: 'No-show policy applied',
  OTHER: 'Other reason',
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const validation = cancelSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { reason, customReason, notifyCustomer, waiveCancellationFee } = validation.data

    const { appointment: appointmentAccess } = await requireAppointmentRole(user.id, id, [
      'ADMIN',
      'MANAGER',
      'STAFF',
    ])

    const now = new Date()

    const cancellationNote = [
      `[${now.toISOString()}] Cancelled by ${user.email}`,
      `Reason: ${reasonLabels[reason]}`,
      customReason ? `Details: ${customReason}` : null,
      waiveCancellationFee ? 'Cancellation fee waived' : null,
    ]
      .filter(Boolean)
      .join('\n')

    const result = await transitionAppointment({
      appointmentId: id,
      businessId: appointmentAccess.businessId,
      toStatus: 'CANCELLED',
      changedBy: user.id,
      changedByType: 'USER',
      reason,
      cancellationDetails: customReason,
      cancellationSource: 'BUSINESS',
      notes: cancellationNote,
      notifyCustomer,
    })

    return NextResponse.json({
      success: true,
      data: {
        appointment: result.appointment,
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

    console.error('Cancel booking error:', error)
    return NextResponse.json({ success: false, error: 'Failed to cancel booking' }, { status: 500 })
  }
}
