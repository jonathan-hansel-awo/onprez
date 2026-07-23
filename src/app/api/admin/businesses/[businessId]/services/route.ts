import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { platformAdminErrorResponse, requirePlatformAdminApi } from '@/lib/admin/access'
import { recordAdminAction } from '@/lib/admin/audit'

const serviceSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(5000).optional().nullable(),
  price: z.coerce.number().min(0).max(1000000),
  duration: z.coerce.number().int().min(5).max(1440),
  imageUrl: z.union([z.string().trim().url(), z.literal('')]).optional().nullable(),
  active: z.boolean().optional().default(true),
  featured: z.boolean().optional().default(false),
})

function serializeService<T extends { price: unknown; depositAmount?: unknown }>(service: T) {
  return {
    ...service,
    price: Number(service.price),
    depositAmount:
      service.depositAmount === null || service.depositAmount === undefined
        ? null
        : Number(service.depositAmount),
  }
}

type RouteContext = { params: Promise<{ businessId: string }> }

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    await requirePlatformAdminApi()
    const { businessId } = await params

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const services = await prisma.service.findMany({
      where: { businessId },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        duration: true,
        imageUrl: true,
        active: true,
        featured: true,
        order: true,
        depositAmount: true,
        _count: { select: { appointments: true } },
      },
    })

    return NextResponse.json({
      success: true,
      data: { services: services.map(serializeService) },
    })
  } catch (error) {
    const authResponse = platformAdminErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Admin list services error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load services' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requirePlatformAdminApi()
    const { businessId } = await params
    const parsed = serviceSchema.safeParse(await request.json())

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid service name, price, and duration.' },
        { status: 400 }
      )
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const lastService = await prisma.service.findFirst({
      where: { businessId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const input = parsed.data
    const service = await prisma.service.create({
      data: {
        businessId,
        name: input.name,
        description: input.description?.trim() || null,
        price: input.price,
        duration: input.duration,
        imageUrl: input.imageUrl?.trim() || null,
        active: input.active,
        featured: input.featured,
        order: (lastService?.order ?? -1) + 1,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        duration: true,
        imageUrl: true,
        active: true,
        featured: true,
        order: true,
        depositAmount: true,
        _count: { select: { appointments: true } },
      },
    })

    await recordAdminAction({
      adminUserId: admin.id,
      action: 'admin.service.created',
      targetBusinessId: businessId,
      request,
      details: { serviceId: service.id, serviceName: service.name },
    })

    return NextResponse.json(
      { success: true, data: { service: serializeService(service) } },
      { status: 201 }
    )
  } catch (error) {
    const authResponse = platformAdminErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Admin create service error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create service' }, { status: 500 })
  }
}
