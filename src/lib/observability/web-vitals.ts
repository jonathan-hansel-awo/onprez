export const WEB_VITAL_NAMES = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'] as const

export type WebVitalName = (typeof WEB_VITAL_NAMES)[number]
export type WebVitalRating = 'good' | 'needs-improvement' | 'poor'
export type PerformancePageGroup =
  | 'marketing'
  | 'public_presence'
  | 'public_booking'
  | 'dashboard'
  | 'auth'
  | 'other'
export type PerformanceDeviceClass = 'mobile' | 'desktop'

export type WebVitalThreshold = {
  good: number
  poor: number
}

export type WebVitalPayload = {
  id: string
  name: WebVitalName
  value: number
  delta: number
  rating: WebVitalRating
  pageGroup: PerformancePageGroup
  deviceClass: PerformanceDeviceClass
  navigationType:
    | 'navigate'
    | 'reload'
    | 'back-forward'
    | 'back-forward-cache'
    | 'prerender'
    | 'restore'
    | 'unknown'
}

type WebVitalMetricInput = {
  id: string
  name: string
  value: number
  delta: number
  navigationType?: string
}

const PUBLIC_THRESHOLDS: Record<WebVitalName, WebVitalThreshold> = {
  LCP: { good: 2_500, poor: 4_000 },
  INP: { good: 200, poor: 500 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1_800, poor: 3_000 },
  TTFB: { good: 800, poor: 1_800 },
}

const DASHBOARD_THRESHOLDS: Record<WebVitalName, WebVitalThreshold> = {
  LCP: { good: 3_000, poor: 4_500 },
  INP: { good: 250, poor: 600 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 2_000, poor: 3_500 },
  TTFB: { good: 1_000, poor: 2_000 },
}

const MARKETING_PATHS = [
  '/',
  '/about',
  '/contact',
  '/cookies',
  '/examples',
  '/help',
  '/pricing',
  '/privacy',
  '/security',
  '/templates',
  '/terms',
]

const AUTH_PATH_PREFIXES = [
  '/forgot-password',
  '/login',
  '/mfa',
  '/reset-password',
  '/signup',
  '/verify-email',
]

const PUBLIC_BOOKING_PATH_PREFIXES = ['/book', '/booking', '/confirm-booking']

const NAVIGATION_TYPES = new Set<WebVitalPayload['navigationType']>([
  'navigate',
  'reload',
  'back-forward',
  'back-forward-cache',
  'prerender',
  'restore',
  'unknown',
])

export function isWebVitalName(name: string): name is WebVitalName {
  return WEB_VITAL_NAMES.includes(name as WebVitalName)
}

export function classifyPerformancePage(pathname: string): PerformancePageGroup {
  const normalisedPath = pathname.split('?')[0]?.split('#')[0] || '/'

  if (normalisedPath === '/dashboard' || normalisedPath.startsWith('/dashboard/')) {
    return 'dashboard'
  }

  if (
    AUTH_PATH_PREFIXES.some(
      prefix => normalisedPath === prefix || normalisedPath.startsWith(`${prefix}/`)
    )
  ) {
    return 'auth'
  }

  if (
    PUBLIC_BOOKING_PATH_PREFIXES.some(
      prefix => normalisedPath === prefix || normalisedPath.startsWith(`${prefix}/`)
    )
  ) {
    return 'public_booking'
  }

  if (
    MARKETING_PATHS.some(path => normalisedPath === path || normalisedPath.startsWith(`${path}/`))
  ) {
    return 'marketing'
  }

  const segments = normalisedPath.split('/').filter(Boolean)
  if (segments.length === 1) return 'public_presence'
  if (segments.length > 1 && ['book', 'booking'].includes(segments[1] || '')) {
    return 'public_booking'
  }

  return 'other'
}

export function getPerformanceDeviceClass(viewportWidth: number): PerformanceDeviceClass {
  return viewportWidth < 768 ? 'mobile' : 'desktop'
}

export function getWebVitalThreshold(
  pageGroup: PerformancePageGroup,
  name: WebVitalName
): WebVitalThreshold {
  return pageGroup === 'dashboard' ? DASHBOARD_THRESHOLDS[name] : PUBLIC_THRESHOLDS[name]
}

export function rateWebVital(
  pageGroup: PerformancePageGroup,
  name: WebVitalName,
  value: number
): WebVitalRating {
  const threshold = getWebVitalThreshold(pageGroup, name)
  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

export function normaliseWebVitalValueForGa(name: WebVitalName, value: number): number {
  return Math.round(name === 'CLS' ? value * 1_000 : value)
}

function normaliseNavigationType(value: string | undefined): WebVitalPayload['navigationType'] {
  const candidate = value || 'unknown'
  return NAVIGATION_TYPES.has(candidate as WebVitalPayload['navigationType'])
    ? (candidate as WebVitalPayload['navigationType'])
    : 'unknown'
}

export function buildWebVitalPayload(
  metric: WebVitalMetricInput,
  pathname: string,
  viewportWidth: number
): WebVitalPayload | null {
  if (!isWebVitalName(metric.name)) return null

  const pageGroup = classifyPerformancePage(pathname)
  return {
    id: metric.id,
    name: metric.name,
    value: metric.value,
    delta: metric.delta,
    rating: rateWebVital(pageGroup, metric.name, metric.value),
    pageGroup,
    deviceClass: getPerformanceDeviceClass(viewportWidth),
    navigationType: normaliseNavigationType(metric.navigationType),
  }
}
