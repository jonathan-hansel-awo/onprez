import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { AppointmentStatus } from '@prisma/client'
import { z } from 'zod'

const statusUpdateSchema = z.object({
  status: z.nativeEnum(AppointmentStatus),
  reason: z.string().optional(),
  notes: z.string().optional(),
})

// Valid status transitions
const VALID_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'],
  COMPLETED: [], // Terminal state
  CANCELLED: [], // Terminal state
  NO_SHOW: [], // Terminal state
  RESCHEDULED: ['CONFIRMED', 'CANCELLED'], // Can confirm or cancel the rescheduled booking
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Authenticate user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's business
    let businessId: string | null = null

    const ownedBusiness = await prisma.business.findFirst({
      where: { ownerId: user.id },
      select: { id: true },
    })

    if (ownedBusiness) {
      businessId = ownedBusiness.id
    } else {
      const membership = await prisma.businessMember.findFirst({
        where: { userId: user.id },
        select: { businessId: true },
      })
      if (membership) {
        businessId = membership.businessId
      }
    }

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'No business found for user' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    const validation = statusUpdateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { status: newStatus, reason, notes } = validation.data

    // Get the appointment
    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        businessId,
      },
    })

    if (!appointment) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 })
    }

    // Check if transition is valid
    const allowedTransitions = VALID_TRANSITIONS[appointment.status]
    if (!allowedTransitions.includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot change status from ${appointment.status} to ${newStatus}`,
        },
        { status: 400 }
      )
    }

    // Build update data
    const now = new Date()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      status: newStatus,
      previousStatus: appointment.status,
    }

    // Add status-specific fields
    switch (newStatus) {
      case 'CONFIRMED':
        updateData.confirmedAt = now
        updateData.confirmedBy = user.id
        break
      case 'COMPLETED':
        updateData.completedAt = now
        break
      case 'CANCELLED':
        updateData.cancelledAt = now
        updateData.cancelledBy = user.id
        updateData.cancellationSource = 'BUSINESS'
        if (reason) {
          updateData.cancellationReason = reason
        }
        break
      case 'NO_SHOW':
        // No additional fields needed
        break
    }

    // Add notes if provided
    if (notes) {
      updateData.businessNotes = appointment.businessNotes
        ? `${appointment.businessNotes}\n\n[${now.toISOString()}] ${notes}`
        : `[${now.toISOString()}] ${notes}`
    }

    // Update the appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
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

    // Update customer statistics if completed or no-show
    if (newStatus === 'COMPLETED') {
      await prisma.customer.update({
        where: { id: appointment.customerId },
        data: {
          completedBookings: { increment: 1 },
          totalSpent: { increment: appointment.totalAmount },
          lastBookingAt: now,
        },
      })
    } else if (newStatus === 'NO_SHOW') {
      await prisma.customer.update({
        where: { id: appointment.customerId },
        data: {
          noShowCount: { increment: 1 },
        },
      })
    } else if (newStatus === 'CANCELLED') {
      await prisma.customer.update({
        where: { id: appointment.customerId },
        data: {
          cancelledBookings: { increment: 1 },
        },
      })
    }

    // TODO: Send notification email to customer (Milestone 9.10)

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
      },
    })
  } catch (error) {
    console.error('Error updating appointment status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update appointment status' },
      { status: 500 }
    )
  }
}
