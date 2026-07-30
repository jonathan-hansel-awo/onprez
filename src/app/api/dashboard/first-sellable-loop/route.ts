import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { resolveReadableBusinessContext } from '@/lib/auth/business-route-utils'
import { parseOnboardingState } from '@/lib/onboarding/progress'
import { buildFirstSellableLoopProgress } from '@/lib/product/first-sellable-loop'
import { prisma } from '@/lib/prisma'

/**
 * Access: business-scoped. Returns only milestones derived from the selected business.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const context = await resolveReadableBusinessContext(user.id, request)
    const business = await prisma.business.findUnique({
      where: { id: context.businessId },
      select: {
        createdAt: true,
        publishedAt: true,
        settings: true,
        services: {
          where: { active: true },
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: { createdAt: true },
        },
        businessHours: {
          where: { isClosed: false },
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: { createdAt: true },
        },
        pages: {
          where: { isPublished: true },
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: { createdAt: true, publishedAt: true },
        },
        appointments: {
          where: { bookingSource: 'WEBSITE' },
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: { createdAt: true },
        },
        appointmentTransitions: {
          where: {
            changedByType: 'USER',
            appointment: { bookingSource: 'WEBSITE' },
          },
          orderBy: { changedAt: 'asc' },
          take: 1,
          select: { changedAt: true },
        },
      },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const onboarding = parseOnboardingState(business.settings)
    const firstPublishedPage = business.pages[0]
    const progress = buildFirstSellableLoopProgress({
      claimedHandleAt: business.createdAt,
      firstServiceAt: business.services[0]?.createdAt,
      firstAvailabilityAt: business.businessHours[0]?.createdAt,
      publishedAt:
        business.publishedAt || firstPublishedPage?.publishedAt || firstPublishedPage?.createdAt,
      sharedAt: onboarding.sharedAt,
      firstBookingAt: business.appointments[0]?.createdAt,
      firstManagedBookingAt: business.appointmentTransitions[0]?.changedAt,
    })

    return NextResponse.json({
      success: true,
      data: {
        firstSellableLoop: progress,
      },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Get first sellable loop analytics error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load first sellable loop analytics' },
      { status: 500 }
    )
  }
}
