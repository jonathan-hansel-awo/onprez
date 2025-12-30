'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Save, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface BookingNotesEditorProps {
  bookingId: string
  businessNotes: string | null
  customerNotes: string | null
  onSave?: (notes: { businessNotes: string | null; customerNotes: string | null }) => void
  onCancel?: () => void
  inline?: boolean
}

export function BookingNotesEditor({
  bookingId,
  businessNotes: initialBusinessNotes,
  customerNotes: initialCustomerNotes,
  onSave,
  onCancel,
  inline = false,
}: BookingNotesEditorProps) {
  const [businessNotes, setBusinessNotes] = useState(initialBusinessNotes || '')
  const [customerNotes, setCustomerNotes] = useState(initialCustomerNotes || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    const changed =
      businessNotes !== (initialBusinessNotes || '') ||
      customerNotes !== (initialCustomerNotes || '')
    setHasChanges(changed)
  }, [businessNotes, customerNotes, initialBusinessNotes, initialCustomerNotes])

  const handleSave = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/dashboard/bookings/${bookingId}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessNotes: businessNotes.trim() || null,
          customerNotes: customerNotes.trim() || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save notes')
      }

      onSave?.({
        businessNotes: businessNotes.trim() || null,
        customerNotes: customerNotes.trim() || null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save notes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setBusinessNotes(initialBusinessNotes || '')
    setCustomerNotes(initialCustomerNotes || '')
    setError(null)
    onCancel?.()
  }

  return (
    <div className={cn('space-y-4', inline ? '' : 'p-4 bg-gray-50 rounded-lg')}>
      {/* Header */}
      {!inline && (
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">Booking Notes</h3>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Customer Notes (from booking form) */}
      <div>
        <label htmlFor="customerNotes" className="block text-sm font-medium text-gray-700 mb-2">
          Customer Notes
          <span className="ml-2 text-xs text-gray-500 font-normal">
            (Notes provided by the customer)
          </span>
        </label>
        <textarea
          id="customerNotes"
          value={customerNotes}
          onChange={e => setCustomerNotes(e.target.value)}
          rows={3}
          maxLength={2000}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors resize-none text-sm"
          placeholder="Notes from the customer about their appointment..."
        />
        <p className="text-xs text-gray-500 mt-1 text-right">{customerNotes.length}/2000</p>
      </div>

      {/* Business/Internal Notes */}
      <div>
        <label htmlFor="businessNotes" className="block text-sm font-medium text-gray-700 mb-2">
          Internal Notes
          <span className="ml-2 text-xs text-gray-500 font-normal">(Only visible to staff)</span>
        </label>
        <textarea
          id="businessNotes"
          value={businessNotes}
          onChange={e => setBusinessNotes(e.target.value)}
          rows={4}
          maxLength={2000}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors resize-none text-sm"
          placeholder="Add internal notes, reminders, or special instructions..."
        />
        <p className="text-xs text-gray-500 mt-1 text-right">{businessNotes.length}/2000</p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button variant="secondary" size="sm" onClick={handleCancel} disabled={isLoading}>
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
        )}
        <Button size="sm" onClick={handleSave} disabled={isLoading || !hasChanges}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-1" />
              Save Notes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
