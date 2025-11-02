'use client'

import { forwardRef, TextareaHTMLAttributes, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  showCharCount?: boolean
  maxLength?: number
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, label, error, helperText, showCharCount, maxLength, ...props }, ref) => {
    const [charCount, setCharCount] = useState(0)

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length)
      if (props.onChange) {
        props.onChange(e)
      }
    }

    return (
      <div className="relative w-full">
        <div className="relative">
          <textarea
            ref={ref}
            maxLength={maxLength}
            className={cn(
              'w-full px-4 py-3 text-base border-2 rounded-lg resize-none transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-onprez-blue/20',
              error
                ? 'border-red-500 focus:border-red-500'
                : 'border-gray-300 focus:border-onprez-blue',
              label && 'pt-6',
              className
            )}
            onChange={handleChange}
            {...props}
          />

          {/* Floating Label */}
          {label && (
            <label className="absolute left-4 top-2 text-xs text-onprez-blue pointer-events-none">
              {label}
            </label>
          )}
        </div>

        {/* Footer with char count and helper/error text */}
        <div className="flex items-center justify-between mt-1">
          <AnimatePresence>
            {(error || helperText) && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn('text-sm', error ? 'text-red-500' : 'text-gray-500')}
              >
                {error || helperText}
              </motion.p>
            )}
          </AnimatePresence>

          {showCharCount && maxLength && (
            <span
              className={cn(
                'text-xs transition-colors',
                charCount >= maxLength ? 'text-red-500' : 'text-gray-500'
              )}
            >
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    )
  }
)

TextArea.displayName = 'TextArea'

export { TextArea }
