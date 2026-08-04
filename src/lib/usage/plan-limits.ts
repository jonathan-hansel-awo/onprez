import type { PlanTier } from '@prisma/client'

export type MeteredPlanMetric =
  | 'publishedPages'
  | 'activeServices'
  | 'monthlyBookings'
  | 'mediaItems'

export interface PlanUsageAllowances {
  publishedPages: number
  activeServices: number
  monthlyBookings: number | null
  mediaItems: number
}

export const PLAN_USAGE_ALLOWANCES: Record<PlanTier, PlanUsageAllowances> = {
  FREE: {
    publishedPages: 1,
    activeServices: 5,
    monthlyBookings: 10,
    mediaItems: 5,
  },
  PROFESSIONAL: {
    publishedPages: 1,
    activeServices: 20,
    monthlyBookings: 100,
    mediaItems: 20,
  },
  BUSINESS: {
    publishedPages: 1,
    activeServices: 50,
    monthlyBookings: null,
    mediaItems: 50,
  },
}

export type UsageWarningLevel = 'normal' | 'warning' | 'critical' | 'exceeded'

export function getUsageWarningLevel(used: number, allowance: number | null): UsageWarningLevel {
  if (allowance === null || allowance <= 0) return 'normal'

  const percentage = (used / allowance) * 100
  if (percentage >= 100) return 'exceeded'
  if (percentage >= 95) return 'critical'
  if (percentage >= 70) return 'warning'
  return 'normal'
}
