import { BookingPaymentStatus } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAppointmentRole } from '@/lib/auth/appointment-access'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { getCurrentUser } from '@/lib/auth/get-user'
import { decideCancellationRefund } from '@/lib/booking-protection/cancellation'
import {
  recordRetainedBookingDeposit,
  requestBookingDepositRefund,
} from '@/lib/booking-protection/operations'
import { logger } from '@/lib/observability/logger'
import { prisma } from '@/lib/prisma'
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
  refundDeposit: z.boolean().optional(),
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
    const validation = cancelSchema.safeParse(await request.json())

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { reason, customReason, notifyCustomer, waiveCancellationFee, refundDeposit } =
      validation.data
    const { appointment: appointmentAccess } = await requireAppointmentRole(user.id, id, [
      'ADMIN',
      'MANAGER',
      'STAFF',
    ])

    const payment = await prisma.bookingPayment.findFirst({
      where: {
        appointmentId: id,
        businessId: appointmentAccess.businessId,
        status: {
          in: [
            BookingPaymentStatus.SUCCEEDED,
            BookingPaymentStatus.PARTIALLY_REFUNDED,
            BookingPaymentStatus.REFUNDED,
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    const paidAmount = payment ? Number(payment.amount) : 0
    const alreadyRefunded = payment ? Number(payment.refundedAmount) : 0
    const refundDecision = decideCancellationRefund({
      reason,
      startTime: appointmentAccess.startTime,
      depositPaid: Boolean(payment),
      refundableAmount: Math.max(0, paidAmount - alreadyRefunded),
      policySnapshot: payment?.policySnapshot,
      requestedRefund: refundDeposit,
      waiveCancellationFee,
    })

    const now = new Date()
    const cancellationNote = [
      `Cancelled by ${user.email}`,
      `Reason: ${reasonLabels[reason]}`,
      customReason ? `Details: ${customReason}` : null,
      payment
        ? refundDecision.shouldRefund
          ? `Deposit refund requested: ${refundDecision.explanation}`
          : `Deposit retained: ${refundDecision.explanation}`
        : null,
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
      notes: `[${now.toISOString()}] ${cancellationNote}`,
      notifyCustomer,
      metadata: {
        depositDecision: refundDecision.shouldRefund ? 'REFUND' : 'RETAIN',
        depositDecisionForced: refundDecision.forced,
        refundableAmount: refundDecision.refundableAmount,
      },
    })

    const depositOutcome = refundDecision.shouldRefund
      ? await requestBookingDepositRefund({
          appointmentId: id,
          businessId: appointmentAccess.businessId,
          requestedBy: user.id,
          reason: customReason || reasonLabels[reason],
        })
      : {
          status: payment ? ('RETAINED' as const) : ('NOT_REQUIRED' as const),
          refundableAmount: refundDecision.refundableAmount,
          refundedAmount: alreadyRefunded,
          retained: payment
            ? await recordRetainedBookingDeposit({
                appointmentId: id,
                businessId: appointmentAccess.businessId,
                retainedBy: user.id,
                reason: customReason || reasonLabels[reason],
              })
            : false,
        }

    logger.info('booking.cancellation.completed', {
      bookingId: id,
      businessId: appointmentAccess.businessId,
      reason,
      depositOutcome: depositOutcome.status,
      refundForced: refundDecision.forced,
    })

    return NextResponse.json({
      success: true,
      data: {
        appointment: result.appointment,
        notificationSent: result.notificationSent,
        deposit: {
          ...depositOutcome,
          decision: refundDecision.shouldRefund ? 'REFUND' : 'RETAIN',
          forced: refundDecision.forced,
          explanation: refundDecision.explanation,
          cancellationWindowHours: refundDecision.cancellationWindowHours,
        },
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

    logger.error('booking.cancellation.failed', { error })
    return NextResponse.json({ success: false, error: 'Failed to cancel booking' }, { status: 500 })
  }
}
