import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { requireServiceVariantRole } from '@/lib/auth/service-access'
import { VariantType } from '@prisma/client'

const updateVariantSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional().nullable(),
  priceAdjustment: z.coerce.number().default(0),
  durationAdjustment: z.coerce.number().int().default(0),
  type: z.nativeEnum(VariantType).optional(),
  isDefault: z.boolean().optional(),
  active: z.boolean().optional(),
})

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

    const { variant } = await requireServiceVariantRole(user.id, serviceId, variantId, [
      'ADMIN',
      'MANAGER',
    ])

    const body = await request.json()
    const validation = updateVariantSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { name, description, priceAdjustment, durationAdjustment, type, isDefault, active } =
      validation.data

    const nextType = type

    if (isDefault === true) {
      await prisma.serviceVariant.updateMany({
        where: {
          serviceId,
          type: nextType,
          isDefault: true,
          id: { not: variantId },
        },
        data: { isDefault: false },
      })
    }

    const updatedVariant = await prisma.serviceVariant.update({
      where: { id: variantId },
      data: {
        name,
        description: description || null,
        priceAdjustment,
        durationAdjustment,
        type: nextType,
        ...(isDefault !== undefined && { isDefault }),
        ...(active !== undefined && { active }),
      },
    })

    return NextResponse.json({
      success: true,
      data: { variant: updatedVariant },
      message: 'Variant updated successfully',
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Update variant error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update variant' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const { id: serviceId, variantId } = await context.params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await requireServiceVariantRole(user.id, serviceId, variantId, ['ADMIN', 'MANAGER'])

    const result = await prisma.serviceVariant.deleteMany({
      where: {
        id: variantId,
        serviceId,
      },
    })

    if (result.count !== 1) {
      return NextResponse.json({ success: false, error: 'Variant not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Variant deleted successfully',
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Delete variant error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete variant' }, { status: 500 })
  }
}
