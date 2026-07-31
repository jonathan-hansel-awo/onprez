import * as Sentry from '@sentry/nextjs'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger, withRequestLogging } from '@/lib/observability/logger'
import {
  getWebVitalThreshold,
  rateWebVital,
  WEB_VITAL_NAMES,
  type WebVitalPayload,
} from '@/lib/observability/web-vitals'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_BODY_BYTES = 4_096
const NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
}

const payloadSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .max(128)
      .regex(/^[A-Za-z0-9._:-]+$/),
    name: z.enum(WEB_VITAL_NAMES),
    value: z.number().finite().nonnegative().max(120_000),
    delta: z.number().finite().nonnegative().max(120_000),
    rating: z.enum(['good', 'needs-improvement', 'poor']),
    pageGroup: z.enum([
      'marketing',
      'public_presence',
      'public_booking',
      'dashboard',
      'auth',
      'other',
    ]),
    deviceClass: z.enum(['mobile', 'desktop']),
    navigationType: z.enum([
      'navigate',
      'reload',
      'back-forward',
      'back-forward-cache',
      'prerender',
      'restore',
      'unknown',
    ]),
  })
  .strict()

function captureThresholdBreach(payload: WebVitalPayload, rating: 'poor') {
  const threshold = getWebVitalThreshold(payload.pageGroup, payload.name)

  Sentry.withScope(scope => {
    scope.setFingerprint([
      'web-vital-threshold-breach',
      payload.name,
      payload.pageGroup,
      payload.deviceClass,
    ])
    scope.setTag('web_vital.name', payload.name)
    scope.setTag('web_vital.rating', rating)
    scope.setTag('web_vital.page_group', payload.pageGroup)
    scope.setTag('web_vital.device_class', payload.deviceClass)
    scope.setTag('web_vital.navigation_type', payload.navigationType)
    scope.setExtra('metric_id', payload.id)
    scope.setExtra('value', payload.value)
    scope.setExtra('delta', payload.delta)
    scope.setExtra('poor_threshold', threshold.poor)

    Sentry.captureMessage('Core Web Vital threshold breached', 'warning')
  })
}

export async function POST(request: NextRequest) {
  return withRequestLogging(request, async () => {
    const contentLength = Number(request.headers.get('content-length') || '0')
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { success: false, error: 'Payload too large' },
        { status: 413, headers: NO_STORE_HEADERS }
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload' },
        { status: 400, headers: NO_STORE_HEADERS }
      )
    }

    const parsed = payloadSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid web vital payload' },
        { status: 400, headers: NO_STORE_HEADERS }
      )
    }

    const payload = parsed.data
    const rating = rateWebVital(payload.pageGroup, payload.name, payload.value)
    const threshold = getWebVitalThreshold(payload.pageGroup, payload.name)

    logger.info('web_vital.reported', {
      metricId: payload.id,
      metricName: payload.name,
      value: payload.value,
      delta: payload.delta,
      rating,
      pageGroup: payload.pageGroup,
      deviceClass: payload.deviceClass,
      navigationType: payload.navigationType,
      goodThreshold: threshold.good,
      poorThreshold: threshold.poor,
      release:
        process.env.SENTRY_RELEASE ||
        process.env.NEXT_PUBLIC_SENTRY_RELEASE ||
        process.env.VERCEL_GIT_COMMIT_SHA ||
        'unknown',
    })

    if (rating === 'poor') {
      captureThresholdBreach(payload, rating)
    }

    return new NextResponse(null, { status: 204, headers: NO_STORE_HEADERS })
  })
}
