import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { updateAppointmentSchema } from '@/lib/validation/booking'
import { cancelAppointment } from '@/lib/services/booking'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const business = await prisma.business.findFirst({
      where: { ownerId: user.id },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const appointment = await prisma.appointment.findFirst({
      where: { id, businessId: business.id },
      include: {
        service: true,
        customer: true,
        business: {
          select: {
            name: true,
            email: true,
            phone: true,
            timezone: true,
            address: true,
          },
        },
      },
    })

    if (!appointment) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: { appointment },
    })
  } catch (error) {
    console.error('Get appointment error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch appointment' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const business = await prisma.business.findFirst({
      where: { ownerId: user.id },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const existingAppointment = await prisma.appointment.findFirst({
      where: { id, businessId: business.id },
    })

    if (!existingAppointment) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 })
    }

    const body = await request.json()
    const validation = updateAppointmentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    const updateData = validation.data

    // Handle status change
    if (updateData.status) {
      const statusUpdateData: Record<string, unknown> = {
        status: updateData.status,
        previousStatus: existingAppointment.status,
      }

      if (updateData.status === 'CONFIRMED' && existingAppointment.status === 'PENDING') {
        statusUpdateData.confirmedAt = new Date()
      }

      if (updateData.status === 'COMPLETED') {
        statusUpdateData.completedAt = new Date()
      }

      if (updateData.status === 'CANCELLED') {
        statusUpdateData.cancelledAt = new Date()
        statusUpdateData.cancellationSource = 'BUSINESS'
        statusUpdateData.cancellationReason = updateData.cancellationReason
      }

      if (updateData.status === 'NO_SHOW') {
        // Update customer no-show count
        await prisma.customer.update({
          where: { id: existingAppointment.customerId },
          data: { noShowCount: { increment: 1 } },
        })
      }

      Object.assign(updateData, statusUpdateData)
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        service: true,
        customer: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Appointment updated successfully',
      data: { appointment: updatedAppointment },
    })
  } catch (error) {
    console.error('Update appointment error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update appointment' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const business = await prisma.business.findFirst({
      where: { ownerId: user.id },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const reason = searchParams.get('reason') || undefined

    const result = await cancelAppointment(id, business.id, 'BUSINESS', reason)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: { appointment: result.appointment },
    })
  } catch (error) {
    console.error('Cancel appointment error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to cancel appointment' },
      { status: 500 }
    )
  }
}
