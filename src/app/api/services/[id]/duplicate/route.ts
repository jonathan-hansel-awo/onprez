import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { JsonValue } from '@prisma/client/runtime/library'

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    // Get original service
    const original = await prisma.service.findUnique({
      where: { id },
      include: {
        business: {
          select: { ownerId: true },
        },
        variants: true,
      },
    })

    if (!original) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    if (original.business.ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get max order for new service
    const maxOrder = await prisma.service.findFirst({
      where: { businessId: original.businessId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    // Create duplicate
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
        featured: false, // Don't copy featured status
        active: false, // Start as inactive
        order: (maxOrder?.order || 0) + 1,
        preparationNotes: original.preparationNotes,
        aftercareNotes: original.aftercareNotes,
      },
    })

    // Duplicate variants
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

    return NextResponse.json(duplicate)
  } catch (error) {
    console.error('Duplicate service error:', error)
    return NextResponse.json({ error: 'Failed to duplicate service' }, { status: 500 })
  }
}
