import { NextRequest, NextResponse } from 'next/server'
import { BusinessCategory, Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse, requireBusinessRole } from '@/lib/auth/business-access'
import { getTemplateById } from '@/lib/templates/presence-templates'
import {
  CANONICAL_TEMPLATE_VERSION,
  createCanonicalPresencePageContent,
} from '@/lib/templates/canonical-template-engine'
import type { PageSection } from '@/types/page-sections'

const applyTemplateSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required').max(100),
  businessId: z.string().min(1, 'Business ID is required').max(128),
})

function readSections(value: Prisma.JsonValue | null | undefined): PageSection[] {
  return Array.isArray(value) ? (value as unknown as PageSection[]) : []
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const validation = applyTemplateSchema.safeParse(await request.json())
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
        category: true,
        settings: true,
        pages: {
          where: { slug: 'home' },
          take: 1,
          select: {
            id: true,
            content: true,
            publishedContent: true,
            isPublished: true,
          },
        },
      },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const existingPage = business.pages?.[0]
    const existingSections = readSections(existingPage?.content)
    const canonical = createCanonicalPresencePageContent(
      business.name,
      business.category ?? BusinessCategory.OTHER,
      template.id,
      {
        mode: 'account',
        existingSections,
        preserveContent: true,
      }
    )
    const isCanonical = Boolean(canonical.templateSlug && canonical.theme)
    const sections = isCanonical ? canonical.sections : template.content.sections
    const theme = isCanonical ? canonical.theme : template.content.theme

    if (!theme) {
      return NextResponse.json(
        { success: false, error: 'Template could not be prepared' },
        { status: 422 }
      )
    }

    const currentSettings =
      business.settings &&
      typeof business.settings === 'object' &&
      !Array.isArray(business.settings)
        ? (business.settings as Prisma.JsonObject)
        : {}
    const nextSettings = {
      ...currentSettings,
      ...(isCanonical
        ? {
            presenceTemplateSlug: canonical.templateSlug,
            presenceTemplateVersion: CANONICAL_TEMPLATE_VERSION,
          }
        : {}),
      theme,
    } as unknown as Prisma.InputJsonValue

    const pageOperation = prisma.page.upsert({
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
        content: sections as unknown as Prisma.InputJsonValue,
        isPublished: false,
      },
      update: {
        content: sections as unknown as Prisma.InputJsonValue,
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
    const businessOperation = prisma.business.update({
      where: { id: context.businessId },
      data: { settings: nextSettings },
      select: { id: true },
    })
    const [page] =
      typeof prisma.$transaction === 'function'
        ? await prisma.$transaction([pageOperation, businessOperation])
        : await Promise.all([pageOperation, businessOperation])

    return NextResponse.json({
      success: true,
      data: {
        page,
        templateSlug: canonical.templateSlug || template.id,
        templateName: canonical.templateName || template.name,
        requiresPublish: existingPage?.isPublished === true,
      },
      message:
        existingPage?.isPublished === true
          ? 'Template applied to your draft. Review it in the editor, then publish to update the live page.'
          : 'Template applied successfully. Review it in the editor before publishing.',
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Apply template error:', error)
    return NextResponse.json({ success: false, error: 'Failed to apply template' }, { status: 500 })
  }
}
