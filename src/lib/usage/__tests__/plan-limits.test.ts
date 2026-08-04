import { getUsageWarningLevel, PLAN_USAGE_ALLOWANCES } from '@/lib/usage/plan-limits'

describe('plan usage allowances', () => {
  it('keeps the public pricing limits in one canonical configuration', () => {
    expect(PLAN_USAGE_ALLOWANCES).toEqual({
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
    })
  })

  it('uses the documented warning, critical, and exceeded thresholds', () => {
    expect(getUsageWarningLevel(69, 100)).toBe('normal')
    expect(getUsageWarningLevel(70, 100)).toBe('warning')
    expect(getUsageWarningLevel(95, 100)).toBe('critical')
    expect(getUsageWarningLevel(100, 100)).toBe('exceeded')
    expect(getUsageWarningLevel(10_000, null)).toBe('normal')
  })
})
