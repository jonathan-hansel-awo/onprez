import {
  buildWebVitalPayload,
  classifyPerformancePage,
  getPerformanceDeviceClass,
  getWebVitalThreshold,
  normaliseWebVitalValueForGa,
  privacySafeAnalyticsPath,
  rateWebVital,
  WEB_VITAL_NAMES,
} from '@/lib/observability/web-vitals'

describe('web vitals monitoring helpers', () => {
  it('tracks the required production metrics', () => {
    expect(WEB_VITAL_NAMES).toEqual(['LCP', 'INP', 'CLS', 'FCP', 'TTFB'])
  })

  it.each([
    ['/', 'marketing'],
    ['/templates/golden-serenity', 'marketing'],
    ['/dashboard', 'dashboard'],
    ['/dashboard/bookings/booking-1', 'dashboard'],
    ['/login', 'auth'],
    ['/book/service-1', 'public_booking'],
    ['/aurelia-wellness', 'public_presence'],
    ['/aurelia-wellness/book/service-1', 'public_booking'],
    ['/api/health', 'other'],
  ] as const)('classifies %s as %s without retaining the raw route', (pathname, pageGroup) => {
    expect(classifyPerformancePage(pathname)).toBe(pageGroup)
  })

  it('segments mobile and desktop measurements at the documented breakpoint', () => {
    expect(getPerformanceDeviceClass(767)).toBe('mobile')
    expect(getPerformanceDeviceClass(768)).toBe('desktop')
  })

  it('uses explicit public and dashboard thresholds', () => {
    expect(getWebVitalThreshold('public_presence', 'LCP')).toEqual({ good: 2_500, poor: 4_000 })
    expect(getWebVitalThreshold('dashboard', 'LCP')).toEqual({ good: 3_000, poor: 4_500 })
  })

  it('rates values against the OnPrez page-group threshold', () => {
    expect(rateWebVital('public_presence', 'INP', 200)).toBe('good')
    expect(rateWebVital('public_presence', 'INP', 201)).toBe('needs-improvement')
    expect(rateWebVital('public_presence', 'INP', 501)).toBe('poor')
    expect(rateWebVital('dashboard', 'INP', 250)).toBe('good')
  })

  it('normalises CLS for integer-only analytics values', () => {
    expect(normaliseWebVitalValueForGa('CLS', 0.1234)).toBe(123)
    expect(normaliseWebVitalValueForGa('LCP', 2_345.6)).toBe(2_346)
  })

  it('reports only a coarse page group to optional analytics', () => {
    expect(privacySafeAnalyticsPath('/private-handle/book/service?email=ada@example.com')).toBe(
      '/public_booking'
    )
    expect(privacySafeAnalyticsPath('/dashboard/customers/customer-1')).toBe('/dashboard')
  })

  it('builds a privacy-safe report and ignores unsupported Next.js custom metrics', () => {
    expect(
      buildWebVitalPayload(
        {
          id: 'v5-123',
          name: 'LCP',
          value: 2_700,
          delta: 2_700,
          navigationType: 'navigate',
        },
        '/private-business-handle?customer=ignored',
        390
      )
    ).toEqual({
      id: 'v5-123',
      name: 'LCP',
      value: 2_700,
      delta: 2_700,
      rating: 'needs-improvement',
      pageGroup: 'public_presence',
      deviceClass: 'mobile',
      navigationType: 'navigate',
    })

    expect(
      buildWebVitalPayload(
        {
          id: 'next-1',
          name: 'Next.js-hydration',
          value: 100,
          delta: 100,
        },
        '/',
        1_024
      )
    ).toBeNull()
  })
})
