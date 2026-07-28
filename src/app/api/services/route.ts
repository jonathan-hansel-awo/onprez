import { randomUUID } from 'node:crypto'
import {
  FeatureKey,
  PriceType,
  ServiceDepositMode,
  StripeConnectedAccountStatus,
} from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  readBookingProtectionDefaults,
  resolveEffectiveServiceDeposit,
} from '@/lib/booking-protection/config'
import { isFeatureEntitlementActive } from '@/lib/features/entitlements'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import {
  businessAuthErrorResponse,
  requireBusinessAccess,
  requireBusinessRole,
} from '@/lib/auth/business-access'

const nullableInteger = z.preprocess(
  value => (value === '' || value === null || value === undefined ? null : value),
  z.coerce.number().int().min(-1).max(3650).nullable()
)

const createServiceSchema = z.object({
  businessId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(5000).optional().nullable(),
  tagline: z.string().trim().max(100).optional().nullable(),
  price: z.preprocess(
    value => (value === '' || value === null || value === undefined ? 0 : value),
    z.coerce.number().min(0).max(1000000)
  ),
  priceType: z.enum(PriceType).optional().default(PriceType.FIXED),
  duration: z.coerce.number().int().min(5).max(1440),
  bufferTime: z.coerce.number().int().min(0).max(1440).optional().default(0),
  categoryId: z.string().trim().optional().nullable(),
  imageUrl: z
    .union([z.string().trim().url(), z.literal('')])
    .optional()
    .nullable(),
  requiresApproval: z.boolean().optional().default(false),
  maxAdvanceBookingDays: nullableInteger.optional().default(null),
  featured: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true),
})

function getPrismaErrorCode(error: unknown) {
  if (!error || typeof error !== 'object' || !('code' in error)) return undefined
  return typeof error.code === 'string' ? error.code : undefined
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

    const parsed = createServiceSchema.safeParse(await request.json())

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          code: 'INVALID_SERVICE',
          error: 'Please check the service name, price, duration, and optional settings.',
        },
        { status: 400 }
      )
    }

    const input = parsed.data
    const businessId = input.businessId
    const context = await requireBusinessRole(user.id, businessId, ['ADMIN', 'MANAGER'])
    const categoryId = input.categoryId || null

    if (categoryId) {
      const category = await prisma.serviceCategory.findFirst({
        where: {
          id: categoryId,
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
        businessId: context.businessId,
        name: input.name,
        description: input.description?.trim() || null,
        tagline: input.tagline?.trim() || null,
        price: input.price,
        priceType: input.priceType,
        duration: input.duration,
        bufferTime: input.bufferTime,
        categoryId,
        imageUrl: input.imageUrl?.trim() || null,
        galleryImages: [],
        requiresApproval: input.requiresApproval,
        depositMode: ServiceDepositMode.BUSINESS_DEFAULT,
        requiresDeposit: false,
        depositAmount: null,
        maxAdvanceBookingDays: input.maxAdvanceBookingDays,
        featured: input.featured,
        active: input.active,
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

    const reference = randomUUID()
    const errorCode = getPrismaErrorCode(error)

    console.error('Create service error:', {
      reference,
      errorCode,
      path: request.nextUrl.pathname,
      error,
    })

    if (errorCode === 'P2021' || errorCode === 'P2022') {
      return NextResponse.json(
        {
          success: false,
          code: 'SERVICE_SCHEMA_OUT_OF_DATE',
          error: `The service database schema is out of date. Apply pending migrations and try again. Reference: ${reference}`,
        },
        { status: 503 }
      )
    }

    if (errorCode === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          code: 'SERVICE_ORDER_CONFLICT',
          error: 'Another service was created at the same time. Please try again.',
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        code: 'SERVICE_CREATE_FAILED',
        error: `Failed to create service. Reference: ${reference}`,
      },
      { status: 500 }
    )
  }
}
