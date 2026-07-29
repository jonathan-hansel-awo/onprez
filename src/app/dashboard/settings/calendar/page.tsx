'use client'

import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  CalendarCheck2,
  CheckCircle2,
  ExternalLink,
  Loader2,
  RefreshCw,
  Unplug,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface CalendarStatus {
  business: { id: string; name: string }
  configured: boolean
  connected: boolean
  connection: null | {
    accountEmail: string | null
    calendarId: string
    connectedAt: string
    lastSyncedAt: string | null
    lastError: string | null
  }
}

const RESULT_MESSAGES: Record<string, { type: 'success' | 'error'; message: string }> = {
  connected: { type: 'success', message: 'Google Calendar connected successfully.' },
  cancelled: { type: 'error', message: 'Google Calendar connection was cancelled.' },
  invalid: {
    type: 'error',
    message: 'The Google Calendar connection request expired or was invalid.',
  },
  unauthorized: {
    type: 'error',
    message: 'Please sign in again before connecting Google Calendar.',
  },
  'refresh-token-missing': {
    type: 'error',
    message:
      'Google did not provide offline access. Disconnect OnPrez in your Google Account and try again.',
  },
  error: { type: 'error', message: 'Google Calendar could not be connected. Please try again.' },
}

export default function CalendarSettingsPage() {
  const [status, setStatus] = useState<CalendarStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const result = new URLSearchParams(window.location.search).get('google')
    if (result && RESULT_MESSAGES[result]) {
      const message = RESULT_MESSAGES[result]
      if (message.type === 'success') setNotice(message.message)
      else setError(message.message)
    }
    void loadStatus()
  }, [])

  async function loadStatus() {
    try {
      setLoading(true)
      const response = await fetch('/api/business/calendar/google/status', { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok || !payload.success)
        throw new Error(payload.error || 'Failed to load calendar settings')
      setStatus(payload.data)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load calendar settings')
    } finally {
      setLoading(false)
    }
  }

  async function connect() {
    try {
      setWorking(true)
      setError('')
      const response = await fetch('/api/business/calendar/google/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: status?.business.id }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.success)
        throw new Error(payload.error || 'Failed to connect Google Calendar')
      window.location.assign(payload.data.url)
    } catch (connectError) {
      setError(
        connectError instanceof Error ? connectError.message : 'Failed to connect Google Calendar'
      )
      setWorking(false)
    }
  }

  async function disconnect() {
    try {
      setWorking(true)
      setError('')
      const response = await fetch('/api/business/calendar/google/disconnect', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: status?.business.id }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.success)
        throw new Error(payload.error || 'Failed to disconnect Google Calendar')
      setNotice('Google Calendar disconnected.')
      await loadStatus()
    } catch (disconnectError) {
      setError(
        disconnectError instanceof Error
          ? disconnectError.message
          : 'Failed to disconnect Google Calendar'
      )
    } finally {
      setWorking(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-onprez-blue" aria-label="Loading" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Calendar Integration</h1>
        <p className="mt-2 text-gray-600">
          Connect Google Calendar so every confirmed booking is added automatically and stays in
          sync when it is rescheduled or cancelled.
        </p>
      </div>

      {notice && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-900">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{notice}</p>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck2 className="h-5 w-5 text-onprez-blue" />
            Google Calendar
          </CardTitle>
          <CardDescription>
            OnPrez requests permission to create, update and remove only the booking events it
            manages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {!status?.configured ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              Google Calendar OAuth has not yet been configured for this OnPrez environment.
            </div>
          ) : status.connected && status.connection ? (
            <>
              <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
                  <div>
                    <p className="font-semibold text-green-950">Google Calendar is connected</p>
                    <p className="mt-1 text-sm text-green-800">
                      {status.connection.accountEmail || 'Connected Google account'} · Primary
                      calendar
                    </p>
                  </div>
                </div>
              </div>

              <dl className="grid gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-gray-500">Connected</dt>
                  <dd className="mt-1 font-medium text-gray-900">
                    {new Date(status.connection.connectedAt).toLocaleString('en-GB')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Last successful sync</dt>
                  <dd className="mt-1 font-medium text-gray-900">
                    {status.connection.lastSyncedAt
                      ? new Date(status.connection.lastSyncedAt).toLocaleString('en-GB')
                      : 'No confirmed booking synced yet'}
                  </dd>
                </div>
              </dl>

              {status.connection.lastError && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  Last sync issue: {status.connection.lastError}. Reconnect Google Calendar if the
                  issue persists.
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Button variant="ghost" onClick={loadStatus} disabled={working}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh status
                </Button>
                <a
                  href="https://calendar.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-lg border-2 border-onprez-blue px-5 py-3 font-semibold text-onprez-blue transition hover:bg-onprez-blue/5"
                >
                  Open Google Calendar
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
                <Button variant="danger" onClick={disconnect} disabled={working}>
                  {working ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Unplug className="mr-2 h-4 w-4" />
                  )}
                  Disconnect
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-5 rounded-2xl border border-dashed border-gray-300 p-6 text-center">
              <CalendarCheck2 className="mx-auto h-11 w-11 text-onprez-blue" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Connect Google Calendar</h2>
                <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                  Confirmed bookings will be created on your primary Google Calendar. Reschedules
                  update the same event and cancellations remove it.
                </p>
              </div>
              <Button onClick={connect} disabled={working}>
                {working && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Connect Google Calendar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-5 text-sm leading-6 text-blue-900">
          Customers also receive Google Calendar, Outlook Calendar and downloadable .ics options in
          confirmed-booking and reschedule emails. Pending requests do not create calendar events
          until they are confirmed.
        </CardContent>
      </Card>
    </div>
  )
}
