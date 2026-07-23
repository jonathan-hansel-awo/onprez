import { FeatureKey, ServiceDepositMode, StripeConnectedAccountStatus } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import {
  readBookingProtectionDefaults,
  resolveEffectiveServiceDeposit,
} from '@/lib/booking-protection/config'
import { isFeatureEntitlementActive } from '@/lib/features/entitlements'
import { prisma } from '@/lib/prisma'

function parseIds(idsParam: string | null) {
  if (!idsParam) return undefined

  const ids = idsParam
    .split(',')
    .map(id => id.trim())
    .filter(Boolean)
    .slice(0, 50)

  return ids.length > 0 ? ids : undefined
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params
    const searchParams = request.nextUrl.searchParams

    if (!handle || handle.length > 100) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const ids = parseIds(searchParams.get('ids'))
    const categoryId = searchParams.get('categoryId')?.trim()
    const featured = searchParams.get('featured')

    const business = await prisma.business.findUnique({
      where: { slug: handle },
      select: {
        id: true,
        isPublished: true,
        settings: true,
        featureEntitlements: {
          where: { feature: FeatureKey.BOOKING_DEPOSITS },
          take: 1,
        },
        stripeConnectedAccount: {
          select: { status: true, chargesEnabled: true, payoutsEnabled: true },
        },
      },
    })

    if (!business || !business.isPublished) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const where: {
      businessId: string
      active: boolean
      id?: { in: string[] }
      categoryId?: string
      featured?: boolean
    } = {
      businessId: business.id,
      active: true,
    }

    if (ids) {
      where.id = { in: ids }
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (featured === 'true') {
      where.featured = true
    }

    const services = await prisma.service.findMany({
      where,
      orderBy: [{ featured: 'desc' }, { order: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true,
        tagline: true,
        price: true,
        priceType: true,
        priceRangeMin: true,
        priceRangeMax: true,
        currency: true,
        duration: true,
        bufferTime: true,
        imageUrl: true,
        featured: true,
        requiresDeposit: true,
        depositMode: true,
        depositAmount: true,
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    })

    const categories = await prisma.serviceCategory.findMany({
      where: {
        businessId: business.id,
        services: {
          some: {
            active: true,
          },
        },
      },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        color: true,
        icon: true,
        _count: {
          select: {
            services: {
              where: { active: true },
            },
          },
        },
      },
    })

    const entitlement = business.featureEntitlements?.[0] ?? null
    const entitled = isFeatureEntitlementActive(entitlement)
    const account = business.stripeConnectedAccount ?? null
    const stripeReady = Boolean(
      account &&
      account.status === StripeConnectedAccountStatus.READY &&
      account.chargesEnabled &&
      account.payoutsEnabled
    )
    const bookingProtectionDefaults = readBookingProtectionDefaults(business.settings)

    const transformedServices = services.map(service => {
      const price = Number(service.price)
      const effectiveDeposit = resolveEffectiveServiceDeposit({
        mode: service.depositMode || ServiceDepositMode.BUSINESS_DEFAULT,
        customDepositAmount: service.depositAmount ? Number(service.depositAmount) : null,
        servicePrice: price,
        defaults: bookingProtectionDefaults,
        entitled,
        stripeReady,
      })

      return {
        id: service.id,
        name: service.name,
        description: service.description,
        tagline: service.tagline,
        price,
        priceType: service.priceType,
        priceRangeMin: service.priceRangeMin ? Number(service.priceRangeMin) : null,
        priceRangeMax: service.priceRangeMax ? Number(service.priceRangeMax) : null,
        currency: service.currency,
        duration: service.duration,
        bufferTime: service.bufferTime,
        imageUrl: service.imageUrl,
        featured: service.featured,
        requiresDeposit: effectiveDeposit.requiresDeposit,
        depositAmount: effectiveDeposit.depositAmount,
        remainingAmount: effectiveDeposit.remainingAmount,
        cancellationWindowHours: effectiveDeposit.cancellationWindowHours,
        depositDeductedFromTotal: true,
        category: service.category,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        services: transformedServices,
        categories: categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          color: cat.color,
          icon: cat.icon,
          serviceCount: cat._count.services,
        })),
        total: transformedServices.length,
      },
    })
  } catch (error) {
    console.error('Fetch public services error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch services' }, { status: 500 })
  }
}
