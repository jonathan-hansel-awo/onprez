import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'Business ID is required' },
        { status: 400 }
      )
    }

    // Verify user owns the business
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        ownerId: user.id,
      },
    })

    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found or access denied' },
        { status: 404 }
      )
    }

    // Fetch categories with service count
    const categories = await prisma.serviceCategory.findMany({
      where: {
        businessId: businessId,
      },
      include: {
        _count: {
          select: { services: true },
        },
      },
      orderBy: {
        order: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      data: { categories },
    })
  } catch (error) {
    console.error('Fetch categories error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { businessId, name, description, color, icon } = body

    // Verify user owns the business
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        ownerId: user.id,
      },
    })

    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found or access denied' },
        { status: 404 }
      )
    }

    // Validate required fields
    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 })
    }

    // Check for duplicate category name
    const existingCategory = await prisma.serviceCategory.findFirst({
      where: {
        businessId,
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    })

    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'A category with this name already exists' },
        { status: 400 }
      )
    }

    // Get current max order
    const maxOrderCategory = await prisma.serviceCategory.findFirst({
      where: { businessId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const newOrder = (maxOrderCategory?.order || 0) + 1

    // Create category
    const category = await prisma.serviceCategory.create({
      data: {
        businessId,
        name,
        description: description || null,
        color: color || null,
        icon: icon || null,
        order: newOrder,
      },
      include: {
        _count: {
          select: { services: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: { category },
      message: 'Category created successfully',
    })
  } catch (error) {
    console.error('Create category error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
