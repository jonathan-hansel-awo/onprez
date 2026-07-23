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
  active: z.boolean(),
  featured: z.boolean(),
})

type RouteContext = { params: Promise<{ businessId: string; serviceId: string }> }

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requirePlatformAdminApi()
    const { businessId, serviceId } = await params
    const parsed = serviceSchema.safeParse(await request.json())

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Please provide valid service details.' },
        { status: 400 }
      )
    }

    const existing = await prisma.service.findFirst({
      where: { id: serviceId, businessId },
      select: { id: true },
    })

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 })
    }

    const input = parsed.data
    const service = await prisma.service.update({
      where: { id: serviceId },
      data: {
        name: input.name,
        description: input.description?.trim() || null,
        price: input.price,
        duration: input.duration,
        imageUrl: input.imageUrl?.trim() || null,
        active: input.active,
        featured: input.featured,
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
      action: 'admin.service.updated',
      targetBusinessId: businessId,
      request,
      details: { serviceId, serviceName: service.name },
    })

    return NextResponse.json({
      success: true,
      data: {
        service: {
          ...service,
          price: Number(service.price),
          depositAmount: service.depositAmount === null ? null : Number(service.depositAmount),
        },
      },
    })
  } catch (error) {
    const authResponse = platformAdminErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Admin update service error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update service' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requirePlatformAdminApi()
    const { businessId, serviceId } = await params

    const service = await prisma.service.findFirst({
      where: { id: serviceId, businessId },
      select: { id: true, name: true, _count: { select: { appointments: true } } },
    })

    if (!service) {
      return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 })
    }

    if (service._count.appointments > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'This service has appointment history. Hide it instead of deleting it.',
        },
        { status: 409 }
      )
    }

    await prisma.service.delete({ where: { id: serviceId } })

    await recordAdminAction({
      adminUserId: admin.id,
      action: 'admin.service.deleted',
      targetBusinessId: businessId,
      request,
      details: { serviceId, serviceName: service.name },
      severity: 'warning',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const authResponse = platformAdminErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Admin delete service error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete service' }, { status: 500 })
  }
}
