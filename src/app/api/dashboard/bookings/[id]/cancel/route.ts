import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { z } from 'zod'

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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Validate request body
    const validation = cancelSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { reason, customReason, notifyCustomer, waiveCancellationFee } = validation.data

    // Fetch appointment with business info
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            ownerId: true,
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

    // Check authorization - must be business owner or team member
    const isOwner = appointment.business.ownerId === user.id
    const isMember = await prisma.businessMember.findFirst({
      where: {
        businessId: appointment.businessId,
        userId: user.id,
      },
    })

    if (!isOwner && !isMember) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to cancel this appointment' },
        { status: 403 }
      )
    }

    // Check if appointment can be cancelled
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

    // Build cancellation note
    const reasonLabels: Record<string, string> = {
      CUSTOMER_REQUEST: 'Customer requested cancellation',
      BUSINESS_UNAVAILABLE: 'Business unavailable',
      STAFF_UNAVAILABLE: 'Staff unavailable',
      EMERGENCY: 'Emergency',
      DUPLICATE_BOOKING: 'Duplicate booking',
      NO_SHOW_POLICY: 'No-show policy applied',
      OTHER: 'Other reason',
    }

    const cancellationNote = [
      `[${new Date().toISOString()}] Cancelled by ${user.email}`,
      `Reason: ${reasonLabels[reason]}`,
      customReason ? `Details: ${customReason}` : null,
      waiveCancellationFee ? 'Cancellation fee waived' : null,
    ]
      .filter(Boolean)
      .join('\n')

    // Update appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        previousStatus: appointment.status,
        cancelledAt: new Date(),
        cancelledBy: user.id,
        cancellationReason: reason,
        cancellationDetails: customReason || null,
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

    // Update customer stats
    await prisma.customer.update({
      where: { id: appointment.customerId },
      data: {
        cancelledBookings: { increment: 1 },
      },
    })

    // TODO: Send cancellation email if notifyCustomer is true
    // This will be implemented in Milestone 9.10
    if (notifyCustomer && appointment.customer?.email) {
      // await sendCancellationEmail({
      //   to: appointment.customer.email,
      //   customerName: appointment.customer.name,
      //   businessName: appointment.business.name,
      //   serviceName: appointment.service.name,
      //   appointmentDate: appointment.startTime,
      //   reason: reasonLabels[reason],
      //   customReason,
      // })
      console.log('TODO: Send cancellation email to', appointment.customer.email)
    }

    return NextResponse.json({
      success: true,
      data: {
        appointment: updatedAppointment,
        notificationSent: notifyCustomer,
      },
    })
  } catch (error) {
    console.error('Cancel booking error:', error)
    return NextResponse.json({ success: false, error: 'Failed to cancel booking' }, { status: 500 })
  }
}
