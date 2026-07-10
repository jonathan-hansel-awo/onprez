import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { requireServiceAccess, requireServiceRole } from '@/lib/auth/service-access'

function parseNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { service: serviceAccess } = await requireServiceAccess(user.id, id)

    const service = await prisma.service.findFirst({
      where: {
        id,
        businessId: serviceAccess.businessId,
      },
      include: {
        category: true,
        variants: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!service) {
      return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: { service },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Get service error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch service' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { service: serviceAccess } = await requireServiceRole(user.id, id, ['ADMIN', 'MANAGER'])
    const body = await request.json()

    if (body.categoryId) {
      const category = await prisma.serviceCategory.findFirst({
        where: {
          id: body.categoryId,
          businessId: serviceAccess.businessId,
        },
        select: { id: true },
      })

      if (!category) {
        return NextResponse.json(
          { success: false, error: 'Service category not found' },
          { status: 404 }
        )
      }
    }

    const service = await prisma.service.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.tagline !== undefined && { tagline: body.tagline || null }),
        ...(body.price !== undefined && { price: parseNumber(body.price) }),
        ...(body.priceType !== undefined && { priceType: body.priceType || 'FIXED' }),
        ...(body.duration !== undefined && { duration: parseNumber(body.duration) }),
        ...(body.bufferTime !== undefined && { bufferTime: parseNumber(body.bufferTime) }),
        ...(body.categoryId !== undefined && { categoryId: body.categoryId || null }),
        ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl || null }),
        ...(body.requiresApproval !== undefined && {
          requiresApproval: Boolean(body.requiresApproval),
        }),
        ...(body.requiresDeposit !== undefined && {
          requiresDeposit: Boolean(body.requiresDeposit),
        }),
        ...(body.depositAmount !== undefined && {
          depositAmount: body.depositAmount ? parseNumber(body.depositAmount) : null,
        }),
        ...(body.maxAdvanceBookingDays !== undefined && {
          maxAdvanceBookingDays: body.maxAdvanceBookingDays
            ? parseNumber(body.maxAdvanceBookingDays)
            : null,
        }),
        ...(body.featured !== undefined && { featured: Boolean(body.featured) }),
        ...(body.active !== undefined && { active: Boolean(body.active) }),
        ...(body.useBusinessHours !== undefined && {
          useBusinessHours: Boolean(body.useBusinessHours),
        }),
        ...(body.availableDays !== undefined && { availableDays: body.availableDays }),
        ...(body.customAvailability !== undefined && {
          customAvailability: body.customAvailability || null,
        }),
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: { service },
      message: 'Service updated successfully',
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Update service error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update service' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { service } = await requireServiceRole(user.id, id, ['ADMIN', 'MANAGER'])

    const result = await prisma.service.deleteMany({
      where: {
        id,
        businessId: service.businessId,
      },
    })

    if (result.count !== 1) {
      return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Service deleted successfully',
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Delete service error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete service' }, { status: 500 })
  }
}
