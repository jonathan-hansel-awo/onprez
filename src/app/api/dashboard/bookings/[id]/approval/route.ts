import { AppointmentStatus } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAppointmentRole } from '@/lib/auth/appointment-access'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { getCurrentUser } from '@/lib/auth/get-user'
import { requestBookingDepositRefund } from '@/lib/booking-protection/operations'
import { logger } from '@/lib/observability/logger'
import { AppointmentTransitionError, transitionAppointment } from '@/lib/services/appointment-state'

const approvalSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  reason: z.string().trim().max(500).optional(),
  notifyCustomer: z.boolean().default(true),
})

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true

  try {
    return new URL(origin).origin === request.nextUrl.origin
  } catch {
    return false
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const validation = approvalSchema.safeParse(await request.json())
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { appointment } = await requireAppointmentRole(user.id, id, ['ADMIN', 'MANAGER', 'STAFF'])
    const { decision, reason, notifyCustomer } = validation.data

    if (appointment.status !== AppointmentStatus.PENDING || !appointment.approvalExpiresAt) {
      return NextResponse.json(
        { success: false, error: 'This booking is not awaiting professional approval.' },
        { status: 409 }
      )
    }

    if (appointment.requiresDeposit && !appointment.depositPaid) {
      return NextResponse.json(
        {
          success: false,
          error: 'The booking deposit must be paid before this request can be reviewed.',
        },
        { status: 409 }
      )
    }

    if (appointment.approvalExpiresAt <= new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: 'The approval deadline has passed. The booking will be expired and refunded.',
        },
        { status: 409 }
      )
    }

    const rejecting = decision === 'REJECT'
    const rejectionReason = reason || 'Booking request rejected by professional'
    const transition = await transitionAppointment({
      appointmentId: id,
      businessId: appointment.businessId,
      toStatus: rejecting ? AppointmentStatus.CANCELLED : AppointmentStatus.CONFIRMED,
      changedBy: user.id,
      changedByType: 'USER',
      reason: rejecting ? 'PROFESSIONAL_REJECTED' : reason || 'PROFESSIONAL_APPROVED',
      cancellationDetails: rejecting ? rejectionReason : undefined,
      cancellationSource: rejecting ? 'BUSINESS' : undefined,
      notes: rejecting ? rejectionReason : 'Booking request approved by professional.',
      notifyCustomer,
      metadata: { approvalDecision: decision },
    })

    const deposit = rejecting
      ? await requestBookingDepositRefund({
          appointmentId: id,
          businessId: appointment.businessId,
          requestedBy: user.id,
          reason: rejectionReason,
        })
      : null

    logger.info('booking.approval.completed', {
      bookingId: id,
      businessId: appointment.businessId,
      decision,
      depositOutcome: deposit?.status,
    })

    return NextResponse.json({
      success: true,
      data: {
        appointment: transition.appointment,
        notificationSent: transition.notificationSent,
        deposit,
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

    logger.error('booking.approval.failed', { error })
    return NextResponse.json(
      { success: false, error: 'Failed to process booking approval' },
      { status: 500 }
    )
  }
}
