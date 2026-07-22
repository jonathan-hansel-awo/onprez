'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Cookie, Settings, ShieldCheck, X } from 'lucide-react'
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  OPEN_COOKIE_PREFERENCES_EVENT,
  readCookieConsent,
  saveCookieConsent,
  type CookieConsentPreference,
} from '@/lib/privacy/cookie-consent'

export function CookieConsentBanner() {
  const [preference, setPreference] = useState<CookieConsentPreference | null | undefined>(
    undefined
  )
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false)

  useEffect(() => {
    const syncPreference = () => {
      const storedPreference = readCookieConsent()
      setPreference(storedPreference)
      setAnalyticsEnabled(storedPreference?.analytics ?? false)
    }

    const handleOpenPreferences = () => {
      syncPreference()
      setIsSettingsOpen(true)
    }

    syncPreference()
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, syncPreference)
    window.addEventListener(OPEN_COOKIE_PREFERENCES_EVENT, handleOpenPreferences)

    return () => {
      window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, syncPreference)
      window.removeEventListener(OPEN_COOKIE_PREFERENCES_EVENT, handleOpenPreferences)
    }
  }, [])

  const applyPreference = (analytics: boolean) => {
    const nextPreference = saveCookieConsent(analytics)
    setPreference(nextPreference)
    setAnalyticsEnabled(analytics)
    setIsSettingsOpen(false)
  }

  const openSettings = () => {
    setAnalyticsEnabled(preference?.analytics ?? false)
    setIsSettingsOpen(true)
  }

  if (preference === undefined) return null

  return (
    <>
      {preference === null && (
        <section
          role="region"
          aria-label="Cookie notice"
          className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-5xl rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl sm:p-6"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex max-w-2xl gap-4">
              <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-onprez-blue sm:flex">
                <Cookie className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-950">Your privacy choices</h2>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  OnPrez uses essential storage for sign-in, security, booking confirmation, and
                  your cookie preference. Optional analytics only run after you agree.
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <Link className="font-medium text-onprez-blue hover:underline" href="/cookies">
                    Cookie policy
                  </Link>
                  <Link className="font-medium text-onprez-blue hover:underline" href="/privacy">
                    Privacy policy
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
              <button
                type="button"
                onClick={() => applyPreference(false)}
                className="min-h-11 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-onprez-blue focus:ring-offset-2"
              >
                Essential only
              </button>
              <button
                type="button"
                onClick={openSettings}
                className="min-h-11 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-onprez-blue focus:ring-offset-2"
              >
                Manage choices
              </button>
              <button
                type="button"
                onClick={() => applyPreference(true)}
                className="min-h-11 rounded-xl bg-gradient-to-r from-onprez-blue to-onprez-purple px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-onprez-blue focus:ring-offset-2"
              >
                Accept optional
              </button>
            </div>
          </div>
        </section>
      )}

      {isSettingsOpen && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-settings-title"
            className="w-full max-w-xl rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-gray-200 p-5 sm:p-6">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-onprez-blue">
                  <Settings className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 id="cookie-settings-title" className="text-xl font-bold text-gray-950">
                    Cookie settings
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Change your choice at any time from the footer.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                aria-label="Close cookie settings"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4 p-5 sm:p-6">
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <div>
                      <h3 className="font-semibold text-gray-950">Essential</h3>
                      <p className="mt-1 text-sm leading-6 text-gray-600">
                        Required for authentication, security, requested booking flows, and saving
                        this preference. These cannot be switched off through the banner.
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Always on
                  </span>
                </div>
              </div>

              <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-gray-200 p-4">
                <div>
                  <span className="font-semibold text-gray-950">Optional analytics</span>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    Helps us understand page usage and improve OnPrez. Analytics are disabled unless
                    you actively enable them.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={analyticsEnabled}
                  onChange={event => setAnalyticsEnabled(event.target.checked)}
                  className="mt-1 h-5 w-5 shrink-0 accent-blue-600"
                  aria-label="Allow optional analytics"
                />
              </label>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-gray-200 p-5 sm:flex-row sm:justify-end sm:p-6">
              <button
                type="button"
                onClick={() => applyPreference(false)}
                className="min-h-11 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-onprez-blue focus:ring-offset-2"
              >
                Use essential only
              </button>
              <button
                type="button"
                onClick={() => applyPreference(analyticsEnabled)}
                className="min-h-11 rounded-xl bg-gradient-to-r from-onprez-blue to-onprez-purple px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-onprez-blue focus:ring-offset-2"
              >
                Save choices
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
