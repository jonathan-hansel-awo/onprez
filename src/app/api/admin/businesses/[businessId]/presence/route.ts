import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { platformAdminErrorResponse, requirePlatformAdminApi } from '@/lib/admin/access'
import { recordAdminAction } from '@/lib/admin/audit'

type RouteContext = { params: Promise<{ businessId: string }> }

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    await requirePlatformAdminApi()
    const { businessId } = await params

    const page = await prisma.page.findFirst({
      where: { businessId, slug: 'home' },
      select: {
        id: true,
        content: true,
        publishedContent: true,
        isPublished: true,
        version: true,
        updatedAt: true,
      },
    })

    if (!page) {
      return NextResponse.json({ success: false, error: 'Presence page not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: { page } })
  } catch (error) {
    const authResponse = platformAdminErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Admin get presence error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load presence page' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requirePlatformAdminApi()
    const { businessId } = await params
    const body = await request.json()
    const pageId = typeof body.pageId === 'string' ? body.pageId : ''
    const content = body.content

    if (!pageId || !Array.isArray(content)) {
      return NextResponse.json(
        { success: false, error: 'A valid page and section list are required.' },
        { status: 400 }
      )
    }

    if (JSON.stringify(content).length > 1_000_000) {
      return NextResponse.json(
        { success: false, error: 'Presence content is too large to save.' },
        { status: 413 }
      )
    }

    const page = await prisma.page.findFirst({
      where: { id: pageId, businessId, slug: 'home' },
      select: { id: true },
    })

    if (!page) {
      return NextResponse.json({ success: false, error: 'Presence page not found' }, { status: 404 })
    }

    await prisma.page.update({
      where: { id: pageId },
      data: { content: content as Prisma.InputJsonValue },
    })

    await recordAdminAction({
      adminUserId: admin.id,
      action: 'admin.presence.draft_saved',
      targetBusinessId: businessId,
      request,
      details: { pageId, sectionCount: content.length },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const authResponse = platformAdminErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Admin save presence error:', error)
    return NextResponse.json({ success: false, error: 'Failed to save presence draft' }, { status: 500 })
  }
}
