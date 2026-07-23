'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, LockKeyhole, Save, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type DepositMode = 'NONE' | 'BUSINESS_DEFAULT' | 'CUSTOM'

interface ConfiguredService {
  id: string
  name: string
  price: number
  priceType: string
  mode: DepositMode
  customDepositAmount: number | null
  effective: {
    requiresDeposit: boolean
    depositAmount: number | null
    remainingAmount: number
    unavailableReason: string | null
  }
}

interface BookingProtectionConfiguration {
  canConfigure: boolean
  stripeReady: boolean
  defaults: {
    enabled: boolean
    depositAmount: number
    cancellationWindowHours: number
    deductFromTotal: true
    policyVersion: string
  }
  services: ConfiguredService[]
}

function money(value: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value)
}

export function BookingProtectionConfigurator({
  businessId,
  enabled,
}: {
  businessId: string
  enabled: boolean
}) {
  const [configuration, setConfiguration] = useState<BookingProtectionConfiguration | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    void loadConfiguration()
  }, [businessId])

  async function loadConfiguration() {
    try {
      setLoading(true)
      setError('')
      const response = await fetch(
        `/api/business/payments/booking-protection?businessId=${encodeURIComponent(businessId)}`,
        { cache: 'no-store' }
      )
      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to load Booking Protection settings')
      }
      setConfiguration(payload.data)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load Booking Protection settings'
      )
    } finally {
      setLoading(false)
    }
  }

  const services = configuration?.services || []
  const protectedCount = useMemo(
    () => services.filter(service => service.effective.requiresDeposit).length,
    [services]
  )

  function updateDefaults(
    field: 'enabled' | 'depositAmount' | 'cancellationWindowHours',
    value: boolean | number
  ) {
    setConfiguration(current =>
      current ? { ...current, defaults: { ...current.defaults, [field]: value } } : current
    )
  }

  function updateService(
    serviceId: string,
    updates: Partial<Pick<ConfiguredService, 'mode' | 'customDepositAmount'>>
  ) {
    setConfiguration(current =>
      current
        ? {
            ...current,
            services: current.services.map(service =>
              service.id === serviceId ? { ...service, ...updates } : service
            ),
          }
        : current
    )
  }

  async function saveConfiguration() {
    if (!configuration) return

    try {
      setSaving(true)
      setError('')
      setNotice('')
      const response = await fetch('/api/business/payments/booking-protection', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          defaults: {
            enabled: configuration.defaults.enabled,
            depositAmount: Number(configuration.defaults.depositAmount),
            cancellationWindowHours: Number(configuration.defaults.cancellationWindowHours),
          },
          services: configuration.services.map(service => ({
            serviceId: service.id,
            mode: service.price <= 0 ? 'NONE' : service.mode,
            customDepositAmount:
              service.mode === 'CUSTOM' ? Number(service.customDepositAmount || 0) : null,
          })),
        }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to save Booking Protection settings')
      }
      setConfiguration(payload.data)
      setNotice('Booking Protection settings saved.')
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Failed to save Booking Protection settings'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-purple-200">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-purple-700" />
              Booking Protection rules
            </CardTitle>
            <CardDescription className="mt-2">
              Set one business default, then override it for individual services. Deposits are
              always deducted from the final service price.
            </CardDescription>
          </div>
          {configuration && (
            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800">
              {protectedCount} of {services.length} services protected
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex min-h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-onprez-blue" />
          </div>
        ) : error && !configuration ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">{error}</div>
        ) : !enabled || !configuration?.canConfigure ? (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Finish Stripe setup to configure deposits</p>
              <p className="mt-1 text-sm">
                Payments and payouts must both be enabled before these controls can be changed.
              </p>
            </div>
          </div>
        ) : (
          <>
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

            <section className="space-y-4 rounded-2xl bg-gray-50 p-5">
              <label className="flex items-start justify-between gap-4">
                <div>
                  <span className="font-semibold text-gray-900">Require deposits by default</span>
                  <p className="mt-1 text-sm text-gray-600">
                    New and existing services using the business default inherit this rule.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={configuration.defaults.enabled}
                  onChange={event => updateDefaults('enabled', event.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-gray-300 text-onprez-blue focus:ring-onprez-blue"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-gray-700">
                  Default deposit (£)
                  <input
                    type="number"
                    min="0.01"
                    max="10000"
                    step="0.01"
                    value={configuration.defaults.depositAmount}
                    onChange={event => updateDefaults('depositAmount', Number(event.target.value))}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700">
                  Late-cancellation window
                  <select
                    value={configuration.defaults.cancellationWindowHours}
                    onChange={event =>
                      updateDefaults('cancellationWindowHours', Number(event.target.value))
                    }
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2"
                  >
                    <option value={12}>12 hours</option>
                    <option value={24}>24 hours</option>
                    <option value={48}>48 hours</option>
                    <option value={72}>72 hours</option>
                  </select>
                </label>
              </div>
              <p className="text-sm text-gray-600">
                Example: a {money(configuration.defaults.depositAmount)} deposit on a £60 service
                leaves {money(Math.max(0, 60 - configuration.defaults.depositAmount))} payable at
                the appointment.
              </p>
            </section>

            <section>
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900">Per-service rules</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Free services are automatically excluded. A custom deposit cannot exceed the
                  service price.
                </p>
              </div>
              <div className="space-y-3">
                {services.map(service => {
                  const previewAmount =
                    service.mode === 'CUSTOM'
                      ? Number(service.customDepositAmount || 0)
                      : configuration.defaults.depositAmount
                  const previewProtected =
                    service.price > 0 &&
                    service.mode !== 'NONE' &&
                    (service.mode === 'CUSTOM' || configuration.defaults.enabled) &&
                    previewAmount > 0 &&
                    previewAmount <= service.price

                  return (
                    <div
                      key={service.id}
                      className="grid gap-4 rounded-xl border border-gray-200 p-4 lg:grid-cols-[1fr_220px_170px] lg:items-center"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{service.name}</p>
                        <p className="mt-1 text-sm text-gray-500">
                          {money(service.price)} total
                          {previewProtected
                            ? ` · ${money(previewAmount)} due when booking · ${money(
                                Math.max(0, service.price - previewAmount)
                              )} remaining`
                            : ' · No deposit'}
                        </p>
                      </div>
                      <select
                        value={service.price <= 0 ? 'NONE' : service.mode}
                        disabled={service.price <= 0}
                        onChange={event =>
                          updateService(service.id, { mode: event.target.value as DepositMode })
                        }
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      >
                        <option value="BUSINESS_DEFAULT">Use business default</option>
                        <option value="NONE">No deposit</option>
                        <option value="CUSTOM">Custom fixed deposit</option>
                      </select>
                      {service.mode === 'CUSTOM' && service.price > 0 ? (
                        <label className="text-sm text-gray-600">
                          Custom amount (£)
                          <input
                            type="number"
                            min="0.01"
                            max={service.price}
                            step="0.01"
                            value={
                              service.customDepositAmount ?? configuration.defaults.depositAmount
                            }
                            onChange={event =>
                              updateService(service.id, {
                                customDepositAmount: Number(event.target.value),
                              })
                            }
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                          />
                        </label>
                      ) : (
                        <span className="text-sm text-gray-500">
                          {service.price <= 0 ? 'Free service' : '—'}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>

            <div className="flex justify-end">
              <Button onClick={saveConfiguration} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Booking Protection
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
