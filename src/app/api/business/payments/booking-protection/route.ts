import {
  FeatureKey,
  Prisma,
  ServiceDepositMode,
  StripeConnectedAccountStatus,
} from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { resolveWritableBusinessContext } from '@/lib/auth/business-route-utils'
import {
  DEFAULT_BOOKING_PROTECTION,
  mergeBookingProtectionDefaults,
  readBookingProtectionDefaults,
  resolveEffectiveServiceDeposit,
  type BookingProtectionDefaults,
} from '@/lib/booking-protection/config'
import {
  getFeatureEntitlement,
  isFeatureEntitlementActive,
  requireFeatureEntitlement,
} from '@/lib/features/entitlements'
import { prisma } from '@/lib/prisma'

const defaultsSchema = z.object({
  enabled: z.boolean(),
  depositAmount: z.number().positive().max(10_000),
  cancellationWindowHours: z.number().int().min(1).max(168),
})

const serviceRuleSchema = z.object({
  serviceId: z.string().min(1).max(128),
  mode: z.nativeEnum(ServiceDepositMode),
  customDepositAmount: z.number().positive().max(10_000).nullable(),
})

const updateSchema = z.object({
  businessId: z.string().min(1).max(128).optional(),
  defaults: defaultsSchema,
  services: z.array(serviceRuleSchema).max(250),
})

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true

  try {
    return new URL(origin).origin === request.nextUrl.origin
  } catch {
    return false
  }
}

function accountIsReady(
  account: {
    status: StripeConnectedAccountStatus
    chargesEnabled: boolean
    payoutsEnabled: boolean
  } | null
): boolean {
  return Boolean(
    account &&
    account.status === StripeConnectedAccountStatus.READY &&
    account.chargesEnabled &&
    account.payoutsEnabled
  )
}

function serializeService(
  service: {
    id: string
    name: string
    price: Prisma.Decimal
    priceType: string
    depositMode: ServiceDepositMode
    depositAmount: Prisma.Decimal | null
  },
  defaults: BookingProtectionDefaults,
  entitled: boolean,
  stripeReady: boolean
) {
  const price = Number(service.price)
  const effective = resolveEffectiveServiceDeposit({
    mode: service.depositMode,
    customDepositAmount: service.depositAmount === null ? null : Number(service.depositAmount),
    servicePrice: price,
    defaults,
    entitled,
    stripeReady,
  })

  return {
    id: service.id,
    name: service.name,
    price,
    priceType: service.priceType,
    mode: service.depositMode,
    customDepositAmount:
      service.depositMode === ServiceDepositMode.CUSTOM && service.depositAmount !== null
        ? Number(service.depositAmount)
        : null,
    effective,
  }
}

async function loadConfiguration(businessId: string) {
  const [business, entitlement, account] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        settings: true,
        services: {
          orderBy: [{ order: 'asc' }, { name: 'asc' }],
          select: {
            id: true,
            name: true,
            price: true,
            priceType: true,
            depositMode: true,
            depositAmount: true,
          },
        },
      },
    }),
    getFeatureEntitlement(businessId, FeatureKey.BOOKING_DEPOSITS),
    prisma.stripeConnectedAccount.findUnique({
      where: { businessId },
      select: { status: true, chargesEnabled: true, payoutsEnabled: true },
    }),
  ])

  if (!business) return null

  const entitled = isFeatureEntitlementActive(entitlement)
  const stripeReady = accountIsReady(account)
  const defaults = readBookingProtectionDefaults(business.settings)

  return {
    business: { id: business.id, name: business.name },
    entitlement: { enabled: entitled, source: entitlement?.source || null },
    stripeReady,
    canConfigure: entitled && stripeReady,
    defaults,
    services: business.services.map(service =>
      serializeService(service, defaults, entitled, stripeReady)
    ),
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const context = await resolveWritableBusinessContext(user.id, request, [])
    const configuration = await loadConfiguration(context.businessId)

    if (!configuration) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: configuration })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Get booking protection configuration error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load Booking Protection settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const validation = updateSchema.safeParse(await request.json())
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    const context = await resolveWritableBusinessContext(
      user.id,
      validation.data.businessId || request,
      []
    )
    await requireFeatureEntitlement(context.businessId, FeatureKey.BOOKING_DEPOSITS)

    const [business, account] = await Promise.all([
      prisma.business.findUnique({
        where: { id: context.businessId },
        select: { id: true, settings: true },
      }),
      prisma.stripeConnectedAccount.findUnique({
        where: { businessId: context.businessId },
        select: { status: true, chargesEnabled: true, payoutsEnabled: true },
      }),
    ])

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    if (!accountIsReady(account)) {
      return NextResponse.json(
        { success: false, error: 'Finish Stripe verification before configuring deposits' },
        { status: 409 }
      )
    }

    const serviceIds = validation.data.services.map(service => service.serviceId)
    if (new Set(serviceIds).size !== serviceIds.length) {
      return NextResponse.json(
        { success: false, error: 'Each service can only appear once' },
        { status: 400 }
      )
    }

    const services = await prisma.service.findMany({
      where: { businessId: context.businessId, id: { in: serviceIds } },
      select: { id: true, price: true },
    })

    if (services.length !== serviceIds.length) {
      return NextResponse.json(
        { success: false, error: 'One or more services could not be found' },
        { status: 404 }
      )
    }

    const priceByService = new Map(services.map(service => [service.id, Number(service.price)]))
    const defaults: BookingProtectionDefaults = {
      ...DEFAULT_BOOKING_PROTECTION,
      enabled: validation.data.defaults.enabled,
      depositAmount: validation.data.defaults.depositAmount,
      cancellationWindowHours: validation.data.defaults.cancellationWindowHours,
    }

    for (const rule of validation.data.services) {
      const price = priceByService.get(rule.serviceId) || 0
      if (rule.mode === ServiceDepositMode.CUSTOM) {
        if (rule.customDepositAmount === null || rule.customDepositAmount > price) {
          return NextResponse.json(
            {
              success: false,
              error:
                'A custom deposit must be greater than zero and no more than the service price',
              serviceId: rule.serviceId,
            },
            { status: 400 }
          )
        }
      }

      if (price <= 0 && rule.mode !== ServiceDepositMode.NONE) {
        return NextResponse.json(
          {
            success: false,
            error: 'Free services cannot require a deposit',
            serviceId: rule.serviceId,
          },
          { status: 400 }
        )
      }

      if (
        defaults.enabled &&
        rule.mode === ServiceDepositMode.BUSINESS_DEFAULT &&
        defaults.depositAmount > price
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              'The business default deposit cannot exceed a service price. Choose no deposit or a lower custom amount for this service.',
            serviceId: rule.serviceId,
          },
          { status: 400 }
        )
      }
    }

    await prisma.$transaction([
      prisma.business.update({
        where: { id: context.businessId },
        data: { settings: mergeBookingProtectionDefaults(business.settings, defaults) },
      }),
      ...validation.data.services.map(rule => {
        const price = priceByService.get(rule.serviceId) || 0
        const effective = resolveEffectiveServiceDeposit({
          mode: rule.mode,
          customDepositAmount: rule.customDepositAmount,
          servicePrice: price,
          defaults,
          entitled: true,
          stripeReady: true,
        })

        return prisma.service.update({
          where: { id: rule.serviceId },
          data: {
            depositMode: rule.mode,
            requiresDeposit: effective.requiresDeposit,
            depositAmount:
              rule.mode === ServiceDepositMode.CUSTOM ? rule.customDepositAmount : null,
          },
        })
      }),
    ])

    const configuration = await loadConfiguration(context.businessId)
    return NextResponse.json({
      success: true,
      data: configuration,
      message: 'Booking Protection settings saved',
    })
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'FEATURE_NOT_ENTITLED'
    ) {
      return NextResponse.json(
        {
          success: false,
          code: 'FEATURE_NOT_ENTITLED',
          error: 'Booking Protection is not enabled',
        },
        { status: 403 }
      )
    }

    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Update booking protection configuration error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save Booking Protection settings' },
      { status: 500 }
    )
  }
}
