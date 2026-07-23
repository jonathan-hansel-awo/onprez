import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { platformAdminErrorResponse, requirePlatformAdminApi } from '@/lib/admin/access'
import { recordAdminAction } from '@/lib/admin/audit'

type RouteContext = { params: Promise<{ businessId: string }> }

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requirePlatformAdminApi()
    const { businessId } = await params
    const body = await request.json()
    const pageId = typeof body.pageId === 'string' ? body.pageId : ''
    const isPublished = body.isPublished === true

    if (!pageId) {
      return NextResponse.json({ success: false, error: 'Page ID is required' }, { status: 400 })
    }

    const page = await prisma.page.findFirst({
      where: { id: pageId, businessId, slug: 'home' },
      select: { id: true, content: true },
    })

    if (!page) {
      return NextResponse.json({ success: false, error: 'Presence page not found' }, { status: 404 })
    }

    const now = new Date()

    await prisma.$transaction([
      prisma.page.update({
        where: { id: pageId },
        data: isPublished
          ? {
              isPublished: true,
              publishedContent: page.content as Prisma.InputJsonValue,
              publishedAt: now,
              lastPublishedBy: admin.id,
              version: { increment: 1 },
            }
          : { isPublished: false },
      }),
      prisma.business.update({
        where: { id: businessId },
        data: isPublished
          ? { isPublished: true, publishedAt: now }
          : { isPublished: false },
      }),
    ])

    await recordAdminAction({
      adminUserId: admin.id,
      action: isPublished ? 'admin.presence.published' : 'admin.presence.unpublished',
      targetBusinessId: businessId,
      request,
      details: { pageId },
      severity: isPublished ? 'info' : 'warning',
    })

    return NextResponse.json({
      success: true,
      data: { isPublished },
      message: isPublished ? 'Presence page published' : 'Presence page unpublished',
    })
  } catch (error) {
    const authResponse = platformAdminErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Admin publish presence error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to change presence publication state' },
      { status: 500 }
    )
  }
}
