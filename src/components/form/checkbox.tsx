'use client'

import { forwardRef, InputHTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, ...props }, ref) => {
    return (
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative flex items-center justify-center mt-0.5">
          <input ref={ref} type="checkbox" className="sr-only peer" {...props} />
          <motion.div
            className={cn(
              'w-5 h-5 border-2 rounded transition-all duration-200',
              'peer-checked:bg-onprez-blue peer-checked:border-onprez-blue',
              'peer-focus:ring-2 peer-focus:ring-onprez-blue/20',
              'peer-disabled:opacity-50 peer-disabled:cursor-not-allowed',
              'border-gray-300 bg-white',
              className
            )}
            whileTap={{ scale: 0.95 }}
          >
            {/* Checkmark */}
            <motion.svg
              className="w-full h-full text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: props.checked ? 1 : 0,
                opacity: props.checked ? 1 : 0,
              }}
              transition={{ duration: 0.2 }}
            >
              <polyline points="20 6 9 17 4 12" />
            </motion.svg>
          </motion.div>
        </div>

        {(label || description) && (
          <div className="flex-1">
            {label && (
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                {label}
              </span>
            )}
            {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
          </div>
        )}
      </label>
    )
  }
)

Checkbox.displayName = 'Checkbox'

export { Checkbox }
