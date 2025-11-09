'use client'

import { forwardRef } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface TimePickerProps {
  label?: string
  value: string
  onChange: (time: string) => void
  error?: string
  disabled?: boolean
}

export const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(
  ({ label, value, onChange, error, disabled }, ref) => {
    return (
      <div className="relative w-full">
        {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}

        <div className="relative">
          <input
            ref={ref}
            type="time"
            value={value}
            onChange={e => onChange(e.target.value)}
            disabled={disabled}
            className={cn(
              'w-full px-4 py-3 text-base border-2 rounded-lg transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-onprez-blue/20',
              error
                ? 'border-red-500 focus:border-red-500'
                : 'border-gray-300 focus:border-onprez-blue',
              disabled && 'bg-gray-50 cursor-not-allowed opacity-60',
              'pr-11'
            )}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    )
  }
)

TimePicker.displayName = 'TimePicker'
