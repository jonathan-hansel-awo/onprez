'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

export interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, description, disabled }: ToggleProps) {
  return (
    <div className="flex items-start gap-4">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-onprez-blue focus:ring-offset-2',
          checked ? 'bg-onprez-blue' : 'bg-gray-200',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>

      {(label || description) && (
        <div className="flex-1">
          {label && (
            <label
              className="text-sm font-medium text-gray-900 cursor-pointer"
              onClick={() => !disabled && onChange(!checked)}
            >
              {label}
            </label>
          )}
          {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
        </div>
      )}
    </div>
  )
}
