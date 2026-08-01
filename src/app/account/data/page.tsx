'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Building2, Database, Download, ShieldCheck, Trash2 } from 'lucide-react'
import { PasswordConfirmModal } from '@/components/account'
import { FormError } from '@/components/form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface OwnedBusiness {
  id: string
  name: string
  slug: string
}

interface DeletionRequest {
  id: string
  status: 'REQUESTED' | 'SCHEDULED' | 'REVIEW_REQUIRED' | 'CANCELLED' | 'COMPLETED' | 'REJECTED'
  scheduledFor: string | null
  holdReason: string | null
  requestedAt: string
  cancelledAt: string | null
  canCancel: boolean
}

type ConfirmationAction = 'account-export' | 'business-export' | 'delete-request' | 'delete-cancel'

const confirmationCopy: Record<ConfirmationAction, { title: string; description: string }> = {
  'account-export': {
    title: 'Download account data',
    description: 'Confirm your password to create a private JSON export of your account data.',
  },
  'business-export': {
    title: 'Download business data',
    description: 'Confirm your password to export the selected business and its customer records.',
  },
  'delete-request': {
    title: 'Request account deletion',
    description:
      'Confirm your password to begin the 14-day cooling-off period. You can cancel before processing begins.',
  },
  'delete-cancel': {
    title: 'Cancel account deletion',
    description: 'Confirm your password to cancel the active deletion request.',
  },
}

async function errorMessage(response: Response, fallback: string) {
  const payload = await response.json().catch(() => null)
  return payload?.message || payload?.error || fallback
}

function downloadResponse(response: Response, fallbackFilename: string) {
  return response.blob().then(blob => {
    const disposition = response.headers.get('content-disposition') || ''
    const filename = disposition.match(/filename="([^"]+)"/)?.[1] || fallbackFilename
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  })
}

export default function DataPrivacyPage() {
  const [businesses, setBusinesses] = useState<OwnedBusiness[]>([])
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [deletionRequest, setDeletionRequest] = useState<DeletionRequest | null>(null)
  const [confirmationAction, setConfirmationAction] = useState<ConfirmationAction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchState = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/account/deletion-request', { cache: 'no-store' })
      if (!response.ok)
        throw new Error(await errorMessage(response, 'Failed to load data settings'))
      const payload = await response.json()
      const ownedBusinesses = payload.data.ownedBusinesses as OwnedBusiness[]
      setBusinesses(ownedBusinesses)
      setSelectedBusinessId(current => current || ownedBusinesses[0]?.id || '')
      setDeletionRequest(payload.data.deletionRequest)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load data settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchState()
  }, [fetchState])

  const activeDeletionRequest = Boolean(deletionRequest?.canCancel)
  const selectedBusiness = businesses.find(business => business.id === selectedBusinessId)
  const modalCopy = useMemo(
    () =>
      confirmationAction
        ? confirmationCopy[confirmationAction]
        : confirmationCopy['account-export'],
    [confirmationAction]
  )

  const handleConfirmedAction = async (password: string) => {
    if (!confirmationAction) return
    setError('')
    setSuccess('')

    if (confirmationAction === 'account-export') {
      const response = await fetch('/api/account/data-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!response.ok) throw new Error(await errorMessage(response, 'Account export failed'))
      await downloadResponse(response, 'onprez-account-data.json')
      setSuccess('Your account export has been downloaded.')
      return
    }

    if (confirmationAction === 'business-export') {
      if (!selectedBusinessId) throw new Error('Select a business first')
      const response = await fetch(`/api/business/${selectedBusinessId}/data-export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!response.ok) throw new Error(await errorMessage(response, 'Business export failed'))
      await downloadResponse(response, 'onprez-business-data.json')
      setSuccess(`${selectedBusiness?.name || 'Business'} data has been downloaded.`)
      return
    }

    const method = confirmationAction === 'delete-request' ? 'POST' : 'DELETE'
    const response = await fetch('/api/account/deletion-request', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (!response.ok) {
      throw new Error(await errorMessage(response, 'Unable to update the deletion request'))
    }

    await fetchState()
    setSuccess(
      confirmationAction === 'delete-request'
        ? 'Your account deletion request has been recorded.'
        : 'Your account deletion request has been cancelled.'
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Data &amp; privacy</h1>
        <p className="mt-2 text-gray-600">
          Download your information or exercise your right to request deletion.
        </p>
      </div>

      {error && <FormError errors={error} dismissible onDismiss={() => setError('')} />}
      {success && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800"
        >
          {success}
        </div>
      )}

      <Card hover={false}>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Database className="h-6 w-6 text-onprez-blue" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Account export</CardTitle>
              <CardDescription>
                Download account details, security activity, devices, memberships, and lifecycle
                requests.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            variant="secondary"
            disabled={loading}
            onClick={() => setConfirmationAction('account-export')}
          >
            <Download className="mr-2 h-4 w-4" aria-hidden="true" /> Download account data
          </Button>
        </CardContent>
      </Card>

      <Card hover={false}>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-purple-100 p-2">
              <Building2 className="h-6 w-6 text-onprez-purple" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Business export</CardTitle>
              <CardDescription>
                Owners can export business settings, services, pages, customers, bookings,
                inquiries, reviews, and payment records.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {businesses.length > 0 ? (
            <>
              <div className="max-w-md">
                <label
                  htmlFor="business-export"
                  className="mb-2 block text-sm font-medium text-gray-800"
                >
                  Business
                </label>
                <select
                  id="business-export"
                  value={selectedBusinessId}
                  onChange={event => setSelectedBusinessId(event.target.value)}
                  className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-gray-900"
                >
                  {businesses.map(business => (
                    <option key={business.id} value={business.id}>
                      {business.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button variant="secondary" onClick={() => setConfirmationAction('business-export')}>
                <Download className="mr-2 h-4 w-4" aria-hidden="true" /> Download business data
              </Button>
            </>
          ) : (
            <p className="text-sm text-gray-600">
              Only business owners can create a business export.
            </p>
          )}
        </CardContent>
      </Card>

      <Card hover={false} className="border-red-200">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-red-100 p-2">
              <Trash2 className="h-6 w-6 text-red-700" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Account deletion</CardTitle>
              <CardDescription>
                Requests have a 14-day cooling-off period. Required booking, payment, tax,
                fraud-prevention, and audit records are reviewed before erasure.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeDeletionRequest ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle
                    className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
                    aria-hidden="true"
                  />
                  <div className="text-sm text-amber-900">
                    <p className="font-semibold">
                      Deletion request: {deletionRequest?.status.replaceAll('_', ' ')}
                    </p>
                    <p className="mt-1">
                      Requested {new Date(deletionRequest!.requestedAt).toLocaleDateString('en-GB')}
                      .
                    </p>
                    {deletionRequest?.scheduledFor && (
                      <p className="mt-1">
                        Earliest processing date:{' '}
                        {new Date(deletionRequest.scheduledFor).toLocaleDateString('en-GB')}.
                      </p>
                    )}
                    {deletionRequest?.holdReason && (
                      <p className="mt-2">{deletionRequest.holdReason}</p>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="outline" onClick={() => setConfirmationAction('delete-cancel')}>
                Cancel deletion request
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <ShieldCheck
                  className="mt-0.5 h-5 w-5 shrink-0 text-green-700"
                  aria-hidden="true"
                />
                <p>
                  Your password verifies ownership. An owned business or retained transactional
                  record triggers manual review rather than unsafe cascading deletion.
                </p>
              </div>
              <Button variant="destructive" onClick={() => setConfirmationAction('delete-request')}>
                Request account deletion
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <PasswordConfirmModal
        isOpen={confirmationAction !== null}
        onClose={() => setConfirmationAction(null)}
        onConfirm={handleConfirmedAction}
        title={modalCopy.title}
        description={modalCopy.description}
      />
    </div>
  )
}
