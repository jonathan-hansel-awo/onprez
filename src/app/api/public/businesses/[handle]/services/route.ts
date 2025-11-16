/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }  // Changed to Promise
) {
  try {
    const { handle } = await params  // Add await here
    const searchParams = request.nextUrl.searchParams
    const idsParam = searchParams.get('ids')

    // Find business by slug/handle
    const business = await prisma.business.findUnique({
      where: { slug: handle },
    })

    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      )
    }

    // Build query
    const where: any = {
      businessId: business.id,
      isActive: true,
    }

    // If specific service IDs are provided, filter by them
    if (idsParam) {
      const ids = idsParam.split(',').filter(Boolean)
      if (ids.length > 0) {
        where.id = { in: ids }
      }
    }

    // Fetch services
    const services = await prisma.service.findMany({
      where,
      orderBy: {
        order: 'asc',
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        duration: true,
        category: true,
        imageUrl: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: { services },
    })
  } catch (error) {
    console.error('Fetch public services error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch services' },
      { status: 500 }
    )
  }
}
