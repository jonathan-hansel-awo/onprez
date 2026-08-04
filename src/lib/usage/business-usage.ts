import type { PlanTier, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  getUsageWarningLevel,
  PLAN_USAGE_ALLOWANCES,
  type MeteredPlanMetric,
  type UsageWarningLevel,
} from '@/lib/usage/plan-limits'

const GIBIBYTE = 1024 ** 3

type GroupCount = { businessId: string; _count: { _all: number } }
type MediaGroup = GroupCount & { _sum: { bytes: bigint | null } }

export interface BusinessUsageReport {
  businessId: string
  name: string
  slug: string
  planTier: PlanTier
  isActive: boolean
  usage: {
    publishedPages: number
    activeServices: number
    monthlyBookings: number
    mediaItems: number
    mediaBytes: number
    teamMembers: number
    monthlyEmailSends: number
  }
  allowances: (typeof PLAN_USAGE_ALLOWANCES)[PlanTier]
  warnings: Record<MeteredPlanMetric, UsageWarningLevel>
  highestWarning: UsageWarningLevel
  estimatedCosts: {
    cloudinaryStorageGbp: number | null
    resendEmailGbp: number | null
    totalGbp: number | null
    status: 'estimated' | 'unavailable'
  }
}

export interface PlatformUsageReport {
  generatedAt: string
  period: { start: string; endExclusive: string; timezone: 'UTC' }
  coverage: {
    media: 'tracked-assets-only'
    email: 'successful-tracked-sends'
    mediaDelivery: 'unavailable'
    note: string
  }
  totals: {
    businesses: number
    activeBusinesses: number
    publishedPages: number
    activeServices: number
    monthlyBookings: number
    mediaItems: number
    mediaBytes: number
    teamMembers: number
    monthlyEmailSends: number
    estimatedCostGbp: number | null
  }
  rates: Array<{
    provider: string
    metric: string
    unit: string
    rate: number
    currency: string
    source: string
    effectiveFrom: string
  }>
  businesses: BusinessUsageReport[]
}

function countMap(rows: GroupCount[]) {
  return new Map(rows.map(row => [row.businessId, row._count._all]))
}

function warningRank(level: UsageWarningLevel) {
  return { normal: 0, warning: 1, critical: 2, exceeded: 3 }[level]
}

function roundCurrency(value: number) {
  return Math.round(value * 10000) / 10000
}

function currentUtcMonth(now: Date) {
  return {
    start: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
    endExclusive: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)),
  }
}

function activeRateMap(
  rates: Array<{
    provider: string
    metric: string
    rate: Prisma.Decimal
  }>
) {
  const map = new Map<string, number>()

  for (const rate of rates) {
    const key = `${rate.provider}:${rate.metric}`
    if (!map.has(key)) map.set(key, Number(rate.rate))
  }

  return map
}

export async function getPlatformUsageReport(now = new Date()): Promise<PlatformUsageReport> {
  const period = currentUtcMonth(now)

  const [
    businesses,
    publishedPages,
    activeServices,
    monthlyBookings,
    mediaAssets,
    businessMembers,
    monthlyEmailSends,
    rates,
  ] = await Promise.all([
    prisma.business.findMany({
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        planTier: true,
        isActive: true,
      },
    }),
    prisma.page.groupBy({
      by: ['businessId'],
      where: { isPublished: true },
      _count: { _all: true },
    }),
    prisma.service.groupBy({
      by: ['businessId'],
      where: { active: true },
      _count: { _all: true },
    }),
    prisma.appointment.groupBy({
      by: ['businessId'],
      where: { createdAt: { gte: period.start, lt: period.endExclusive } },
      _count: { _all: true },
    }),
    prisma.mediaAsset.groupBy({
      by: ['businessId'],
      _count: { _all: true },
      _sum: { bytes: true },
    }),
    prisma.businessMember.groupBy({
      by: ['businessId'],
      _count: { _all: true },
    }),
    prisma.emailDelivery.groupBy({
      by: ['businessId'],
      where: { sentAt: { gte: period.start, lt: period.endExclusive } },
      _count: { _all: true },
    }),
    prisma.providerCostRate.findMany({
      where: {
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
      },
      orderBy: { effectiveFrom: 'desc' },
      select: {
        provider: true,
        metric: true,
        unit: true,
        rate: true,
        currency: true,
        source: true,
        effectiveFrom: true,
      },
    }),
  ])

  const pageCounts = countMap(publishedPages)
  const serviceCounts = countMap(activeServices)
  const bookingCounts = countMap(monthlyBookings)
  const memberCounts = countMap(businessMembers)
  const emailCounts = countMap(monthlyEmailSends)
  const mediaByBusiness = new Map(
    (mediaAssets as MediaGroup[]).map(row => [
      row.businessId,
      { count: row._count._all, bytes: Number(row._sum.bytes ?? BigInt(0)) },
    ])
  )
  const rateByMetric = activeRateMap(rates)
  const storageRate = rateByMetric.get('CLOUDINARY:MEDIA_STORAGE')
  const emailRate = rateByMetric.get('RESEND:EMAIL_SEND')

  const businessReports = businesses.map(business => {
    const media = mediaByBusiness.get(business.id) ?? { count: 0, bytes: 0 }
    const usage = {
      publishedPages: pageCounts.get(business.id) ?? 0,
      activeServices: serviceCounts.get(business.id) ?? 0,
      monthlyBookings: bookingCounts.get(business.id) ?? 0,
      mediaItems: media.count,
      mediaBytes: media.bytes,
      // BusinessMember stores additional seats; the owner is always the first team member.
      teamMembers: (memberCounts.get(business.id) ?? 0) + 1,
      monthlyEmailSends: emailCounts.get(business.id) ?? 0,
    }
    const allowances = PLAN_USAGE_ALLOWANCES[business.planTier]
    const warnings = {
      publishedPages: getUsageWarningLevel(usage.publishedPages, allowances.publishedPages),
      activeServices: getUsageWarningLevel(usage.activeServices, allowances.activeServices),
      monthlyBookings: getUsageWarningLevel(usage.monthlyBookings, allowances.monthlyBookings),
      mediaItems: getUsageWarningLevel(usage.mediaItems, allowances.mediaItems),
    }
    const highestWarning = Object.values(warnings).reduce<UsageWarningLevel>(
      (highest, current) => (warningRank(current) > warningRank(highest) ? current : highest),
      'normal'
    )
    const cloudinaryStorageGbp =
      storageRate === undefined ? null : roundCurrency((usage.mediaBytes / GIBIBYTE) * storageRate)
    const resendEmailGbp =
      emailRate === undefined ? null : roundCurrency(usage.monthlyEmailSends * emailRate)
    const costParts = [cloudinaryStorageGbp, resendEmailGbp]
    const totalGbp = costParts.some(cost => cost === null)
      ? null
      : roundCurrency(costParts.reduce<number>((sum, cost) => sum + (cost ?? 0), 0))

    return {
      businessId: business.id,
      name: business.name,
      slug: business.slug,
      planTier: business.planTier,
      isActive: business.isActive,
      usage,
      allowances,
      warnings,
      highestWarning,
      estimatedCosts: {
        cloudinaryStorageGbp,
        resendEmailGbp,
        totalGbp,
        status: totalGbp === null ? ('unavailable' as const) : ('estimated' as const),
      },
    }
  })

  const estimatedCosts = businessReports.map(report => report.estimatedCosts.totalGbp)
  const estimatedCostGbp = estimatedCosts.some(cost => cost === null)
    ? null
    : roundCurrency(estimatedCosts.reduce<number>((sum, cost) => sum + (cost ?? 0), 0))

  return {
    generatedAt: now.toISOString(),
    period: {
      start: period.start.toISOString(),
      endExclusive: period.endExclusive.toISOString(),
      timezone: 'UTC',
    },
    coverage: {
      media: 'tracked-assets-only',
      email: 'successful-tracked-sends',
      mediaDelivery: 'unavailable',
      note: 'Media uploaded before P3-002 requires the Cloudinary backfill. CDN delivery and transformation usage remain unavailable until provider snapshots are connected.',
    },
    totals: {
      businesses: businessReports.length,
      activeBusinesses: businessReports.filter(report => report.isActive).length,
      publishedPages: businessReports.reduce((sum, report) => sum + report.usage.publishedPages, 0),
      activeServices: businessReports.reduce((sum, report) => sum + report.usage.activeServices, 0),
      monthlyBookings: businessReports.reduce(
        (sum, report) => sum + report.usage.monthlyBookings,
        0
      ),
      mediaItems: businessReports.reduce((sum, report) => sum + report.usage.mediaItems, 0),
      mediaBytes: businessReports.reduce((sum, report) => sum + report.usage.mediaBytes, 0),
      teamMembers: businessReports.reduce((sum, report) => sum + report.usage.teamMembers, 0),
      monthlyEmailSends: businessReports.reduce(
        (sum, report) => sum + report.usage.monthlyEmailSends,
        0
      ),
      estimatedCostGbp,
    },
    rates: rates.map(rate => ({
      provider: rate.provider,
      metric: rate.metric,
      unit: rate.unit,
      rate: Number(rate.rate),
      currency: rate.currency,
      source: rate.source,
      effectiveFrom: rate.effectiveFrom.toISOString(),
    })),
    businesses: businessReports,
  }
}
