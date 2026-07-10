import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { VariantType } from '@prisma/client'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { requireServiceAccess, requireServiceRole } from '@/lib/auth/service-access'

const variantSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional().nullable(),
  priceAdjustment: z.coerce.number().default(0),
  durationAdjustment: z.coerce.number().int().default(0),
  type: z.nativeEnum(VariantType).default('OPTION'),
  isDefault: z.boolean().default(false),
})

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: serviceId } = await context.params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await requireServiceAccess(user.id, serviceId)

    const variants = await prisma.serviceVariant.findMany({
      where: { serviceId },
      select: {
        id: true,
        serviceId: true,
        name: true,
        description: true,
        priceAdjustment: true,
        durationAdjustment: true,
        type: true,
        isDefault: true,
        order: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: { variants },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Fetch variants error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch variants' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: serviceId } = await context.params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await requireServiceRole(user.id, serviceId, ['ADMIN', 'MANAGER'])

    const body = await request.json()
    const validation = variantSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { name, description, priceAdjustment, durationAdjustment, type, isDefault } =
      validation.data

    const maxOrderVariant = await prisma.serviceVariant.findFirst({
      where: { serviceId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const newOrder = (maxOrderVariant?.order ?? -1) + 1

    if (isDefault) {
      await prisma.serviceVariant.updateMany({
        where: {
          serviceId,
          type,
          isDefault: true,
        },
        data: { isDefault: false },
      })
    }

    const variant = await prisma.serviceVariant.create({
      data: {
        serviceId,
        name,
        description: description || null,
        priceAdjustment,
        durationAdjustment,
        type,
        isDefault,
        order: newOrder,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: { variant },
        message: 'Variant created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Create variant error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create variant' }, { status: 500 })
  }
}
