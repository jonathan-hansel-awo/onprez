'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowDownToLine,
  Banknote,
  CheckCircle2,
  Clock3,
  CreditCard,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldCheck,
  WalletCards,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type MoneyAmount = {
  amountMinor: number
  currency: string
}

type MoneyDashboardData = {
  business: {
    id: string
    name: string
    slug: string
  }
  account: {
    connected: boolean
    status: 'PENDING' | 'RESTRICTED' | 'READY' | 'DISCONNECTED' | null
    chargesEnabled: boolean
    payoutsEnabled: boolean
    defaultCurrency: string
    lastSyncedAt: string | null
  }
  summary: {
    verifiedGrossMinor: number
    refundedMinor: number
    retainedAfterFullRefundsMinor: number
    verifiedCount: number
    refundedCount: number
    pendingCount: number
    failedCount: number
  }
  balance: null | {
    available: MoneyAmount[]
    pending: MoneyAmount[]
    livemode: boolean
  }
  payouts: Array<{
    id: string
    amountMinor: number
    currency: string
    status: string
    createdAt: string
    expectedArrivalAt: string | null
    method: string
    type: string
    automatic: boolean
    statementDescriptor: string | null
    failureCode: string | null
    failureMessage: string | null
  }>
  payments: Array<{
    id: string
    appointmentId: string
    customerName: string
    serviceName: string
    appointmentStartTime: string
    amountMinor: number
    currency: string
    status: string
    refundStatus: string
    refundReason: string | null
    reference: string | null
    paidAt: string | null
    failedAt: string | null
    refundedAt: string | null
    createdAt: string
    updatedAt: string
  }>
  liveStripeDataAvailable: boolean
  warnings: string[]
  generatedAt: string
}

const PAYMENT_STATUS_COPY: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Awaiting payment', className: 'bg-gray-100 text-gray-700' },
  REQUIRES_ACTION: { label: 'Customer action needed', className: 'bg-amber-100 text-amber-800' },
  PROCESSING: { label: 'Being verified', className: 'bg-blue-100 text-blue-800' },
  SUCCEEDED: { label: 'Paid and verified', className: 'bg-green-100 text-green-800' },
  FAILED: { label: 'Payment failed', className: 'bg-red-100 text-red-800' },
  CANCELLED: { label: 'Cancelled', className: 'bg-gray-100 text-gray-700' },
  PARTIALLY_REFUNDED: { label: 'Partly refunded', className: 'bg-purple-100 text-purple-800' },
  REFUNDED: { label: 'Refunded', className: 'bg-purple-100 text-purple-800' },
}

const PAYOUT_STATUS_COPY: Record<string, { label: string; className: string }> = {
  pending: { label: 'Preparing', className: 'bg-amber-100 text-amber-800' },
  in_transit: { label: 'On the way', className: 'bg-blue-100 text-blue-800' },
  paid: { label: 'Sent to bank', className: 'bg-green-100 text-green-800' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-800' },
  canceled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-700' },
}

function formatMoney(amountMinor: number, currency = 'GBP') {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(amountMinor / 100)
}

function formatDate(value: string | null) {
  if (!value) return 'Not provided by Stripe'
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatDateTime(value: string | null) {
  if (!value) return 'Not recorded'
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function amountForCurrency(amounts: MoneyAmount[] | undefined, currency: string) {
  return amounts?.find(amount => amount.currency === currency)?.amountMinor ?? 0
}

function StatusBadge({ status, payout = false }: { status: string; payout?: boolean }) {
  const copy = payout
    ? PAYOUT_STATUS_COPY[status] || {
        label: status.replace(/_/g, ' '),
        className: 'bg-gray-100 text-gray-700',
      }
    : PAYMENT_STATUS_COPY[status] || {
        label: status.replace(/_/g, ' '),
        className: 'bg-gray-100 text-gray-700',
      }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${copy.className}`}
    >
      {copy.label}
    </span>
  )
}

export default function MoneyDashboardPage() {
  const [data, setData] = useState<MoneyDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const loadMoney = useCallback(async (manual = false) => {
    try {
      manual ? setRefreshing(true) : setLoading(true)
      setError('')

      const response = await fetch('/api/dashboard/money', { cache: 'no-store' })
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to load booking-fee information')
      }

      setData(payload.data)
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Failed to load booking-fee information'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadMoney()
  }, [loadMoney])

  const currency = data?.account.defaultCurrency || 'GBP'
  const pendingBalanceMinor = useMemo(
    () => amountForCurrency(data?.balance?.pending, currency),
    [currency, data?.balance?.pending]
  )
  const availableBalanceMinor = useMemo(
    () => amountForCurrency(data?.balance?.available, currency),
    [currency, data?.balance?.available]
  )
  const latestPayout = data?.payouts[0] || null

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-onprez-blue" aria-label="Loading money" />
      </div>
    )
  }

  if (!data && error) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-950">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <h1 className="font-semibold">Money information could not be loaded</h1>
            <p className="mt-1 text-sm">{error}</p>
            <Button className="mt-4" onClick={() => void loadMoney()}>
              Try again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-950">Money</h1>
          <p className="mt-2 max-w-3xl text-gray-600">
            Track booking fees, current Stripe balances and payouts without leaving OnPrez.
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadMoney(true)} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-green-950">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
          <div>
            <h2 className="font-semibold">Your money goes directly to your Stripe account</h2>
            <p className="mt-1 text-sm leading-6 text-green-900">
              OnPrez verifies the booking fee and links it to the booking. OnPrez never receives,
              holds or controls your money or bank payouts.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {data.warnings.map(warning => (
        <div
          key={warning}
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm leading-6">{warning}</p>
        </div>
      ))}

      {!data.account.connected ? (
        <Card className="border-dashed border-gray-300">
          <CardContent className="p-8 text-center">
            <CreditCard className="mx-auto h-10 w-10 text-onprez-blue" />
            <h2 className="mt-4 text-xl font-semibold text-gray-950">
              Connect Stripe to take booking fees
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-600">
              Once connected, this page will show booking-fee payments, Stripe balances and payout
              progress in one place.
            </p>
            <Button asChild className="mt-5">
              <Link href="/dashboard/settings/payments">Set up booking payments</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <section aria-labelledby="money-summary-heading">
            <h2 id="money-summary-heading" className="sr-only">
              Money summary
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Verified booking fees</p>
                      <p className="mt-2 text-2xl font-bold text-gray-950">
                        {formatMoney(data.summary.verifiedGrossMinor, currency)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-green-100 p-2.5 text-green-700">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-gray-500">
                    {data.summary.verifiedCount} verified payment
                    {data.summary.verifiedCount === 1 ? '' : 's'} recorded by OnPrez
                    {data.summary.refundedCount > 0
                      ? ` · ${formatMoney(data.summary.refundedMinor, currency)} refunded`
                      : ''}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending at Stripe</p>
                      <p className="mt-2 text-2xl font-bold text-gray-950">
                        {data.balance ? formatMoney(pendingBalanceMinor, currency) : 'Unavailable'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-amber-100 p-2.5 text-amber-700">
                      <Clock3 className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-gray-500">
                    Card payments Stripe is still processing before they become available
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Available at Stripe</p>
                      <p className="mt-2 text-2xl font-bold text-gray-950">
                        {data.balance
                          ? formatMoney(availableBalanceMinor, currency)
                          : 'Unavailable'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
                      <WalletCards className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-gray-500">
                    This can become £0 when Stripe has moved the money into a payout
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Latest payout</p>
                      <p className="mt-2 text-2xl font-bold text-gray-950">
                        {latestPayout
                          ? formatMoney(latestPayout.amountMinor, latestPayout.currency)
                          : 'No payout yet'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-purple-100 p-2.5 text-purple-700">
                      <ArrowDownToLine className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-3 text-xs leading-5 text-gray-500">
                    {latestPayout ? (
                      <>
                        <StatusBadge status={latestPayout.status} payout />
                        <span className="mt-1 block">
                          Stripe arrival date: {formatDate(latestPayout.expectedArrivalAt)}
                        </span>
                      </>
                    ) : (
                      'Stripe will create a payout after funds become eligible'
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Banknote className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
                <div>
                  <h2 className="font-semibold text-blue-950">
                    Why can the available balance show £0?
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-blue-900">
                    When Stripe starts sending money to your bank, it leaves the available balance
                    and appears under payout history. Check the latest payout above rather than
                    assuming the payment has disappeared.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Recent booking fees</CardTitle>
                <CardDescription>
                  OnPrez records these independently when it verifies a protected booking payment.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.payments.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
                    <CreditCard className="mx-auto h-9 w-9 text-gray-400" />
                    <p className="mt-3 font-medium text-gray-900">No booking fees recorded yet</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Verified customer payments will appear here automatically.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {data.payments.map(payment => (
                      <article key={payment.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-950">
                              {payment.serviceName}
                            </p>
                            <p className="mt-1 text-sm text-gray-600">{payment.customerName}</p>
                            <p className="mt-1 text-xs text-gray-500">
                              Appointment: {formatDateTime(payment.appointmentStartTime)}
                              {payment.reference ? ` · Ref ${payment.reference}` : ''}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end">
                            <p className="font-bold text-gray-950">
                              {formatMoney(payment.amountMinor, payment.currency)}
                            </p>
                            <StatusBadge status={payment.status} />
                          </div>
                        </div>
                        {payment.paidAt && (
                          <p className="mt-2 text-xs text-gray-500">
                            Verified {formatDateTime(payment.paidAt)}
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stripe payout history</CardTitle>
                <CardDescription>
                  Payouts created by Stripe for this connected business account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.payouts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
                    <ArrowDownToLine className="mx-auto h-9 w-9 text-gray-400" />
                    <p className="mt-3 font-medium text-gray-900">No payouts to show</p>
                    <p className="mt-1 text-sm text-gray-500">
                      A payout will appear after Stripe starts sending eligible funds to your bank.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {data.payouts.map(payout => (
                      <article key={payout.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-950">
                              {formatMoney(payout.amountMinor, payout.currency)}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              Created {formatDateTime(payout.createdAt)}
                            </p>
                          </div>
                          <StatusBadge status={payout.status} payout />
                        </div>
                        <p className="mt-2 text-sm text-gray-600">
                          Stripe arrival date: {formatDate(payout.expectedArrivalAt)}
                        </p>
                        {payout.failureMessage && (
                          <p className="mt-2 text-sm text-red-700">{payout.failureMessage}</p>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-gray-950">Payment account settings</h2>
              <p className="mt-1 text-sm text-gray-600">
                Use settings only when Stripe needs identity, bank or account information changed.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/dashboard/settings/payments">
                Manage connection
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <p className="text-center text-xs text-gray-500">
            Last refreshed {formatDateTime(data.generatedAt)}. Stripe controls processing and bank
            payout timing.
          </p>
        </>
      )}
    </div>
  )
}
