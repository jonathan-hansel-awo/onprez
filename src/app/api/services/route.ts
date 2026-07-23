import { FeatureKey, ServiceDepositMode, StripeConnectedAccountStatus } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import {
  readBookingProtectionDefaults,
  resolveEffectiveServiceDeposit,
} from '@/lib/booking-protection/config'
import { isFeatureEntitlementActive } from '@/lib/features/entitlements'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse, requireBusinessAccess } from '@/lib/auth/business-access'
import { requireBusinessRole } from '@/lib/auth/business-access'

function parseNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')
    const slug = searchParams.get('slug')
    const includeInactive = searchParams.get('active') === 'false'

    if (!businessId && !slug) {
      return NextResponse.json(
        { success: false, error: 'Business ID or slug required' },
        { status: 400 }
      )
    }

    const business = await prisma.business.findFirst({
      where: businessId ? { id: businessId } : { slug: slug! },
      select: {
        id: true,
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

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    if (includeInactive) {
      const user = await getCurrentUser()

      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }

      await requireBusinessAccess(user.id, business.id)
    }

    const services = await prisma.service.findMany({
      where: {
        businessId: business.id,
        ...(includeInactive ? {} : { active: true }),
      },
      include: {
        category: true,
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
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
    const defaults = readBookingProtectionDefaults(business.settings)

    return NextResponse.json({
      success: true,
      data: services.map(service => {
        const price = Number(service.price)
        const effectiveDeposit = resolveEffectiveServiceDeposit({
          mode: service.depositMode || ServiceDepositMode.BUSINESS_DEFAULT,
          customDepositAmount:
            service.depositAmount === null ? null : Number(service.depositAmount),
          servicePrice: price,
          defaults,
          entitled,
          stripeReady,
        })

        return {
          ...service,
          price,
          priceRangeMin: service.priceRangeMin === null ? null : Number(service.priceRangeMin),
          priceRangeMax: service.priceRangeMax === null ? null : Number(service.priceRangeMax),
          requiresDeposit: effectiveDeposit.requiresDeposit,
          depositAmount: effectiveDeposit.depositAmount,
          remainingAmount: effectiveDeposit.remainingAmount,
          cancellationWindowHours: effectiveDeposit.cancellationWindowHours,
          depositDeductedFromTotal: true,
        }
      }),
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('List services error:', error)
    return NextResponse.json({ success: false, error: 'Failed to list services' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { businessId, ...serviceData } = body

    if (!businessId || typeof businessId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Business ID is required' },
        { status: 400 }
      )
    }

    const context = await requireBusinessRole(user.id, businessId, ['ADMIN', 'MANAGER'])

    if (serviceData.categoryId) {
      const category = await prisma.serviceCategory.findFirst({
        where: {
          id: serviceData.categoryId,
          businessId: context.businessId,
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

    const lastService = await prisma.service.findFirst({
      where: { businessId: context.businessId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const service = await prisma.service.create({
      data: {
        ...serviceData,
        businessId: context.businessId,
        depositMode: ServiceDepositMode.BUSINESS_DEFAULT,
        requiresDeposit: false,
        depositAmount: null,
        price: parseNumber(serviceData.price),
        duration: parseNumber(serviceData.duration),
        bufferTime: serviceData.bufferTime ? parseNumber(serviceData.bufferTime) : 0,
        order: (lastService?.order ?? -1) + 1,
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: { service },
        message: 'Service created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Create service error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create service' }, { status: 500 })
  }
}
