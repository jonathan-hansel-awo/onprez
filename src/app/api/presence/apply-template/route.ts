/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { getTemplateById } from '@/lib/templates/presence-templates'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { templateId, businessId } = await request.json()

    if (!templateId || !businessId) {
      return NextResponse.json(
        { success: false, error: 'Template ID and Business ID are required' },
        { status: 400 }
      )
    }

    // Get template
    const template = getTemplateById(templateId)

    if (!template) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 })
    }

    // Verify user owns the business - using ownerId from your schema
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        ownerId: user.id, // Changed from userId to ownerId
      },
    })

    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found or access denied' },
        { status: 404 }
      )
    }

    // Create or update the main page with template content
    const page = await prisma.page.upsert({
      where: {
        businessId_slug: {
          businessId: businessId,
          slug: 'home',
        },
      },
      create: {
        businessId: businessId,
        slug: 'home',
        title: business.name,
        content: template.content.sections,
        isPublished: false,
      },
      update: {
        content: template.content.sections,
      },
    })

    // Update business theme settings
    await prisma.business.update({
      where: { id: businessId },
      data: {
        settings: {
          ...((business.settings as any) || {}),
          theme: template.content.theme,
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: { page },
      message: 'Template applied successfully',
    })
  } catch (error) {
    console.error('Apply template error:', error)
    return NextResponse.json({ success: false, error: 'Failed to apply template' }, { status: 500 })
  }
}
