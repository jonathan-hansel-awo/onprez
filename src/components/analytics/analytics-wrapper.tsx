'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { WebVitalsReporter } from '@/components/analytics/web-vitals-reporter'
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  COOKIE_CONSENT_STORAGE_KEY,
  hasAnalyticsConsent,
} from '@/lib/privacy/cookie-consent'
import { privacySafeAnalyticsPath } from '@/lib/observability/web-vitals'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

function AnalyticsContent() {
  const pathname = usePathname()
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false)

  useEffect(() => {
    const syncConsent = () => setAnalyticsAllowed(hasAnalyticsConsent())
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === COOKIE_CONSENT_STORAGE_KEY) {
        syncConsent()
      }
    }

    syncConsent()
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, syncConsent)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, syncConsent)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  useEffect(() => {
    const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
    if (!analyticsAllowed || !measurementId || !window.gtag) return

    window.gtag('config', measurementId, {
      page_path: privacySafeAnalyticsPath(pathname),
      anonymize_ip: true,
    })
  }, [analyticsAllowed, pathname])

  return null
}

export function AnalyticsWrapper() {
  return (
    <>
      <WebVitalsReporter />
      <AnalyticsContent />
    </>
  )
}
