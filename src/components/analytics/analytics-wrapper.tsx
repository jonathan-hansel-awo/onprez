/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function AnalyticsWrapper() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Track page views
    const url = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`

    // Add your analytics tracking here
    if (typeof window !== 'undefined' && (window as any).gtag) {
      ;(window as any).gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: url,
      })
    }
  }, [pathname, searchParams])

  return null
}
