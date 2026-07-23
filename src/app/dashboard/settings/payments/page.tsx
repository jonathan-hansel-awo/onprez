'use client'

import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { BookingProtectionConfigurator } from '@/components/booking-protection/booking-protection-configurator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface StripeStatusResponse {
  business: { id: string; name: string; slug: string }
  ownerOnly: boolean
  entitlement: {
    enabled: boolean
    source: 'ALPHA' | 'SUBSCRIPTION' | 'PROMOTION' | 'ADMIN' | null
    expiresAt: string | null
  }
  platform: {
    connectConfigured: boolean
    webhookConfigured: boolean
  }
  account: null | {
    stripeAccountId: string
    country: string | null
    defaultCurrency: string | null
    detailsSubmitted: boolean
    chargesEnabled: boolean
    payoutsEnabled: boolean
    status: 'PENDING' | 'RESTRICTED' | 'READY' | 'DISCONNECTED'
    disabledReason: string | null
    requirementsDue: string[]
    requirementsPastDue: string[]
    requirementsEventuallyDue: string[]
    lastSyncedAt: string | null
  }
  syncWarning: string | null
}

const STATUS_COPY = {
  PENDING: {
    title: 'Stripe setup in progress',
    description: 'Finish the Stripe verification steps before deposits can be enabled.',
    className: 'border-blue-200 bg-blue-50 text-blue-900',
  },
  RESTRICTED: {
    title: 'Stripe needs more information',
    description: 'Stripe has requested additional information before payments or payouts can work.',
    className: 'border-amber-200 bg-amber-50 text-amber-900',
  },
  READY: {
    title: 'Stripe connected and ready',
    description: 'Payments and payouts are enabled for this business.',
    className: 'border-green-200 bg-green-50 text-green-900',
  },
  DISCONNECTED: {
    title: 'Stripe account disconnected',
    description: 'Reconnect Stripe to prepare this business for booking deposits.',
    className: 'border-red-200 bg-red-50 text-red-900',
  },
} as const

function formatRequirement(requirement: string) {
  return requirement
    .split('.')
    .pop()
    ?.replace(/_/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase())
}

export default function PaymentsSettingsPage() {
  const [status, setStatus] = useState<StripeStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const result = new URLSearchParams(window.location.search).get('stripe')

    if (result === 'ready') setNotice('Stripe setup is complete and the account is ready.')
    if (result === 'returned') {
      setNotice('Stripe saved your information. Complete any remaining requirements shown below.')
    }
    if (result === 'error') setError('Stripe setup could not be completed. Please try again.')

    void loadStatus()
  }, [])

  async function loadStatus() {
    try {
      setLoading(true)
      const response = await fetch('/api/business/payments/stripe/status', { cache: 'no-store' })
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to load payment settings')
      }

      setStatus(payload.data)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load payment settings')
    } finally {
      setLoading(false)
    }
  }

  async function startOnboarding() {
    try {
      setConnecting(true)
      setError('')

      const response = await fetch('/api/business/payments/stripe/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: status?.business.id }),
      })
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to start Stripe setup')
      }

      window.location.assign(payload.data.url)
    } catch (connectError) {
      setError(
        connectError instanceof Error ? connectError.message : 'Failed to start Stripe setup'
      )
      setConnecting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-onprez-blue" aria-label="Loading" />
      </div>
    )
  }

  const account = status?.account
  const accountStatus = account ? STATUS_COPY[account.status] : null
  const entitlementLabel =
    status?.entitlement.source === 'ALPHA' ? 'Complimentary Alpha access' : 'Premium access'

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">Payments &amp; Booking Protection</h1>
          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800">
            Premium
          </span>
        </div>
        <p className="mt-2 max-w-3xl text-gray-600">
          Connect the business directly to Stripe so customers can later pay booking deposits into
          its own Stripe balance. OnPrez does not collect bank or card details.
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

      {!status?.entitlement.enabled ? (
        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LockKeyhole className="h-5 w-5 text-purple-700" />
              Booking Protection is not enabled
            </CardTitle>
            <CardDescription>
              This premium feature is currently available to selected Alpha businesses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-gray-600">
              When enabled, the business owner can connect Stripe once and later choose which
              services require a booking deposit.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Stripe account
                  </CardTitle>
                  <CardDescription className="mt-2">{entitlementLabel}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={loadStatus} disabled={loading}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh status
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {!status.platform.connectConfigured ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                  Stripe Connect has not yet been configured for this OnPrez environment.
                </div>
              ) : !account ? (
                <div className="space-y-4 rounded-2xl border border-dashed border-gray-300 p-6 text-center">
                  <ShieldCheck className="mx-auto h-10 w-10 text-onprez-blue" />
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Connect with Stripe</h2>
                    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-600">
                      Stripe will securely collect identity, business and payout information. These
                      details are entered on Stripe, not OnPrez.
                    </p>
                  </div>
                  <Button onClick={startOnboarding} disabled={connecting}>
                    {connecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Connect with Stripe
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className={`rounded-xl border p-4 ${accountStatus?.className}`}>
                    <div className="flex items-start gap-3">
                      {account.status === 'READY' ? (
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                      ) : (
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                      )}
                      <div>
                        <p className="font-semibold">{accountStatus?.title}</p>
                        <p className="mt-1 text-sm">{accountStatus?.description}</p>
                      </div>
                    </div>
                  </div>

                  {status.syncWarning && (
                    <p className="text-sm text-amber-700">{status.syncWarning}</p>
                  )}

                  <dl className="grid gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm text-gray-500">Payments</dt>
                      <dd className="mt-1 font-medium text-gray-900">
                        {account.chargesEnabled ? 'Enabled' : 'Not enabled'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Payouts</dt>
                      <dd className="mt-1 font-medium text-gray-900">
                        {account.payoutsEnabled ? 'Enabled' : 'Not enabled'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Country</dt>
                      <dd className="mt-1 font-medium text-gray-900">{account.country || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Last checked</dt>
                      <dd className="mt-1 font-medium text-gray-900">
                        {account.lastSyncedAt
                          ? new Date(account.lastSyncedAt).toLocaleString()
                          : 'Not yet checked'}
                      </dd>
                    </div>
                  </dl>

                  {(account.requirementsDue.length > 0 ||
                    account.requirementsPastDue.length > 0) && (
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Information Stripe still needs
                      </h3>
                      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-600">
                        {[...account.requirementsPastDue, ...account.requirementsDue]
                          .filter((value, index, values) => values.indexOf(value) === index)
                          .map(requirement => (
                            <li key={requirement}>{formatRequirement(requirement)}</li>
                          ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    {account.status !== 'READY' && (
                      <Button onClick={startOnboarding} disabled={connecting}>
                        {connecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Continue Stripe setup
                      </Button>
                    )}
                    {account.status === 'READY' && (
                      <a
                        href="https://dashboard.stripe.com"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-lg border-2 border-onprez-blue px-5 py-3 font-semibold text-onprez-blue transition hover:bg-onprez-blue/5"
                      >
                        Open Stripe Dashboard
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <BookingProtectionConfigurator
            businessId={status.business.id}
            enabled={account?.status === 'READY'}
          />

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
                <div>
                  <h2 className="font-semibold text-blue-950">
                    No customer payments are active yet
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-blue-900">
                    This phase only connects and verifies the professional's Stripe account. Service
                    deposit rules are now configurable, but customer checkout remains disabled until
                    Phase 4.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
