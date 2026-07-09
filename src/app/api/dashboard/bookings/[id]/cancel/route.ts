import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { requireAppointmentRole } from '@/lib/auth/appointment-access'

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

    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        businessId: appointmentAccess.businessId,
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            email: true,
            settings: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    if (!appointment) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 })
    }

    if (appointment.status === 'CANCELLED') {
      return NextResponse.json(
        { success: false, error: 'Appointment is already cancelled' },
        { status: 400 }
      )
    }

    if (appointment.status === 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Cannot cancel a completed appointment' },
        { status: 400 }
      )
    }

    const now = new Date()

    const cancellationNote = [
      `[${now.toISOString()}] Cancelled by ${user.email}`,
      `Reason: ${reasonLabels[reason]}`,
      customReason ? `Details: ${customReason}` : null,
      waiveCancellationFee ? 'Cancellation fee waived' : null,
    ]
      .filter(Boolean)
      .join('\n')

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        previousStatus: appointment.status,
        cancelledAt: now,
        cancelledBy: user.id,
        cancellationReason: reason,
        cancellationDetails: customReason || null,
        cancellationSource: 'BUSINESS',
        businessNotes: appointment.businessNotes
          ? `${appointment.businessNotes}\n\n${cancellationNote}`
          : cancellationNote,
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    await prisma.customer.update({
      where: { id: appointment.customerId },
      data: {
        cancelledBookings: { increment: 1 },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        appointment: updatedAppointment,
        notificationSent: notifyCustomer,
      },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Cancel booking error:', error)
    return NextResponse.json({ success: false, error: 'Failed to cancel booking' }, { status: 500 })
  }
}
