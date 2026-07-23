import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { platformAdminErrorResponse, requirePlatformAdminApi } from '@/lib/admin/access'
import { recordAdminAction } from '@/lib/admin/audit'

const nullableText = (max: number) => z.string().trim().max(max).optional().nullable()

const updateBusinessSchema = z.object({
  name: z.string().trim().min(1).max(120),
  tagline: nullableText(180),
  description: nullableText(5000),
  email: z.union([z.string().trim().email(), z.literal('')]).optional().nullable(),
  phone: nullableText(50),
  website: z.union([z.string().trim().url(), z.literal('')]).optional().nullable(),
  address: nullableText(250),
  city: nullableText(120),
  state: nullableText(120),
  zipCode: nullableText(30),
  country: nullableText(120),
  logoUrl: z.union([z.string().trim().url(), z.literal('')]).optional().nullable(),
  coverImageUrl: z.union([z.string().trim().url(), z.literal('')]).optional().nullable(),
})

function emptyToNull(value: string | null | undefined) {
  return value?.trim() ? value.trim() : null
}

type RouteContext = { params: Promise<{ businessId: string }> }

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    await requirePlatformAdminApi()
    const { businessId } = await params

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        tagline: true,
        description: true,
        email: true,
        phone: true,
        website: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        logoUrl: true,
        coverImageUrl: true,
        isPublished: true,
        isActive: true,
        owner: { select: { email: true } },
      },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: { business } })
  } catch (error) {
    const authResponse = platformAdminErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Admin get business error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load business' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requirePlatformAdminApi()
    const { businessId } = await params
    const parsed = updateBusinessSchema.safeParse(await request.json())

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Please correct the invalid business fields.' },
        { status: 400 }
      )
    }

    const exists = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true },
    })

    if (!exists) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const input = parsed.data
    const business = await prisma.business.update({
      where: { id: businessId },
      data: {
        name: input.name,
        tagline: emptyToNull(input.tagline),
        description: emptyToNull(input.description),
        email: emptyToNull(input.email),
        phone: emptyToNull(input.phone),
        website: emptyToNull(input.website),
        address: emptyToNull(input.address),
        city: emptyToNull(input.city),
        state: emptyToNull(input.state),
        zipCode: emptyToNull(input.zipCode),
        country: emptyToNull(input.country),
        logoUrl: emptyToNull(input.logoUrl),
        coverImageUrl: emptyToNull(input.coverImageUrl),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        tagline: true,
        description: true,
        email: true,
        phone: true,
        website: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        logoUrl: true,
        coverImageUrl: true,
      },
    })

    await recordAdminAction({
      adminUserId: admin.id,
      action: 'admin.business.profile_updated',
      targetBusinessId: businessId,
      request,
      details: { changedFields: Object.keys(input) },
    })

    return NextResponse.json({ success: true, data: { business } })
  } catch (error) {
    const authResponse = platformAdminErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Admin update business error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update business' }, { status: 500 })
  }
}
