import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import {
  resolveReadableBusinessContext,
  resolveWritableBusinessContext,
} from '@/lib/auth/business-route-utils'
import {
  buildOnboardingProgress,
  isOptionalOnboardingTask,
  parseOnboardingState,
  type OnboardingProgress,
  type OnboardingTaskId,
} from '@/lib/onboarding/progress'
import { prisma } from '@/lib/prisma'

const updateSchema = z.object({
  taskId: z.enum(['preview', 'share']),
  action: z.enum(['complete', 'skip', 'restore']),
})

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

async function getProgress(businessId: string): Promise<OnboardingProgress | null> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      name: true,
      slug: true,
      description: true,
      tagline: true,
      isPublished: true,
      settings: true,
      services: {
        where: { active: true },
        take: 1,
        select: { id: true },
      },
      businessHours: {
        where: { isClosed: false },
        take: 1,
        select: { id: true },
      },
      pages: {
        where: { isPublished: true },
        take: 1,
        select: { id: true },
      },
    },
  })

  if (!business) return null

  return buildOnboardingProgress({
    businessName: business.name,
    slug: business.slug,
    description: business.description,
    tagline: business.tagline,
    isPublished: business.isPublished,
    activeServiceCount: business.services.length,
    configuredHoursCount: business.businessHours.length,
    hasPublishedPage: business.pages.length > 0,
    state: parseOnboardingState(business.settings),
  })
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const context = await resolveReadableBusinessContext(user.id, request)
    const progress = await getProgress(context.businessId)
    if (!progress) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: { onboarding: progress } })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Get dashboard onboarding error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load onboarding progress' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const validation = updateSchema.safeParse(await request.json())
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid onboarding action' },
        { status: 400 }
      )
    }

    const context = await resolveWritableBusinessContext(user.id, request)
    const business = await prisma.business.findUnique({
      where: { id: context.businessId },
      select: { id: true, settings: true },
    })
    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const { taskId, action } = validation.data
    if (action === 'skip' && !isOptionalOnboardingTask(taskId)) {
      return NextResponse.json(
        { success: false, error: 'Required tasks cannot be skipped' },
        { status: 400 }
      )
    }

    const currentSettings = toRecord(business.settings)
    const state = parseOnboardingState(currentSettings)
    const skippedTasks = new Set<OnboardingTaskId>(state.skippedTasks)

    if (action === 'skip') skippedTasks.add(taskId)
    if (action === 'restore' || action === 'complete') skippedTasks.delete(taskId)

    const now = new Date().toISOString()
    const onboarding = {
      ...state,
      skippedTasks: Array.from(skippedTasks),
      ...(action === 'complete' && taskId === 'preview' ? { previewedAt: now } : {}),
      ...(action === 'complete' && taskId === 'share' ? { sharedAt: now } : {}),
    }

    await prisma.business.update({
      where: { id: business.id },
      data: {
        settings: {
          ...currentSettings,
          onboarding,
        } as Prisma.InputJsonValue,
      },
      select: { id: true },
    })

    const progress = await getProgress(context.businessId)
    return NextResponse.json({ success: true, data: { onboarding: progress } })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Update dashboard onboarding error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update onboarding progress' },
      { status: 500 }
    )
  }
}
