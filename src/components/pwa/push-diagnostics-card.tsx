'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, BellRing, CheckCircle2, Loader2, RefreshCw, Wrench } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { detectInstallPlatform } from '@/lib/pwa/install'
import {
  getPushDeviceName,
  pushSubscriptionUsesVapidKey,
  urlBase64ToUint8Array,
} from '@/lib/pwa/push'

interface SavedSubscription {
  id: string
  endpoint: string
}

interface SubscriptionData {
  configured: boolean
  vapidPublicKey: string | null
  subscriptions: SavedSubscription[]
}

type HealthState =
  | 'loading'
  | 'unsupported'
  | 'unconfigured'
  | 'blocked'
  | 'missing'
  | 'unsaved'
  | 'stale'
  | 'healthy'

async function responseMessage(response: Response, fallback: string): Promise<string> {
  const payload = await response.json().catch(() => null)
  return payload?.message || fallback
}

export function PushDiagnosticsCard() {
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [browserSubscription, setBrowserSubscription] = useState<PushSubscription | null>(null)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [supported, setSupported] = useState(true)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState<'repair' | 'test' | null>(null)
  const [notice, setNotice] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)

    try {
      const pushSupported =
        'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
      setSupported(pushSupported)
      setPermission(pushSupported ? Notification.permission : 'default')

      const response = await fetch('/api/account/push-subscriptions', {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!response.ok) {
        throw new Error(await responseMessage(response, 'Unable to check booking alerts'))
      }

      const payload = await response.json()
      setData(payload.data)

      if (pushSupported) {
        const registration = await navigator.serviceWorker.ready
        setBrowserSubscription(await registration.pushManager.getSubscription())
      } else {
        setBrowserSubscription(null)
      }
    } catch (error) {
      setNotice({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Unable to check booking alerts',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const savedSubscription = useMemo(
    () => data?.subscriptions.find(item => item.endpoint === browserSubscription?.endpoint) || null,
    [browserSubscription, data?.subscriptions]
  )

  const health: HealthState = useMemo(() => {
    if (loading) return 'loading'
    if (!supported) return 'unsupported'
    if (!data?.configured || !data.vapidPublicKey) return 'unconfigured'
    if (permission === 'denied') return 'blocked'
    if (!browserSubscription) return 'missing'
    if (!pushSubscriptionUsesVapidKey(browserSubscription, data.vapidPublicKey)) return 'stale'
    if (!savedSubscription) return 'unsaved'
    return 'healthy'
  }, [browserSubscription, data, loading, permission, savedSubscription, supported])

  const repair = async () => {
    if (!data?.configured || !data.vapidPublicKey || !supported) return

    setWorking('repair')
    setNotice(null)

    try {
      const nextPermission =
        Notification.permission === 'default'
          ? await Notification.requestPermission()
          : Notification.permission
      setPermission(nextPermission)

      if (nextPermission !== 'granted') {
        throw new Error('Allow notifications for OnPrez before repairing booking alerts.')
      }

      const registration = await navigator.serviceWorker.ready
      let subscription = await registration.pushManager.getSubscription()

      if (subscription && !pushSubscriptionUsesVapidKey(subscription, data.vapidPublicKey)) {
        const staleRecord = data.subscriptions.find(
          item => item.endpoint === subscription?.endpoint
        )
        if (staleRecord) {
          await fetch(`/api/account/push-subscriptions/${staleRecord.id}`, {
            method: 'DELETE',
            credentials: 'include',
          }).catch(() => null)
        }
        await subscription.unsubscribe()
        subscription = null
      }

      subscription =
        subscription ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(data.vapidPublicKey),
        }))

      const serialised = subscription.toJSON()
      if (!serialised.endpoint || !serialised.keys?.p256dh || !serialised.keys.auth) {
        throw new Error('The browser returned an incomplete push subscription.')
      }

      const platform = detectInstallPlatform({
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        maxTouchPoints: navigator.maxTouchPoints,
      })
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
        throw new Error(await responseMessage(response, 'Unable to repair booking alerts'))
      }

      setBrowserSubscription(subscription)
      setNotice({
        tone: 'success',
        text: 'This device now has a fresh booking-alert subscription. Send a test alert to verify delivery.',
      })
      await refresh()
    } catch (error) {
      setNotice({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Unable to repair booking alerts',
      })
    } finally {
      setWorking(null)
    }
  }

  const sendTest = async () => {
    setWorking('test')
    setNotice(null)

    try {
      const response = await fetch('/api/account/push-subscriptions/test', {
        method: 'POST',
        credentials: 'include',
      })
      const message = await responseMessage(response, 'Unable to send the test alert')

      if (!response.ok) throw new Error(message)
      setNotice({ tone: 'success', text: message })
      await refresh()
    } catch (error) {
      setNotice({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Unable to send the test alert',
      })
    } finally {
      setWorking(null)
    }
  }

  const status = {
    loading: {
      title: 'Checking the complete push connection…',
      text: 'OnPrez is checking browser permission, the device subscription, and the server record.',
      tone: 'text-gray-600',
    },
    unsupported: {
      title: 'Web Push is not supported here',
      text: 'Use the installed OnPrez app or a browser that supports push notifications.',
      tone: 'text-amber-800',
    },
    unconfigured: {
      title: 'The server push configuration is invalid',
      text: 'The VAPID public and private keys may be missing or may not belong to the same key pair.',
      tone: 'text-red-800',
    },
    blocked: {
      title: 'Notifications are blocked',
      text: 'Allow notifications for OnPrez in the device settings, then return and repair the connection.',
      tone: 'text-red-800',
    },
    missing: {
      title: 'Permission is allowed, but this device is not subscribed',
      text: 'Notification permission alone cannot receive booking alerts. Create the missing push subscription below.',
      tone: 'text-amber-800',
    },
    unsaved: {
      title: 'The browser subscription is not saved to your OnPrez account',
      text: 'Repair the connection so booking events can target this device.',
      tone: 'text-amber-800',
    },
    stale: {
      title: 'This device uses an old VAPID key',
      text: 'The browser still has a subscription from an earlier key pair. Repairing it will replace the stale subscription.',
      tone: 'text-amber-800',
    },
    healthy: {
      title: 'This device is fully connected',
      text: 'Permission, browser subscription, VAPID key, and OnPrez account record all match.',
      tone: 'text-emerald-800',
    },
  }[health]

  return (
    <Card hover={false} className="border-blue-200">
      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-onprez-blue">
              {health === 'healthy' ? (
                <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
              ) : health === 'loading' ? (
                <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
              ) : (
                <AlertTriangle className="h-6 w-6" aria-hidden="true" />
              )}
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-onprez-blue">
                Delivery check
              </p>
              <h2 className={`mt-1 text-lg font-bold ${status.tone}`}>{status.title}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">{status.text}</p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-3">
            {health === 'healthy' ? (
              <Button type="button" size="sm" disabled={Boolean(working)} onClick={sendTest}>
                {working === 'test' ? (
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <BellRing className="mr-2 inline h-4 w-4" aria-hidden="true" />
                )}
                Send test alert
              </Button>
            ) : (
              !['loading', 'unsupported', 'unconfigured'].includes(health) && (
                <Button type="button" size="sm" disabled={Boolean(working)} onClick={repair}>
                  {working === 'repair' ? (
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Wrench className="mr-2 inline h-4 w-4" aria-hidden="true" />
                  )}
                  Repair booking alerts
                </Button>
              )
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={Boolean(working)}
              onClick={refresh}
            >
              <RefreshCw className="mr-2 inline h-4 w-4" aria-hidden="true" />
              Recheck
            </Button>
          </div>
        </div>

        {notice && (
          <p
            className={`mt-5 rounded-xl border p-4 text-sm leading-6 ${
              notice.tone === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
            role="status"
          >
            {notice.text}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
