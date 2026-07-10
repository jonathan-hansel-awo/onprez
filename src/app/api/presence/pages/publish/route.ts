import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { businessAuthErrorResponse, requireBusinessRole } from '@/lib/auth/business-access'

const publishPageSchema = z.object({
  pageId: z.string().min(1, 'Page ID is required').max(128),
  businessId: z.string().min(1, 'Business ID is required').max(128),
  isPublished: z.boolean(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = publishPageSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.flatten(),
        },
        { status: 400 }
      )
    }

    const { pageId, businessId, isPublished } = validation.data

    const context = await requireBusinessRole(user.id, businessId, ['ADMIN'])

    const currentPage = await prisma.page.findFirst({
      where: {
        id: pageId,
        businessId: context.businessId,
      },
      select: {
        id: true,
        businessId: true,
        content: true,
      },
    })

    if (!currentPage) {
      return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 })
    }

    const updateData: Prisma.PageUncheckedUpdateInput = {
      isPublished,
    }

    if (isPublished) {
      updateData.publishedContent = currentPage.content as Prisma.InputJsonValue
      updateData.publishedAt = new Date()
      updateData.lastPublishedBy = user.id
      updateData.version = { increment: 1 }
    } else {
      updateData.publishedAt = null
      updateData.lastPublishedBy = null
    }

    const page = await prisma.page.update({
      where: { id: currentPage.id },
      data: updateData,
      select: {
        id: true,
        businessId: true,
        slug: true,
        title: true,
        isPublished: true,
        publishedAt: true,
        version: true,
        updatedAt: true,
      },
    })

    await prisma.business.update({
      where: { id: context.businessId },
      data: {
        isPublished,
        publishedAt: isPublished ? new Date() : null,
      },
      select: { id: true },
    })

    return NextResponse.json({
      success: true,
      data: { page },
      message: isPublished
        ? `Page published successfully! (Version ${page.version})`
        : 'Page unpublished',
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Publish page error:', error)
    return NextResponse.json({ success: false, error: 'Failed to publish page' }, { status: 500 })
  }
}
