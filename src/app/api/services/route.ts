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

    // Fetch services
    const services = await prisma.service.findMany({
      where: {
        businessId: businessId,
      },
      include: {
        category: true,
      },
      orderBy: {
        order: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      data: { services },
    })
  } catch (error) {
    console.error('Fetch services error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch services' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      businessId,
      name,
      description,
      tagline,
      price,
      priceType,
      duration,
      bufferTime,
      categoryId,
      imageUrl,
      requiresApproval,
      requiresDeposit,
      depositAmount,
      maxAdvanceBookingDays,
      featured,
      active,
    } = body

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
    if (!name || !price || !duration) {
      return NextResponse.json(
        { success: false, error: 'Name, price, and duration are required' },
        { status: 400 }
      )
    }

    // Get current max order
    const maxOrderService = await prisma.service.findFirst({
      where: { businessId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const newOrder = (maxOrderService?.order || 0) + 1

    // Create service
    const service = await prisma.service.create({
      data: {
        businessId,
        name,
        description: description || null,
        tagline: tagline || null,
        price: parseFloat(price),
        priceType: priceType || 'FIXED',
        duration: parseInt(duration),
        bufferTime: bufferTime ? parseInt(bufferTime) : 0,
        categoryId: categoryId || null,
        imageUrl: imageUrl || null,
        requiresApproval: requiresApproval || false,
        requiresDeposit: requiresDeposit || false,
        depositAmount: depositAmount ? parseFloat(depositAmount) : null,
        maxAdvanceBookingDays: maxAdvanceBookingDays ? parseInt(maxAdvanceBookingDays) : null,
        featured: featured || false,
        active: active !== undefined ? active : true,
        order: newOrder,
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: { service },
      message: 'Service created successfully',
    })
  } catch (error) {
    console.error('Create service error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create service' }, { status: 500 })
  }
}
