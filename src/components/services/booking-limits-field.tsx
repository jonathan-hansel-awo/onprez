'use client'

import React from 'react'
import { Select } from '@/components/form'
import { Calendar, Clock, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BookingLimitsFieldProps {
  maxAdvanceDays: number | null
  minAdvanceHours: number | null
  onMaxAdvanceChange: (value: number | null) => void
  onMinAdvanceChange: (value: number | null) => void
  businessDefaults?: {
    maxAdvanceDays: number
    minAdvanceHours: number
  }
  disabled?: boolean
}

const MAX_ADVANCE_OPTIONS = [
  { value: 'null', label: 'Use business default' },
  { value: '-1', label: 'No limit' },
  { value: '1', label: '1 day' },
  { value: '3', label: '3 days' },
  { value: '7', label: '1 week' },
  { value: '14', label: '2 weeks' },
  { value: '30', label: '1 month' },
  { value: '60', label: '2 months' },
  { value: '90', label: '3 months' },
  { value: '180', label: '6 months' },
  { value: '365', label: '1 year' },
]

const MIN_ADVANCE_OPTIONS = [
  { value: 'null', label: 'Use business default' },
  { value: '0', label: 'No minimum' },
  { value: '1', label: '1 hour' },
  { value: '2', label: '2 hours' },
  { value: '4', label: '4 hours' },
  { value: '8', label: '8 hours' },
  { value: '12', label: '12 hours' },
  { value: '24', label: '24 hours (1 day)' },
  { value: '48', label: '48 hours (2 days)' },
  { value: '72', label: '72 hours (3 days)' },
  { value: '168', label: '168 hours (1 week)' },
]

export function BookingLimitsField({
  maxAdvanceDays,
  minAdvanceHours,
  onMaxAdvanceChange,
  onMinAdvanceChange,
  businessDefaults,
  disabled = false,
}: BookingLimitsFieldProps) {
  function handleMaxChange(value: string) {
    if (value === 'null') {
      onMaxAdvanceChange(null)
    } else {
      onMaxAdvanceChange(parseInt(value))
    }
  }

  function handleMinChange(value: string) {
    if (value === 'null') {
      onMinAdvanceChange(null)
    } else {
      onMinAdvanceChange(parseInt(value))
    }
  }

  const maxValue = maxAdvanceDays === null ? 'null' : maxAdvanceDays.toString()
  const minValue = minAdvanceHours === null ? 'null' : minAdvanceHours.toString()

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Calendar className="w-4 h-4" />
        Booking Window
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Maximum Advance */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Advance Booking
          </label>
          <Select
            value={maxValue}
            onChange={e => handleMaxChange(e.target.value)}
            options={MAX_ADVANCE_OPTIONS}
            disabled={disabled}
          />
          {maxAdvanceDays === null && businessDefaults && (
            <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Business default: {businessDefaults.maxAdvanceDays} days
            </p>
          )}
        </div>

        {/* Minimum Advance */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Notice Required
          </label>
          <Select
            value={minValue}
            onChange={e => handleMinChange(e.target.value)}
            options={MIN_ADVANCE_OPTIONS}
            disabled={disabled}
          />
          {minAdvanceHours === null && businessDefaults && (
            <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Business default: {businessDefaults.minAdvanceHours} hours
            </p>
          )}
        </div>
      </div>

      {/* Explanation */}
      <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
        <p>
          <strong>Maximum:</strong> How far in advance customers can book this service.
        </p>
        <p className="mt-1">
          <strong>Minimum:</strong> How much notice is required before an appointment.
        </p>
      </div>

      {/* Warning for restrictive settings */}
      {maxAdvanceDays !== null && maxAdvanceDays > 0 && maxAdvanceDays < 7 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          <strong>Note:</strong> A short booking window ({maxAdvanceDays} day
          {maxAdvanceDays !== 1 ? 's' : ''}) may limit customer bookings.
        </div>
      )}

      {minAdvanceHours !== null && minAdvanceHours >= 48 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          <strong>Note:</strong> Requiring {minAdvanceHours} hours notice may prevent last-minute
          bookings.
        </div>
      )}
    </div>
  )
}
