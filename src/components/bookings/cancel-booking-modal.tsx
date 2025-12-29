'use client'

import { useState } from 'react'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Calendar, Clock, User } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type CancellationReason =
  | 'CUSTOMER_REQUEST'
  | 'BUSINESS_UNAVAILABLE'
  | 'STAFF_UNAVAILABLE'
  | 'EMERGENCY'
  | 'DUPLICATE_BOOKING'
  | 'NO_SHOW_POLICY'
  | 'OTHER'

interface CancelBookingModalProps {
  isOpen: boolean
  onClose: () => void
  onCancel: (
    reason: CancellationReason,
    customReason?: string,
    notifyCustomer?: boolean
  ) => Promise<void>
  booking: {
    id: string
    confirmationNumber: string
    startTime: string
    endTime: string
    service: {
      name: string
    }
    customer: {
      name: string
      email: string
    }
  } | null
  isLoading?: boolean
}

const CANCELLATION_REASONS: { value: CancellationReason; label: string; description: string }[] = [
  {
    value: 'CUSTOMER_REQUEST',
    label: 'Customer Request',
    description: 'The customer asked to cancel this appointment',
  },
  {
    value: 'BUSINESS_UNAVAILABLE',
    label: 'Business Unavailable',
    description: 'The business is unable to accommodate this booking',
  },
  {
    value: 'STAFF_UNAVAILABLE',
    label: 'Staff Unavailable',
    description: 'The assigned staff member is unavailable',
  },
  {
    value: 'EMERGENCY',
    label: 'Emergency',
    description: 'An unexpected emergency situation',
  },
  {
    value: 'DUPLICATE_BOOKING',
    label: 'Duplicate Booking',
    description: 'This is a duplicate of another booking',
  },
  {
    value: 'NO_SHOW_POLICY',
    label: 'No-Show Policy',
    description: 'Customer did not show up for a previous appointment',
  },
  {
    value: 'OTHER',
    label: 'Other',
    description: 'Another reason not listed above',
  },
]

function formatDisplayDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateString))
}

function formatTime(dateString: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(dateString))
}

export function CancelBookingModal({
  isOpen,
  onClose,
  onCancel,
  booking,
  isLoading = false,
}: CancelBookingModalProps) {
  const [selectedReason, setSelectedReason] = useState<CancellationReason | null>(null)
  const [customReason, setCustomReason] = useState('')
  const [notifyCustomer, setNotifyCustomer] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError('Please select a cancellation reason')
      return
    }

    if (selectedReason === 'OTHER' && !customReason.trim()) {
      setError('Please provide a reason for cancellation')
      return
    }

    setError(null)

    try {
      await onCancel(selectedReason, customReason.trim() || undefined, notifyCustomer)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking')
    }
  }

  const handleClose = () => {
    setSelectedReason(null)
    setCustomReason('')
    setNotifyCustomer(true)
    setError(null)
    onClose()
  }

  if (!booking) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Cancel Appointment"
      description={`#${booking.confirmationNumber}`}
      size="lg"
    >
      <ModalBody className="space-y-6">
        {/* Warning Banner */}
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">This action cannot be undone</p>
            <p className="text-sm text-red-700 mt-1">
              Cancelling this appointment will notify the customer and free up the time slot.
            </p>
          </div>
        </div>

        {/* Appointment Details */}
        <div className="p-4 bg-gray-50 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-gray-900">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="font-medium">{formatDisplayDate(booking.startTime)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4 text-gray-500" />
            <span>
              {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <User className="w-4 h-4 text-gray-500" />
            <span>{booking.customer.name}</span>
          </div>
          <div className="pt-2 border-t border-gray-200">
            <span className="font-medium text-gray-900">{booking.service.name}</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Cancellation Reason Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Reason for cancellation <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {CANCELLATION_REASONS.map(reason => (
              <button
                key={reason.value}
                type="button"
                onClick={() => setSelectedReason(reason.value)}
                className={cn(
                  'w-full text-left p-4 rounded-lg border-2 transition-all',
                  selectedReason === reason.value
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                <p className="font-medium text-gray-900">{reason.label}</p>
                <p className="text-sm text-gray-500 mt-0.5">{reason.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Reason Text */}
        {(selectedReason === 'OTHER' || customReason) && (
          <div>
            <label htmlFor="customReason" className="block text-sm font-medium text-gray-700 mb-2">
              Additional details{' '}
              {selectedReason === 'OTHER' && <span className="text-red-500">*</span>}
            </label>
            <textarea
              id="customReason"
              value={customReason}
              onChange={e => setCustomReason(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-500 transition-colors resize-none"
              placeholder="Please provide more details..."
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {customReason.length}/500 characters
            </p>
          </div>
        )}

        {/* Notification Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Notify customer</p>
            <p className="text-sm text-gray-500">
              Send a cancellation email to {booking.customer.email}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={notifyCustomer}
            onClick={() => setNotifyCustomer(!notifyCustomer)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              notifyCustomer ? 'bg-red-600' : 'bg-gray-300'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                notifyCustomer ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
          Keep Appointment
        </Button>
        <Button
          variant="destructive"
          onClick={handleSubmit}
          disabled={isLoading || !selectedReason}
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Cancelling...
            </>
          ) : (
            'Cancel Appointment'
          )}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
