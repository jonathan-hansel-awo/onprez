import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { updateAppointmentSchema } from '@/lib/validation/booking'
import { cancelAppointment } from '@/lib/services/booking'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { requireAppointmentAccess, requireAppointmentRole } from '@/lib/auth/appointment-access'
import { AppointmentTransitionError, transitionAppointment } from '@/lib/services/appointment-state'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { appointment: appointmentAccess } = await requireAppointmentAccess(user.id, id)

    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        businessId: appointmentAccess.businessId,
      },
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
      data: {
        appointment: {
          ...appointment,
          totalAmount: Number(appointment.totalAmount),
          service: {
            ...appointment.service,
            price: Number(appointment.service.price),
          },
        },
      },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

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

    const { appointment: appointmentAccess } = await requireAppointmentRole(user.id, id, [
      'ADMIN',
      'MANAGER',
      'STAFF',
    ])

    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id,
        businessId: appointmentAccess.businessId,
      },
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

    const updateData = { ...validation.data } as Prisma.AppointmentUpdateInput
    const v = validation.data as any
    let transitionedAppointment:
      | Awaited<ReturnType<typeof transitionAppointment>>['appointment']
      | undefined
    delete (updateData as Record<string, unknown>).status
    delete (updateData as Record<string, unknown>).cancellationReason

    if (v.serviceId) {
      const service = await prisma.service.findFirst({
        where: {
          id: v.serviceId,
          businessId: appointmentAccess.businessId,
        },
        select: { id: true },
      })

      if (!service) {
        return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 })
      }
    }

    if (v.customerId) {
      const customer = await prisma.customer.findFirst({
        where: {
          id: v.customerId,
          businessId: appointmentAccess.businessId,
        },
        select: { id: true },
      })

      if (!customer) {
        return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 })
      }
    }

    if (v.status) {
      const transition = await transitionAppointment({
        appointmentId: id,
        businessId: appointmentAccess.businessId,
        toStatus: v.status,
        changedBy: user.id,
        changedByType: 'USER',
        reason: v.cancellationReason,
        cancellationSource: 'BUSINESS',
        notifyCustomer: true,
      })
      transitionedAppointment = transition.appointment
    }

    const updatedAppointment =
      Object.keys(updateData).length > 0
        ? await prisma.appointment.update({
            where: { id },
            data: updateData,
            include: {
              service: true,
              customer: true,
            },
          })
        : transitionedAppointment

    if (!updatedAppointment) {
      return NextResponse.json(
        { success: false, error: 'No appointment changes supplied' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment updated successfully',
      data: {
        appointment: {
          ...updatedAppointment,
          totalAmount: Number(updatedAppointment.totalAmount),
          service: {
            ...updatedAppointment.service,
            price: Number(updatedAppointment.service.price),
          },
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

    const { appointment } = await requireAppointmentRole(user.id, id, ['ADMIN', 'MANAGER', 'STAFF'])

    const { searchParams } = new URL(request.url)
    const reason = searchParams.get('reason') || undefined

    const result = await cancelAppointment(id, appointment.businessId, 'BUSINESS', reason, user.id)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: { appointment: result.appointment },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Cancel appointment error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to cancel appointment' },
      { status: 500 }
    )
  }
}
