import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const { id: serviceId, variantId } = await context.params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Verify variant exists and user has access
    const variant = await prisma.serviceVariant.findUnique({
      where: { id: variantId },
      include: {
        service: {
          include: { business: true },
        },
      },
    })

    if (!variant) {
      return NextResponse.json({ success: false, error: 'Variant not found' }, { status: 404 })
    }

    if (variant.service.business.ownerId !== user.id) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, priceAdjustment, durationAdjustment, type, isDefault, active } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 })
    }

    // If this is set as default, unset other defaults of the same type
    if (isDefault && !variant.isDefault) {
      await prisma.serviceVariant.updateMany({
        where: {
          serviceId,
          type: type || variant.type,
          isDefault: true,
          id: { not: variantId },
        },
        data: { isDefault: false },
      })
    }

    // Update variant
    const updatedVariant = await prisma.serviceVariant.update({
      where: { id: variantId },
      data: {
        name,
        description: description || null,
        priceAdjustment: parseFloat(priceAdjustment || '0'),
        durationAdjustment: parseInt(durationAdjustment || '0'),
        type: type || variant.type,
        isDefault: isDefault !== undefined ? isDefault : variant.isDefault,
        active: active !== undefined ? active : variant.active,
      },
    })

    return NextResponse.json({
      success: true,
      data: { variant: updatedVariant },
      message: 'Variant updated successfully',
    })
  } catch (error) {
    console.error('Update variant error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update variant' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const { variantId } = await context.params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Verify variant exists and user has access
    const variant = await prisma.serviceVariant.findUnique({
      where: { id: variantId },
      include: {
        service: {
          include: { business: true },
        },
      },
    })

    if (!variant) {
      return NextResponse.json({ success: false, error: 'Variant not found' }, { status: 404 })
    }

    if (variant.service.business.ownerId !== user.id) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    // Delete variant
    await prisma.serviceVariant.delete({
      where: { id: variantId },
    })

    return NextResponse.json({
      success: true,
      message: 'Variant deleted successfully',
    })
  } catch (error) {
    console.error('Delete variant error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete variant' }, { status: 500 })
  }
}
