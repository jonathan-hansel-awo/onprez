import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse, requireBusinessRole } from '@/lib/auth/business-access'
import { prisma } from '@/lib/prisma'
import { createPresenceDraftPreviewToken } from '@/lib/presence/draft-preview-token'

const previewLinkSchema = z.object({
  businessId: z.string().min(1, 'Business ID is required').max(128),
  pageId: z.string().min(1, 'Page ID is required').max(128),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const validation = previewLinkSchema.safeParse(await request.json())

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

    const { businessId, pageId } = validation.data
    const context = await requireBusinessRole(user.id, businessId, ['ADMIN', 'MANAGER'])
    const page = await prisma.page.findFirst({
      where: {
        id: pageId,
        businessId: context.businessId,
        slug: 'home',
      },
      select: {
        id: true,
        businessId: true,
        version: true,
      },
    })

    if (!page) {
      return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 })
    }

    const { token, expiresAt } = createPresenceDraftPreviewToken({
      pageId: page.id,
      businessId: page.businessId,
      pageVersion: page.version,
    })
    const previewUrl = new URL(`/preview/presence/${token}`, request.nextUrl.origin).toString()

    return NextResponse.json(
      {
        success: true,
        data: {
          previewUrl,
          expiresAt: expiresAt.toISOString(),
        },
        message: 'Private draft preview link created',
      },
      {
        headers: {
          'Cache-Control': 'private, no-store',
        },
      }
    )
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Create draft preview link error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create the draft preview link' },
      { status: 500 }
    )
  }
}
