import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: serviceId } = await context.params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Verify service exists and user has access
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { business: true },
    })

    if (!service) {
      return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 })
    }

    if (service.business.ownerId !== user.id) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    // Fetch variants
    const variants = await prisma.serviceVariant.findMany({
      where: { serviceId },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: { variants },
    })
  } catch (error) {
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

    // Verify service exists and user has access
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { business: true },
    })

    if (!service) {
      return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 })
    }

    if (service.business.ownerId !== user.id) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, priceAdjustment, durationAdjustment, type, isDefault } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 })
    }

    // Get current max order
    const maxOrderVariant = await prisma.serviceVariant.findFirst({
      where: { serviceId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const newOrder = (maxOrderVariant?.order || 0) + 1

    // If this is set as default, unset other defaults of the same type
    if (isDefault) {
      await prisma.serviceVariant.updateMany({
        where: {
          serviceId,
          type: type || 'OPTION',
          isDefault: true,
        },
        data: { isDefault: false },
      })
    }

    // Create variant
    const variant = await prisma.serviceVariant.create({
      data: {
        serviceId,
        name,
        description: description || null,
        priceAdjustment: parseFloat(priceAdjustment || '0'),
        durationAdjustment: parseInt(durationAdjustment || '0'),
        type: type || 'OPTION',
        isDefault: isDefault || false,
        order: newOrder,
      },
    })

    return NextResponse.json({
      success: true,
      data: { variant },
      message: 'Variant created successfully',
    })
  } catch (error) {
    console.error('Create variant error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create variant' }, { status: 500 })
  }
}
