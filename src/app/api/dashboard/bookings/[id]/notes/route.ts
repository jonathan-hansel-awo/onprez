import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { requireAppointmentAccess, requireAppointmentRole } from '@/lib/auth/appointment-access'

const notesSchema = z.object({
  businessNotes: z.string().max(2000).optional().nullable(),
  customerNotes: z.string().max(2000).optional().nullable(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await requireAppointmentAccess(user.id, id)

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      select: {
        id: true,
        businessNotes: true,
        customerNotes: true,
      },
    })

    if (!appointment) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: appointment,
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Get notes error:', error)
    return NextResponse.json({ success: false, error: 'Failed to get notes' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const validation = notesSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    await requireAppointmentRole(user.id, id, ['ADMIN', 'MANAGER', 'STAFF'])

    const updateData: {
      businessNotes?: string | null
      customerNotes?: string | null
    } = {}

    if (validation.data.businessNotes !== undefined) {
      updateData.businessNotes = validation.data.businessNotes
    }

    if (validation.data.customerNotes !== undefined) {
      updateData.customerNotes = validation.data.customerNotes
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        businessNotes: true,
        customerNotes: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedAppointment,
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Update notes error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update notes' }, { status: 500 })
  }
}
