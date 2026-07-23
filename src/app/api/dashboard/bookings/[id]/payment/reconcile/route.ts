import { NextRequest, NextResponse } from 'next/server'

import { requireAppointmentRole } from '@/lib/auth/appointment-access'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { getCurrentUser } from '@/lib/auth/get-user'
import { reconcileBookingPayment } from '@/lib/booking-protection/operations'
import { logger } from '@/lib/observability/logger'
import { prisma } from '@/lib/prisma'

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
    const { appointment } = await requireAppointmentRole(user.id, id, ['ADMIN', 'MANAGER'])
    const payment = await prisma.bookingPayment.findFirst({
      where: { appointmentId: id, businessId: appointment.businessId },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    })

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'No booking payment exists for this appointment' },
        { status: 404 }
      )
    }

    await reconcileBookingPayment(payment.id, `DASHBOARD:${user.id}`)
    const updated = await prisma.bookingPayment.findUnique({ where: { id: payment.id } })

    return NextResponse.json({ success: true, data: { payment: updated } })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    logger.error('booking.payment.reconcile_route_failed', { error })
    return NextResponse.json(
      { success: false, error: 'Failed to reconcile booking payment' },
      { status: 500 }
    )
  }
}
