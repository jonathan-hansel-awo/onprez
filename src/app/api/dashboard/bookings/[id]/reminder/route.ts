import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { sendAppointmentReminder } from '@/lib/services/reminder'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify appointment belongs to user's business
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        business: {
          select: { ownerId: true },
        },
      },
    })

    if (!appointment) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 })
    }

    const isOwner = appointment.business.ownerId === user.id
    const isMember = await prisma.businessMember.findFirst({
      where: {
        businessId: appointment.businessId,
        userId: user.id,
      },
    })

    if (!isOwner && !isMember) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 })
    }

    // Check if appointment is in the future
    if (new Date(appointment.startTime) <= new Date()) {
      return NextResponse.json(
        { success: false, error: 'Cannot send reminder for past appointments' },
        { status: 400 }
      )
    }

    // Send reminder
    const result = await sendAppointmentReminder(id, 'manual')

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Reminder sent successfully',
    })
  } catch (error) {
    console.error('Send reminder error:', error)
    return NextResponse.json({ success: false, error: 'Failed to send reminder' }, { status: 500 })
  }
}
