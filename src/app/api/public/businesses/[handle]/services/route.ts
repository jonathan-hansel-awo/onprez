import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params
    const searchParams = request.nextUrl.searchParams
    const idsParam = searchParams.get('ids')
    const categoryId = searchParams.get('categoryId')
    const featured = searchParams.get('featured')

    // Find business by slug/handle
    const business = await prisma.business.findUnique({
      where: { slug: handle },
      select: { id: true, isPublished: true },
    })

    if (!business || !business.isPublished) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    // Build where clause
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

    // Filter by specific IDs if provided
    if (idsParam) {
      const ids = idsParam.split(',').filter(Boolean)
      if (ids.length > 0) {
        where.id = { in: ids }
      }
    }

    // Filter by category if provided
    if (categoryId) {
      where.categoryId = categoryId
    }

    // Filter by featured if provided
    if (featured === 'true') {
      where.featured = true
    }

    // Fetch services with category
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

    // Fetch categories for filtering
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

    // Transform services to include formatted data
    const transformedServices = services.map(service => ({
      id: service.id,
      name: service.name,
      description: service.description,
      tagline: service.tagline,
      price: Number(service.price),
      priceType: service.priceType,
      priceRangeMin: service.priceRangeMin ? Number(service.priceRangeMin) : null,
      priceRangeMax: service.priceRangeMax ? Number(service.priceRangeMax) : null,
      currency: service.currency,
      duration: service.duration,
      bufferTime: service.bufferTime,
      imageUrl: service.imageUrl,
      featured: service.featured,
      requiresDeposit: service.requiresDeposit,
      depositAmount: service.depositAmount ? Number(service.depositAmount) : null,
      category: service.category,
    }))

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
