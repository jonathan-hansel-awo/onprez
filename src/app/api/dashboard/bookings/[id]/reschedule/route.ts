import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { z } from 'zod'

const rescheduleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  reason: z.string().optional(),
  notifyCustomer: z.boolean().default(true),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      select: { id: true, timezone: true },
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
    const validation = rescheduleSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { date, startTime, endTime, reason, notifyCustomer } = validation.data

    // Get the appointment
    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        businessId,
      },
      include: {
        service: true,
        customer: true,
      },
    })

    if (!appointment) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 })
    }

    // Check if appointment can be rescheduled
    const canReschedule =
      (appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') &&
      appointment.startTime > new Date()

    if (!canReschedule) {
      return NextResponse.json(
        { success: false, error: 'This appointment cannot be rescheduled' },
        { status: 400 }
      )
    }

    // Parse new date/time
    const newStartTime = new Date(`${date}T${startTime}:00`)
    const newEndTime = new Date(`${date}T${endTime}:00`)

    // Validate new time is in the future
    if (newStartTime <= new Date()) {
      return NextResponse.json(
        { success: false, error: 'New appointment time must be in the future' },
        { status: 400 }
      )
    }

    // Validate end time is after start time
    if (newEndTime <= newStartTime) {
      return NextResponse.json(
        { success: false, error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    // Check for conflicts with other appointments
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        businessId,
        id: { not: id }, // Exclude current appointment
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          {
            // New appointment starts during existing
            startTime: { lte: newStartTime },
            endTime: { gt: newStartTime },
          },
          {
            // New appointment ends during existing
            startTime: { lt: newEndTime },
            endTime: { gte: newEndTime },
          },
          {
            // New appointment contains existing
            startTime: { gte: newStartTime },
            endTime: { lte: newEndTime },
          },
        ],
      },
    })

    if (conflictingAppointment) {
      return NextResponse.json(
        { success: false, error: 'The selected time slot conflicts with another appointment' },
        { status: 409 }
      )
    }

    // Store old times for history
    const oldStartTime = appointment.startTime
    const oldEndTime = appointment.endTime

    // Calculate new duration
    const newDuration = Math.round((newEndTime.getTime() - newStartTime.getTime()) / 1000 / 60)

    // Update the appointment
    const now = new Date()
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        startTime: newStartTime,
        endTime: newEndTime,
        duration: newDuration,
        status: 'CONFIRMED',
        previousStatus: appointment.status,
        rescheduledAt: now,
        rescheduledFrom: oldStartTime.toISOString(),
        rescheduleReason: reason || null,
        // Add reschedule note to business notes
        businessNotes: appointment.businessNotes
          ? `${appointment.businessNotes}\n\n[${now.toISOString()}] Rescheduled by ${user.email} from ${oldStartTime.toISOString()} to ${newStartTime.toISOString()}${reason ? `. Reason: ${reason}` : ''}`
          : `[${now.toISOString()}] Rescheduled by ${user.email} from ${oldStartTime.toISOString()} to ${newStartTime.toISOString()}${reason ? `. Reason: ${reason}` : ''}`,
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

    // TODO: Send notification email to customer if notifyCustomer is true (Milestone 9.10)
    if (notifyCustomer) {
      // await sendRescheduleNotification(updatedAppointment, oldStartTime, oldEndTime)
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedAppointment.id,
        status: updatedAppointment.status,
        startTime: updatedAppointment.startTime,
        endTime: updatedAppointment.endTime,
        duration: updatedAppointment.duration,
        previousStartTime: oldStartTime,
        previousEndTime: oldEndTime,
        service: updatedAppointment.service,
        customer: updatedAppointment.customer,
      },
    })
  } catch (error) {
    console.error('Error rescheduling appointment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reschedule appointment' },
      { status: 500 }
    )
  }
}
