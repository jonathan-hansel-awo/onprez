'use client'

import { forwardRef, SelectHTMLAttributes, ReactNode, useId } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { ChevronDown } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
  icon?: ReactNode
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  leftIcon?: ReactNode
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, leftIcon, ...props }, ref) => {
    const generatedId = useId()
    const selectId = props.id || (label ? generatedId : undefined)
    const errorId = selectId && error ? `${selectId}-error` : undefined
    const describedBy = [...new Set([props['aria-describedby'], errorId].filter(Boolean))]
      .join(' ')
      .trim()

    return (
      <div className="relative w-full">
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div
              aria-hidden="true"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
            >
              {leftIcon}
            </div>
          )}

          <select
            ref={ref}
            className={cn(
              'w-full px-4 py-3 text-base border-2 rounded-lg appearance-none cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-onprez-blue/20',
              'transition-all duration-200',
              error
                ? 'border-red-500 focus:border-red-500'
                : 'border-gray-300 focus:border-onprez-blue',
              label && 'pt-6 pb-2',
              leftIcon && 'pl-11',
              'pr-11',
              className
            )}
            {...props}
            id={selectId}
            aria-describedby={describedBy || undefined}
            aria-invalid={props['aria-invalid'] ?? Boolean(error)}
          >
            {options.map((option, index) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Floating Label */}
          {label && (
            <label
              htmlFor={selectId}
              className={cn(
                'absolute pointer-events-none transition-all duration-200',
                leftIcon ? 'left-11' : 'left-4',
                'top-2 text-xs text-onprez-blue'
              )}
            >
              {label}
            </label>
          )}

          {/* Dropdown Icon */}
          <div
            aria-hidden="true"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          >
            <ChevronDown className="w-5 h-5" />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.p
            id={errorId}
            role="alert"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-sm text-red-700"
          >
            {error}
          </motion.p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export { Select }
