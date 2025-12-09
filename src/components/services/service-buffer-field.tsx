'use client'

import React from 'react'
import { Select } from '@/components/form'
import { Clock, Info } from 'lucide-react'

interface ServiceBufferFieldProps {
  value: number
  onChange: (value: number) => void
  businessDefault?: number
  disabled?: boolean
  error?: string
}

const BUFFER_OPTIONS = [
  { value: '-1', label: 'Use business default' },
  { value: '0', label: 'No buffer' },
  { value: '5', label: '5 minutes' },
  { value: '10', label: '10 minutes' },
  { value: '15', label: '15 minutes' },
  { value: '20', label: '20 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '1 hour' },
]

export function ServiceBufferField({
  value,
  onChange,
  businessDefault = 0,
  disabled = false,
  error,
}: ServiceBufferFieldProps) {
  // -1 means use business default
  const displayValue = value === -1 ? '-1' : value.toString()

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        <Clock className="w-4 h-4 inline mr-1" />
        Buffer Time After Service
      </label>
      <Select
        value={displayValue}
        onChange={e => onChange(parseInt(e.target.value))}
        options={BUFFER_OPTIONS}
        disabled={disabled}
        error={error}
      />
      {value === -1 && (
        <p className="mt-2 text-sm text-gray-500 flex items-center gap-1">
          <Info className="w-3 h-3" />
          Business default: {businessDefault} minutes
        </p>
      )}
      <p className="mt-1 text-xs text-gray-400">
        Extra time after this service before the next appointment
      </p>
    </div>
  )
}
