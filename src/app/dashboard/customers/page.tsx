'use client'

import { useCallback, useEffect, useState } from 'react'
import { Mail, Phone, RefreshCw, UserX, Users } from 'lucide-react'
import { PasswordConfirmModal } from '@/components/account'
import { GuidedEmptyState } from '@/components/dashboard/guided-empty-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface Customer {
  id: string
  name: string
  email: string
  phone: string | null
  totalBookings: number
  totalSpent: number
  lastBookingAt: string | null
}

const currency = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [businessId, setBusinessId] = useState('')
  const [canManagePersonalData, setCanManagePersonalData] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/dashboard/customers')
      const result = await response.json()

      if (!response.ok) throw new Error(result.error || 'Failed to load customers')
      setBusinessId(result.data.businessId)
      setCanManagePersonalData(result.data.canManagePersonalData === true)
      setCustomers(result.data.customers)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [])

  const anonymizeSelectedCustomer = async (password: string) => {
    if (!selectedCustomer || !businessId) return

    const response = await fetch(`/api/dashboard/customers/${selectedCustomer.id}/personal-data`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId, password }),
    })
    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || 'Failed to remove customer personal data')
    }

    setSuccess(result.message)
    await fetchCustomers()
  }

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="mt-1 text-gray-600">See everyone who has booked with your business.</p>
      </div>

      {success && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800"
        >
          {success}
        </div>
      )}

      {loading && (
        <div className="space-y-3" aria-label="Loading customers">
          {[1, 2, 3].map(item => (
            <Skeleton key={item} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!loading && error && (
        <Card className="border-red-200 bg-red-50" hover={false}>
          <CardContent className="p-6">
            <p className="font-medium text-red-800">We couldn&apos;t load your customers.</p>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <Button variant="secondary" size="sm" className="mt-4" onClick={fetchCustomers}>
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && !error && customers.length === 0 && (
        <GuidedEmptyState
          icon={Users}
          title="Your customer list will grow with every booking"
          description="Customers are added automatically when they book. Share your presence page to invite your first customer, or make sure your services are ready to book."
          action={{ label: 'Open your presence', href: '/dashboard/presence' }}
          secondaryAction={{ label: 'Review services', href: '/dashboard/services' }}
        />
      )}

      {!loading && !error && customers.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {customers.map(customer => (
            <Card key={customer.id} hover={false}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-gray-900">{customer.name}</h2>
                    <p className="mt-2 flex items-center gap-2 truncate text-sm text-gray-600">
                      <Mail className="h-4 w-4 shrink-0" aria-hidden="true" /> {customer.email}
                    </p>
                    {customer.phone && (
                      <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4 shrink-0" aria-hidden="true" /> {customer.phone}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right text-sm">
                    <p className="font-semibold text-gray-900">
                      {customer.totalBookings} booking{customer.totalBookings === 1 ? '' : 's'}
                    </p>
                    <p className="mt-1 text-gray-500">{currency.format(customer.totalSpent)}</p>
                    {canManagePersonalData &&
                      !customer.email.endsWith('@privacy.onprez.invalid') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-3 text-red-700"
                          onClick={() => setSelectedCustomer(customer)}
                        >
                          <UserX className="mr-2 h-4 w-4" aria-hidden="true" /> Remove personal data
                        </Button>
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PasswordConfirmModal
        isOpen={selectedCustomer !== null}
        onClose={() => setSelectedCustomer(null)}
        onConfirm={anonymizeSelectedCustomer}
        title="Remove customer personal data"
        description="This anonymises direct identifiers and message content while retaining booking, service, status, policy, and payment records that may be legally required."
      />
    </div>
  )
}
