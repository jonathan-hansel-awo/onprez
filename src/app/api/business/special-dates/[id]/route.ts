import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { specialDateSchema } from '@/lib/validation/business'
import {
  businessAuthErrorResponse,
  requireBusinessAccess,
  requireBusinessRole,
} from '@/lib/auth/business-access'

function specialDateSelect() {
  return {
    id: true,
    businessId: true,
    date: true,
    name: true,
    isClosed: true,
    openTime: true,
    closeTime: true,
    notes: true,
    isRecurring: true,
    createdAt: true,
    updatedAt: true,
  } satisfies Prisma.SpecialDateSelect
}

async function getSpecialDateBusinessId(id: string) {
  const specialDate = await prisma.specialDate.findUnique({
    where: { id },
    select: {
      id: true,
      businessId: true,
      date: true,
    },
  })

  return specialDate
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existingDate = await getSpecialDateBusinessId(id)

    if (!existingDate) {
      return NextResponse.json({ success: false, error: 'Special date not found' }, { status: 404 })
    }

    await requireBusinessAccess(user.id, existingDate.businessId)

    const specialDate = await prisma.specialDate.findFirst({
      where: {
        id,
        businessId: existingDate.businessId,
      },
      select: specialDateSelect(),
    })

    if (!specialDate) {
      return NextResponse.json({ success: false, error: 'Special date not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: { specialDate },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

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

    const existingDate = await getSpecialDateBusinessId(id)

    if (!existingDate) {
      return NextResponse.json({ success: false, error: 'Special date not found' }, { status: 404 })
    }

    await requireBusinessRole(user.id, existingDate.businessId, ['ADMIN', 'MANAGER'])

    const body = await request.json()
    const { businessId: _businessId, ...specialDateBody } = body

    const validation = specialDateSchema.partial().safeParse(specialDateBody)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { date, name, isClosed, openTime, closeTime, notes, isRecurring } = validation.data

    if (date) {
      const newDate = new Date(date)
      const existingDateOnly = existingDate.date.toISOString().split('T')[0]
      const newDateOnly = newDate.toISOString().split('T')[0]

      if (newDateOnly !== existingDateOnly) {
        const conflict = await prisma.specialDate.findUnique({
          where: {
            businessId_date: {
              businessId: existingDate.businessId,
              date: newDate,
            },
          },
          select: { id: true },
        })

        if (conflict && conflict.id !== id) {
          return NextResponse.json(
            { success: false, error: 'A special date already exists for this date' },
            { status: 409 }
          )
        }
      }
    }

    const updateData: Prisma.SpecialDateUpdateInput = {
      ...(date && { date: new Date(date) }),
      ...(name !== undefined && { name }),
      ...(isClosed !== undefined && { isClosed }),
      ...(notes !== undefined && { notes }),
      ...(isRecurring !== undefined && { isRecurring }),
    }

    if (isClosed === true) {
      updateData.openTime = null
      updateData.closeTime = null
    }

    if (isClosed === false) {
      if (openTime !== undefined) updateData.openTime = openTime
      if (closeTime !== undefined) updateData.closeTime = closeTime
    }

    const updatedDate = await prisma.specialDate.update({
      where: { id },
      data: updateData,
      select: specialDateSelect(),
    })

    return NextResponse.json({
      success: true,
      message: 'Special date updated successfully',
      data: { specialDate: updatedDate },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'A special date already exists for this date' },
        { status: 409 }
      )
    }

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

    const existingDate = await getSpecialDateBusinessId(id)

    if (!existingDate) {
      return NextResponse.json({ success: false, error: 'Special date not found' }, { status: 404 })
    }

    await requireBusinessRole(user.id, existingDate.businessId, ['ADMIN', 'MANAGER'])

    const result = await prisma.specialDate.deleteMany({
      where: {
        id,
        businessId: existingDate.businessId,
      },
    })

    if (result.count !== 1) {
      return NextResponse.json({ success: false, error: 'Special date not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Special date deleted successfully',
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Delete special date error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete special date' },
      { status: 500 }
    )
  }
}
