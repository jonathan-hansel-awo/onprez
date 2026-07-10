import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { getTemplateById } from '@/lib/templates/presence-templates'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { businessAuthErrorResponse, requireBusinessRole } from '@/lib/auth/business-access'

const applyTemplateSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required').max(100),
  businessId: z.string().min(1, 'Business ID is required').max(128),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = applyTemplateSchema.safeParse(body)

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

    const { templateId, businessId } = validation.data

    const template = getTemplateById(templateId)

    if (!template) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 })
    }

    const context = await requireBusinessRole(user.id, businessId, ['ADMIN', 'MANAGER'])

    const business = await prisma.business.findUnique({
      where: { id: context.businessId },
      select: {
        id: true,
        name: true,
        settings: true,
      },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const contentJson = JSON.parse(JSON.stringify(template.content.sections)) as Prisma.JsonArray

    const page = await prisma.page.upsert({
      where: {
        businessId_slug: {
          businessId: context.businessId,
          slug: 'home',
        },
      },
      create: {
        businessId: context.businessId,
        slug: 'home',
        title: business.name,
        content: contentJson,
        isPublished: false,
      },
      update: {
        content: contentJson,
      },
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

    const themeJson = template.content.theme
      ? JSON.parse(JSON.stringify(template.content.theme))
      : null

    const currentSettings =
      business.settings &&
      typeof business.settings === 'object' &&
      !Array.isArray(business.settings)
        ? (business.settings as Prisma.JsonObject)
        : {}

    await prisma.business.update({
      where: { id: context.businessId },
      data: {
        settings: {
          ...currentSettings,
          theme: themeJson,
        },
      },
      select: { id: true },
    })

    return NextResponse.json({
      success: true,
      data: { page },
      message: 'Template applied successfully',
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Apply template error:', error)
    return NextResponse.json({ success: false, error: 'Failed to apply template' }, { status: 500 })
  }
}
