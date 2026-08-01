'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, Mail, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DeliveryEvent {
  id: string
  type: string
  status: string
  occurredAt: string
}

interface Delivery {
  id: string
  category: string
  audience: string
  status: string
  recipientMasked: string
  attempts: number
  maxAttempts: number
  lastAttemptAt: string
  deliveredAt?: string | null
  lastError?: string | null
  canRetry: boolean
  events: DeliveryEvent[]
}

const CATEGORY_LABELS: Record<string, string> = {
  BOOKING_CUSTOMER_CONFIRMATION: 'Booking confirmation',
  BOOKING_BUSINESS_NOTIFICATION: 'New booking alert',
  APPOINTMENT_STATUS_UPDATE: 'Booking status update',
  APPOINTMENT_REMINDER: 'Appointment reminder',
  INQUIRY_CUSTOMER_ACKNOWLEDGEMENT: 'Inquiry acknowledgement',
  INQUIRY_BUSINESS_NOTIFICATION: 'New inquiry alert',
}

const STATUS_STYLES: Record<string, string> = {
  DELIVERED: 'border-green-200 bg-green-50 text-green-700',
  SENT: 'border-blue-200 bg-blue-50 text-blue-700',
  PENDING: 'border-gray-200 bg-gray-50 text-gray-700',
  DELAYED: 'border-amber-200 bg-amber-50 text-amber-800',
  FAILED: 'border-red-200 bg-red-50 text-red-700',
  BOUNCED: 'border-red-200 bg-red-50 text-red-700',
  COMPLAINED: 'border-red-200 bg-red-50 text-red-700',
  SUPPRESSED: 'border-red-200 bg-red-50 text-red-700',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function EmailDeliveryHistory() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [retryingId, setRetryingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const loadDeliveries = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      const response = await fetch(`/api/business/email-deliveries?${params.toString()}`, {
        cache: 'no-store',
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load email delivery history')
      }
      setDeliveries(data.data.deliveries)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load delivery history')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    void loadDeliveries()
  }, [loadDeliveries])

  async function retryDelivery(deliveryId: string) {
    setRetryingId(deliveryId)
    setError('')
    try {
      const response = await fetch(`/api/business/email-deliveries/${deliveryId}/retry`, {
        method: 'POST',
      })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || 'Email retry failed')
      await loadDeliveries()
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : 'Email retry failed')
    } finally {
      setRetryingId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-onprez-blue" />
            <CardTitle>Email delivery history</CardTitle>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <span>Status</span>
            <select
              value={status}
              onChange={event => setStatus(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2"
            >
              <option value="">All</option>
              <option value="DELIVERED">Delivered</option>
              <option value="SENT">Sent</option>
              <option value="DELAYED">Delayed</option>
              <option value="FAILED">Failed</option>
              <option value="BOUNCED">Bounced</option>
              <option value="COMPLAINED">Complained</option>
              <option value="SUPPRESSED">Suppressed</option>
            </select>
          </label>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm leading-6 text-gray-600">
          Resend delivery events appear here without storing full recipient addresses or message
          bodies. Failed or temporarily delayed messages can be retried up to three times. Bounces,
          complaints and suppressions cannot be retried.
        </p>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-32 items-center justify-center">
            <Loader2
              className="h-6 w-6 animate-spin text-onprez-blue"
              aria-label="Loading history"
            />
          </div>
        ) : deliveries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-600">
            No tracked email deliveries match this filter yet.
          </div>
        ) : (
          <div className="space-y-3">
            {deliveries.map(delivery => {
              const failed = ['FAILED', 'BOUNCED', 'COMPLAINED', 'SUPPRESSED'].includes(
                delivery.status
              )
              return (
                <article key={delivery.id} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {failed ? (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                        <h3 className="font-semibold text-gray-900">
                          {CATEGORY_LABELS[delivery.category] || 'Transactional email'}
                        </h3>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[delivery.status] || STATUS_STYLES.PENDING}`}
                        >
                          {delivery.status.toLowerCase().replace('_', ' ')}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {delivery.audience === 'BUSINESS' ? 'Business' : 'Customer'} ·{' '}
                        {delivery.recipientMasked} · {formatDate(delivery.lastAttemptAt)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Attempt {delivery.attempts} of {delivery.maxAttempts}
                        {delivery.events[0] ? ` · Latest: ${delivery.events[0].type}` : ''}
                      </p>
                      {delivery.lastError && (
                        <p className="mt-2 text-sm text-red-700">{delivery.lastError}</p>
                      )}
                      {delivery.events.length > 0 && (
                        <details className="mt-3 text-sm text-gray-600">
                          <summary className="cursor-pointer font-medium text-onprez-blue">
                            View status history
                          </summary>
                          <ol className="mt-2 space-y-1 border-l border-gray-200 pl-3">
                            {delivery.events.map(event => (
                              <li key={event.id}>
                                {event.type} · {event.status.toLowerCase()} ·{' '}
                                {formatDate(event.occurredAt)}
                              </li>
                            ))}
                          </ol>
                        </details>
                      )}
                    </div>

                    {delivery.canRetry && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={retryingId === delivery.id}
                        onClick={() => void retryDelivery(delivery.id)}
                      >
                        {retryingId === delivery.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Retry
                      </Button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
