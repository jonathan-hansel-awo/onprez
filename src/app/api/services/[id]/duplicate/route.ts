import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { JsonValue } from '@prisma/client/runtime/library'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { requireServiceRole } from '@/lib/auth/service-access'

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const { service: serviceAccess } = await requireServiceRole(user.id, id, ['ADMIN', 'MANAGER'])

    const original = await prisma.service.findFirst({
      where: {
        id,
        businessId: serviceAccess.businessId,
      },
      include: {
        variants: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!original) {
      return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 })
    }

    const maxOrder = await prisma.service.findFirst({
      where: { businessId: original.businessId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const duplicate = await prisma.service.create({
      data: {
        businessId: original.businessId,
        name: `${original.name} (Copy)`,
        description: original.description,
        tagline: original.tagline,
        price: original.price,
        priceType: original.priceType,
        priceRangeMin: original.priceRangeMin,
        priceRangeMax: original.priceRangeMax,
        currency: original.currency,
        duration: original.duration,
        bufferTime: original.bufferTime,
        categoryId: original.categoryId,
        imageUrl: original.imageUrl,
        galleryImages: original.galleryImages,
        requiresApproval: original.requiresApproval,
        requiresDeposit: original.requiresDeposit,
        depositAmount: original.depositAmount,
        maxAdvanceBookingDays: original.maxAdvanceBookingDays,
        useBusinessHours: original.useBusinessHours,
        customAvailability: original.customAvailability as JsonValue[],
        availableDays: original.availableDays,
        featured: false,
        active: false,
        order: (maxOrder?.order ?? -1) + 1,
        preparationNotes: original.preparationNotes,
        aftercareNotes: original.aftercareNotes,
      },
    })

    if (original.variants.length > 0) {
      await prisma.serviceVariant.createMany({
        data: original.variants.map((variant, index) => ({
          serviceId: duplicate.id,
          name: variant.name,
          description: variant.description,
          priceAdjustment: variant.priceAdjustment,
          durationAdjustment: variant.durationAdjustment,
          type: variant.type,
          isDefault: variant.isDefault,
          order: index,
          active: variant.active,
        })),
      })
    }

    return NextResponse.json({
      success: true,
      data: { service: duplicate },
      message: 'Service duplicated successfully',
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Duplicate service error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to duplicate service' },
      { status: 500 }
    )
  }
}
