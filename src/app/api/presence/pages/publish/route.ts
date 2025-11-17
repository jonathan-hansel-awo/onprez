/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { pageId, businessId, isPublished } = await request.json()

    if (!pageId || !businessId || typeof isPublished !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Invalid request data' }, { status: 400 })
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

    // Get current page
    const currentPage = await prisma.page.findUnique({
      where: { id: pageId },
    })

    if (!currentPage) {
      return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 })
    }

    // Update page publish status
    const updateData: any = { isPublished }

    if (isPublished) {
      // Publishing: Save current content as published version
      updateData.publishedContent = currentPage.content
      updateData.publishedAt = new Date()
      updateData.lastPublishedBy = user.id
      updateData.version = { increment: 1 }
    } else {
      // Unpublishing: Keep draft content, clear published version
      updateData.publishedAt = null
      updateData.lastPublishedBy = null
    }

    const page = await prisma.page.update({
      where: { id: pageId },
      data: updateData,
    })

    // Update business publish status
    await prisma.business.update({
      where: { id: businessId },
      data: {
        isPublished,
        publishedAt: isPublished ? new Date() : null,
      },
    })

    return NextResponse.json({
      success: true,
      data: { page },
      message: isPublished
        ? `Page published successfully! (Version ${page.version})`
        : 'Page unpublished',
    })
  } catch (error) {
    console.error('Publish page error:', error)
    return NextResponse.json({ success: false, error: 'Failed to publish page' }, { status: 500 })
  }
}
