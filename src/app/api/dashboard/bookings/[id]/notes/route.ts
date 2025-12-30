import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { z } from 'zod'

const notesSchema = z.object({
  businessNotes: z.string().max(2000).optional().nullable(),
  customerNotes: z.string().max(2000).optional().nullable(),
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Validate request body
    const validation = notesSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { businessNotes, customerNotes } = validation.data

    // Fetch appointment to verify ownership
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        business: {
          select: {
            id: true,
            ownerId: true,
          },
        },
      },
    })

    if (!appointment) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 })
    }

    // Check authorization
    const isOwner = appointment.business.ownerId === user.id
    const isMember = await prisma.businessMember.findFirst({
      where: {
        businessId: appointment.businessId,
        userId: user.id,
      },
    })

    if (!isOwner && !isMember) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to edit this appointment' },
        { status: 403 }
      )
    }

    // Build update data - only include fields that were provided
    const updateData: { businessNotes?: string | null; customerNotes?: string | null } = {}

    if (businessNotes !== undefined) {
      updateData.businessNotes = businessNotes
    }

    if (customerNotes !== undefined) {
      updateData.customerNotes = customerNotes
    }

    // Update appointment
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
    console.error('Update notes error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update notes' }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Fetch appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      select: {
        id: true,
        businessNotes: true,
        customerNotes: true,
        business: {
          select: {
            ownerId: true,
          },
        },
      },
    })

    if (!appointment) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 })
    }

    // Check authorization
    const isOwner = appointment.business.ownerId === user.id
    const isMember = await prisma.businessMember.findFirst({
      where: {
        businessId: appointment.id,
        userId: user.id,
      },
    })

    if (!isOwner && !isMember) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to view this appointment' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: appointment.id,
        businessNotes: appointment.businessNotes,
        customerNotes: appointment.customerNotes,
      },
    })
  } catch (error) {
    console.error('Get notes error:', error)
    return NextResponse.json({ success: false, error: 'Failed to get notes' }, { status: 500 })
  }
}
