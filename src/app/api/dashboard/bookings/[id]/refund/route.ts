import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAppointmentRole } from '@/lib/auth/appointment-access'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { getCurrentUser } from '@/lib/auth/get-user'
import { requestBookingDepositRefund } from '@/lib/booking-protection/operations'
import { logger } from '@/lib/observability/logger'

const refundSchema = z.object({
  reason: z.string().trim().min(3).max(500),
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
    const validation = refundSchema.safeParse(await request.json())
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid refund request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { appointment } = await requireAppointmentRole(user.id, id, ['ADMIN'])
    const refund = await requestBookingDepositRefund({
      appointmentId: id,
      businessId: appointment.businessId,
      requestedBy: user.id,
      reason: validation.data.reason,
    })

    const status = refund.status === 'FAILED' ? 502 : refund.status === 'NOT_REQUIRED' ? 409 : 200
    return NextResponse.json(
      {
        success: refund.status !== 'FAILED' && refund.status !== 'NOT_REQUIRED',
        data: refund,
        ...(refund.status === 'FAILED'
          ? { error: refund.error || 'Stripe could not complete the refund' }
          : refund.status === 'NOT_REQUIRED'
            ? { error: 'No refundable booking deposit exists' }
            : {}),
      },
      { status }
    )
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    logger.error('booking.refund.route_failed', { error })
    return NextResponse.json(
      { success: false, error: 'Failed to refund booking deposit' },
      { status: 500 }
    )
  }
}
