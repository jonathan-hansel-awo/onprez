import { NextRequest, NextResponse } from 'next/server'
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

    if (!handle || handle.length > 100) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const business = await prisma.business.findUnique({
      where: { slug: handle },
      select: { id: true, isPublished: true },
    })

    if (!business || !business.isPublished) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const ids = parseIds(request.nextUrl.searchParams.get('ids'))
    const services = await prisma.service.findMany({
      where: {
        businessId: business.id,
        active: true,
        ...(ids ? { id: { in: ids } } : {}),
      },
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
        imageUrl: true,
        category: { select: { name: true } },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        services: services.map(service => ({
          ...service,
          price: Number(service.price),
          priceRangeMin:
            service.priceRangeMin === null ? null : Number(service.priceRangeMin),
          priceRangeMax:
            service.priceRangeMax === null ? null : Number(service.priceRangeMax),
        })),
      },
    })
  } catch (error) {
    console.error('Fetch presence services error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch services' }, { status: 500 })
  }
}
