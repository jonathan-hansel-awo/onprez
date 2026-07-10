import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { Prisma } from '@prisma/client'
import { syncFAQsFromPage } from '@/lib/utils/sync-faqs'
import { z } from 'zod'
import {
  businessAuthErrorResponse,
  requireBusinessAccess,
  requireBusinessRole,
} from '@/lib/auth/business-access'

const updatePageSchema = z.object({
  pageId: z.string().min(1, 'Page ID is required').max(128),
  businessId: z.string().min(1, 'Business ID is required').max(128),
  content: z.array(z.any()),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const businessId = searchParams.get('businessId')
    const slug = searchParams.get('slug')?.trim()

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'Business ID is required' },
        { status: 400 }
      )
    }

    const context = await requireBusinessAccess(user.id, businessId)

    const where: Prisma.PageWhereInput = {
      businessId: context.businessId,
    }

    if (slug) {
      where.slug = slug
    }

    const pages = await prisma.page.findMany({
      where,
      orderBy: { order: 'asc' },
      select: {
        id: true,
        businessId: true,
        slug: true,
        title: true,
        content: true,
        publishedContent: true,
        isPublished: true,
        publishedAt: true,
        version: true,
        order: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: { pages },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Fetch pages error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch pages' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = updatePageSchema.safeParse(body)

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

    const { pageId, businessId, content } = validation.data

    const context = await requireBusinessRole(user.id, businessId, ['ADMIN', 'MANAGER'])

    const existingPage = await prisma.page.findFirst({
      where: {
        id: pageId,
        businessId: context.businessId,
      },
      select: {
        id: true,
        businessId: true,
      },
    })

    if (!existingPage) {
      return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 })
    }

    const contentJson = JSON.parse(JSON.stringify(content)) as Prisma.JsonArray

    const page = await prisma.page.update({
      where: { id: existingPage.id },
      data: { content: contentJson },
      select: {
        id: true,
        businessId: true,
        slug: true,
        title: true,
        content: true,
        isPublished: true,
        version: true,
        updatedAt: true,
      },
    })

    await syncFAQsFromPage(context.businessId, content)

    return NextResponse.json({
      success: true,
      data: { page },
      message: 'Page updated successfully',
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Update page error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update page' }, { status: 500 })
  }
}
