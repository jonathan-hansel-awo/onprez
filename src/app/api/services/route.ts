import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'

// GET - List all services for a business
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')
    const slug = searchParams.get('slug')
    const activeOnly = searchParams.get('active') !== 'false'

    if (!businessId && !slug) {
      return NextResponse.json(
        { success: false, error: 'Business ID or slug required' },
        { status: 400 }
      )
    }

    const services = await prisma.service.findMany({
      where: {
        business: businessId ? { id: businessId } : { slug: slug! },
        ...(activeOnly && { active: true }),
      },
      include: {
        category: true,
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json({
      success: true,
      data: services,
    })
  } catch (error) {
    console.error('List services error:', error)
    return NextResponse.json({ success: false, error: 'Failed to list services' }, { status: 500 })
  }
}

// POST - Create a new service
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { businessId, ...serviceData } = body

    // Verify ownership
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        ownerId: user.id,
      },
    })

    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found or unauthorized' },
        { status: 403 }
      )
    }

    // Get next order number
    const lastService = await prisma.service.findFirst({
      where: { businessId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const service = await prisma.service.create({
      data: {
        ...serviceData,
        businessId,
        price: parseFloat(serviceData.price),
        duration: parseInt(serviceData.duration),
        bufferTime: serviceData.bufferTime ? parseInt(serviceData.bufferTime) : 0,
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
    console.error('Create service error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create service' }, { status: 500 })
  }
}
