import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { specialDateSchema } from '@/lib/validation/business'

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

    const specialDate = await prisma.specialDate.findFirst({
      where: {
        id,
        businessId: business.id,
      },
    })

    if (!specialDate) {
      return NextResponse.json(
        { success: false, error: 'Special date not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { specialDate },
    })
  } catch (error) {
    console.error('Get special date error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch special date' },
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

    const existingDate = await prisma.specialDate.findFirst({
      where: {
        id,
        businessId: business.id,
      },
    })

    if (!existingDate) {
      return NextResponse.json(
        { success: false, error: 'Special date not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validation = specialDateSchema.partial().safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { date, name, isClosed, openTime, closeTime, notes, isRecurring } = validation.data

    // If changing date, check for conflicts
    if (date && date !== existingDate.date.toISOString().split('T')[0]) {
      const conflict = await prisma.specialDate.findUnique({
        where: {
          businessId_date: {
            businessId: business.id,
            date: new Date(date),
          },
        },
      })

      if (conflict) {
        return NextResponse.json(
          { success: false, error: 'A special date already exists for this date' },
          { status: 409 }
        )
      }
    }

    const updatedDate = await prisma.specialDate.update({
      where: { id },
      data: {
        ...(date && { date: new Date(date) }),
        ...(name !== undefined && { name }),
        ...(isClosed !== undefined && { isClosed }),
        ...(isClosed === false && openTime && { openTime }),
        ...(isClosed === false && closeTime && { closeTime }),
        ...(isClosed === true && { openTime: null, closeTime: null }),
        ...(notes !== undefined && { notes }),
        ...(isRecurring !== undefined && { isRecurring }),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Special date updated successfully',
      data: { specialDate: updatedDate },
    })
  } catch (error) {
    console.error('Update special date error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update special date' },
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

    const existingDate = await prisma.specialDate.findFirst({
      where: {
        id,
        businessId: business.id,
      },
    })

    if (!existingDate) {
      return NextResponse.json(
        { success: false, error: 'Special date not found' },
        { status: 404 }
      )
    }

    await prisma.specialDate.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Special date deleted successfully',
    })
  } catch (error) {
    console.error('Delete special date error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete special date' },
      { status: 500 }
    )
  }
                                 }
