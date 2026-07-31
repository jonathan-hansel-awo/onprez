'use client'

import { useReportWebVitals } from 'next/web-vitals'
import { hasAnalyticsConsent } from '@/lib/privacy/cookie-consent'
import {
  buildWebVitalPayload,
  normaliseWebVitalValueForGa,
  type WebVitalPayload,
} from '@/lib/observability/web-vitals'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

type NextWebVitalMetric = Parameters<Parameters<typeof useReportWebVitals>[0]>[0]

const REPORTING_ENDPOINT = '/api/monitoring/web-vitals'

function sendToMonitoringEndpoint(payload: WebVitalPayload) {
  const body = JSON.stringify(payload)
  const beaconBody = new Blob([body], { type: 'application/json' })
  const beaconSent =
    typeof navigator.sendBeacon === 'function' &&
    navigator.sendBeacon(REPORTING_ENDPOINT, beaconBody)

  if (!beaconSent) {
    void fetch(REPORTING_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
      credentials: 'same-origin',
    }).catch(() => undefined)
  }
}

function sendToGoogleAnalytics(payload: WebVitalPayload) {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  if (!measurementId || !window.gtag) return

  window.gtag('event', 'web_vital', {
    value: normaliseWebVitalValueForGa(payload.name, payload.value),
    metric_name: payload.name,
    metric_id: payload.id,
    metric_value: payload.value,
    metric_delta: payload.delta,
    metric_rating: payload.rating,
    page_group: payload.pageGroup,
    device_class: payload.deviceClass,
    navigation_type: payload.navigationType,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || 'unknown',
    non_interaction: true,
  })
}

function reportWebVital(metric: NextWebVitalMetric) {
  if (!hasAnalyticsConsent()) return

  const payload = buildWebVitalPayload(metric, window.location.pathname, window.innerWidth)
  if (!payload) return

  sendToMonitoringEndpoint(payload)
  sendToGoogleAnalytics(payload)
}

export function WebVitalsReporter() {
  useReportWebVitals(reportWebVital)
  return null
}
