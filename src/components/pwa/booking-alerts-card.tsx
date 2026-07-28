'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, Bell, BellOff, CheckCircle2, Loader2, Smartphone, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { detectInstallPlatform, isStandaloneDisplay, type InstallPlatform } from '@/lib/pwa/install'
import { getPushDeviceName, urlBase64ToUint8Array } from '@/lib/pwa/push'

interface PushPreferences {
  newBookingEnabled: boolean
  cancellationEnabled: boolean
  rescheduleEnabled: boolean
}

interface SavedSubscription {
  id: string
  endpoint: string
  deviceName: string | null
  expiresAt: string | null
  lastSeenAt: string
  createdAt: string
}

interface SubscriptionData {
  configured: boolean
  vapidPublicKey: string | null
  subscriptions: SavedSubscription[]
  preferences: PushPreferences
  subscriptionLimit: number
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean
}

const preferenceRows: Array<{
  key: keyof PushPreferences
  title: string
  description: string
}> = [
  {
    key: 'newBookingEnabled',
    title: 'New bookings',
    description: 'When a customer completes a booking.',
  },
  {
    key: 'cancellationEnabled',
    title: 'Cancellations',
    description: 'When a confirmed booking is cancelled.',
  },
  {
    key: 'rescheduleEnabled',
    title: 'Reschedules',
    description: 'When the date or time of a booking changes.',
  },
]

async function readError(response: Response, fallback: string): Promise<string> {
  const payload = await response.json().catch(() => null)
  return payload?.message || fallback
}

export function BookingAlertsCard() {
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [browserSubscription, setBrowserSubscription] = useState<PushSubscription | null>(null)
  const [platform, setPlatform] = useState<InstallPlatform>('desktop')
  const [isInstalled, setIsInstalled] = useState(false)
  const [supported, setSupported] = useState(true)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)

    try {
      const nextPlatform = detectInstallPlatform({
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        maxTouchPoints: navigator.maxTouchPoints,
      })
      const navigatorWithStandalone = navigator as NavigatorWithStandalone
      const standalone = isStandaloneDisplay(
        window.matchMedia('(display-mode: standalone)').matches,
        navigatorWithStandalone.standalone === true
      )
      const pushSupported =
        'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

      setPlatform(nextPlatform)
      setIsInstalled(standalone)
      setSupported(pushSupported)
      setPermission(pushSupported ? Notification.permission : 'default')

      const response = await fetch('/api/account/push-subscriptions', {
        credentials: 'include',
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error(await readError(response, 'Unable to load booking alert settings'))
      }

      const payload = await response.json()
      setData(payload.data)

      if (pushSupported) {
        const registration = await navigator.serviceWorker.ready
        setBrowserSubscription(await registration.pushManager.getSubscription())
      }
    } catch (error) {
      setNotice({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Unable to load booking alert settings',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const currentSavedSubscription = useMemo(
    () => data?.subscriptions.find(item => item.endpoint === browserSubscription?.endpoint) || null,
    [browserSubscription, data?.subscriptions]
  )

  const enableAlerts = async () => {
    if (!data?.configured || !data.vapidPublicKey || !supported) return

    setWorking('enable')
    setNotice(null)
    let createdSubscription: PushSubscription | null = null

    try {
      const nextPermission =
        Notification.permission === 'default'
          ? await Notification.requestPermission()
          : Notification.permission

      setPermission(nextPermission)

      if (nextPermission !== 'granted') {
        throw new Error(
          nextPermission === 'denied'
            ? 'Notifications are blocked in your browser settings.'
            : 'Notification permission was not granted.'
        )
      }

      const registration = await navigator.serviceWorker.ready
      createdSubscription =
        (await registration.pushManager.getSubscription()) ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(data.vapidPublicKey),
        }))

      const serialised = createdSubscription.toJSON()

      if (!serialised.endpoint || !serialised.keys?.p256dh || !serialised.keys.auth) {
        throw new Error('The browser returned an incomplete push subscription.')
      }

      const response = await fetch('/api/account/push-subscriptions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          endpoint: serialised.endpoint,
          expirationTime: serialised.expirationTime ?? null,
          keys: serialised.keys,
          deviceName: getPushDeviceName(platform),
        }),
      })

      if (!response.ok) {
        await createdSubscription.unsubscribe()
        throw new Error(await readError(response, 'Unable to enable booking alerts'))
      }

      setBrowserSubscription(createdSubscription)
      setNotice({ tone: 'success', text: 'Booking alerts are enabled on this device.' })
      await refresh()
    } catch (error) {
      setNotice({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Unable to enable booking alerts',
      })
    } finally {
      setWorking(null)
    }
  }

  const removeSubscription = async (subscription: SavedSubscription) => {
    setWorking(subscription.id)
    setNotice(null)

    try {
      const response = await fetch(`/api/account/push-subscriptions/${subscription.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(await readError(response, 'Unable to remove this device'))
      }

      if (browserSubscription?.endpoint === subscription.endpoint) {
        await browserSubscription.unsubscribe()
        setBrowserSubscription(null)
      }

      setNotice({ tone: 'success', text: 'Booking alerts were removed from that device.' })
      await refresh()
    } catch (error) {
      setNotice({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Unable to remove this device',
      })
    } finally {
      setWorking(null)
    }
  }

  const updatePreference = async (key: keyof PushPreferences, enabled: boolean) => {
    if (!data) return

    const nextPreferences = { ...data.preferences, [key]: enabled }
    setWorking(key)
    setNotice(null)

    try {
      const response = await fetch('/api/account/notification-preferences', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(nextPreferences),
      })

      if (!response.ok) {
        throw new Error(await readError(response, 'Unable to update notification preferences'))
      }

      setData(current => (current ? { ...current, preferences: nextPreferences } : current))
    } catch (error) {
      setNotice({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Unable to update notification preferences',
      })
    } finally {
      setWorking(null)
    }
  }

  const installRequired = platform === 'ios' && !isInstalled
  const enabledOnDevice = Boolean(currentSavedSubscription && browserSubscription)

  return (
    <Card hover={false} className="overflow-hidden border-violet-200">
      <CardContent className="p-0">
        <div className="bg-gradient-to-br from-violet-50 via-white to-blue-50 p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex max-w-2xl items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-onprez-blue to-onprez-purple text-white shadow-lg shadow-violet-600/20">
                <Bell className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-950">Booking push notifications</h2>
                  {enabledOnDevice && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Enabled here
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm leading-6 text-gray-600 sm:text-base">
                  Choose which important booking changes OnPrez can send to your enabled devices.
                  Email notifications continue independently.
                </p>
              </div>
            </div>

            {!loading && data?.configured && supported && !installRequired && (
              <Button
                type="button"
                size="sm"
                variant={enabledOnDevice ? 'outline' : 'primary'}
                disabled={Boolean(working)}
                onClick={() =>
                  enabledOnDevice && currentSavedSubscription
                    ? removeSubscription(currentSavedSubscription)
                    : enableAlerts()
                }
              >
                {working === 'enable' ||
                (currentSavedSubscription && working === currentSavedSubscription.id) ? (
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden="true" />
                ) : enabledOnDevice ? (
                  <BellOff className="mr-2 inline h-4 w-4" aria-hidden="true" />
                ) : (
                  <Bell className="mr-2 inline h-4 w-4" aria-hidden="true" />
                )}
                {enabledOnDevice ? 'Disable on this device' : 'Enable booking alerts'}
              </Button>
            )}
          </div>

          {loading && (
            <p className="mt-6 flex items-center gap-2 text-sm text-gray-600" role="status">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Checking this device…
            </p>
          )}

          {!loading && !data?.configured && (
            <p className="mt-6 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              Booking push notifications are being prepared and cannot be enabled yet.
            </p>
          )}

          {!loading && data?.configured && !supported && (
            <p className="mt-6 flex gap-2 rounded-xl border border-gray-200 bg-white p-4 text-sm leading-6 text-gray-700">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              This browser does not support Web Push. You can continue receiving booking emails.
            </p>
          )}

          {!loading && data?.configured && installRequired && (
            <p className="mt-6 flex gap-2 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
              <Smartphone className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              On iPhone and iPad, first add OnPrez to your Home Screen, then open it from the new
              icon and return here to enable booking alerts.
            </p>
          )}

          {!loading && permission === 'denied' && (
            <p className="mt-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
              <BellOff className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              Notifications are blocked. Allow notifications for OnPrez in your browser or device
              settings, then return here.
            </p>
          )}

          {notice && (
            <p
              className={`mt-4 flex gap-2 rounded-xl border p-4 text-sm leading-6 ${
                notice.tone === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-red-200 bg-red-50 text-red-800'
              }`}
              role="status"
            >
              {notice.tone === 'success' ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              ) : (
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              )}
              {notice.text}
            </p>
          )}
        </div>

        {data && (
          <div className="grid border-t border-gray-200 lg:grid-cols-2">
            <section className="p-6 sm:p-8 lg:border-r lg:border-gray-200">
              <h3 className="font-semibold text-gray-950">Alert me about</h3>
              <div className="mt-4 divide-y divide-gray-100">
                {preferenceRows.map(row => (
                  <div key={row.key} className="flex items-center justify-between gap-4 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{row.title}</p>
                      <p className="mt-1 text-sm leading-5 text-gray-500">{row.description}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={data.preferences[row.key]}
                      aria-label={`${row.title} push notifications`}
                      disabled={Boolean(working)}
                      onClick={() => updatePreference(row.key, !data.preferences[row.key])}
                      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:cursor-wait disabled:opacity-60 ${
                        data.preferences[row.key] ? 'bg-onprez-blue' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                          data.preferences[row.key] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="border-t border-gray-200 p-6 sm:p-8 lg:border-t-0">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-950">Enabled devices</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {data.subscriptions.length} of {data.subscriptionLimit} devices
                  </p>
                </div>
              </div>

              {data.subscriptions.length === 0 ? (
                <p className="mt-5 rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-600">
                  No devices are enabled yet. Use the button above on each device where you want to
                  receive booking alerts.
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-gray-100">
                  {data.subscriptions.map(subscription => {
                    const isCurrent = subscription.endpoint === browserSubscription?.endpoint

                    return (
                      <li key={subscription.id} className="flex items-center gap-3 py-4">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gray-100 text-gray-600">
                          <Smartphone className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {subscription.deviceName || 'OnPrez device'}
                            {isCurrent && (
                              <span className="ml-2 text-xs font-semibold text-emerald-700">
                                This device
                              </span>
                            )}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Enabled {new Date(subscription.createdAt).toLocaleDateString('en-GB')}
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label={`Remove ${subscription.deviceName || 'device'}`}
                          disabled={Boolean(working)}
                          onClick={() => removeSubscription(subscription)}
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-wait disabled:opacity-60"
                        >
                          {working === subscription.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          ) : (
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
