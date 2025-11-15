import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { Prisma } from '@prisma/client'

// GET - Fetch pages for a business
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const businessId = searchParams.get('businessId')
    const slug = searchParams.get('slug')

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

    // Fetch pages
    const where: Prisma.PageWhereInput = { businessId }
    if (slug) {
      where.slug = slug
    }

    const pages = await prisma.page.findMany({
      where,
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: { pages },
    })
  } catch (error) {
    console.error('Fetch pages error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch pages' }, { status: 500 })
  }
}

// PUT - Update page content
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { pageId, businessId, content } = await request.json()

    if (!pageId || !businessId || !content) {
      return NextResponse.json(
        { success: false, error: 'Page ID, Business ID, and content are required' },
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

    // Convert content to JSON
    const contentJson = JSON.parse(JSON.stringify(content)) as Prisma.JsonArray

    // Update page
    const page = await prisma.page.update({
      where: { id: pageId },
      data: { content: contentJson },
    })

    return NextResponse.json({
      success: true,
      data: { page },
      message: 'Page updated successfully',
    })
  } catch (error) {
    console.error('Update page error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update page' }, { status: 500 })
  }
}
