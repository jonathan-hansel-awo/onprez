'use client'

import { Suspense, useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  COOKIE_CONSENT_STORAGE_KEY,
  hasAnalyticsConsent,
} from '@/lib/privacy/cookie-consent'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

function AnalyticsContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
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

    const query = searchParams?.toString()
    const url = `${pathname}${query ? `?${query}` : ''}`

    window.gtag('config', measurementId, {
      page_path: url,
      anonymize_ip: true,
    })
  }, [analyticsAllowed, pathname, searchParams])

  return null
}

export function AnalyticsWrapper() {
  return (
    <Suspense fallback={null}>
      <AnalyticsContent />
    </Suspense>
  )
}
