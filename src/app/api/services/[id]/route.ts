import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get service and verify ownership
    const service = await prisma.service.findFirst({
      where: {
        id,
        business: {
          ownerId: user.id,
        },
      },
      include: {
        category: true,
      },
    })

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { service },
    })
  } catch (error) {
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

    const body = await request.json()
    const {
      name,
      description,
      tagline,
      price,
      priceType,
      duration,
      bufferTime,
      categoryId,
      imageUrl,
      requiresApproval,
      requiresDeposit,
      depositAmount,
      maxAdvanceBookingDays,
      featured,
      active,
    } = body

    // Verify ownership
    const existingService = await prisma.service.findFirst({
      where: {
        id,
        business: {
          ownerId: user.id,
        },
      },
    })

    if (!existingService) {
      return NextResponse.json(
        { success: false, error: 'Service not found or access denied' },
        { status: 404 }
      )
    }

    // Update service
    const service = await prisma.service.update({
      where: { id },
      data: {
        name,
        description: description || null,
        tagline: tagline || null,
        price: parseFloat(price),
        priceType: priceType || 'FIXED',
        duration: parseInt(duration),
        bufferTime: bufferTime ? parseInt(bufferTime) : 0,
        categoryId: categoryId || null,
        imageUrl: imageUrl || null,
        requiresApproval: requiresApproval || false,
        requiresDeposit: requiresDeposit || false,
        depositAmount: depositAmount ? parseFloat(depositAmount) : null,
        maxAdvanceBookingDays: maxAdvanceBookingDays ? parseInt(maxAdvanceBookingDays) : null,
        featured: featured || false,
        active: active !== undefined ? active : true,
        useBusinessHours: body.useBusinessHours ?? true,
        availableDays: body.availableDays || [0, 1, 2, 3, 4, 5, 6],
        customAvailability: body.customAvailability || null,
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

    // Verify ownership
    const service = await prisma.service.findFirst({
      where: {
        id,
        business: {
          ownerId: user.id,
        },
      },
    })

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found or access denied' },
        { status: 404 }
      )
    }

    // Delete service
    await prisma.service.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Service deleted successfully',
    })
  } catch (error) {
    console.error('Delete service error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete service' }, { status: 500 })
  }
}
