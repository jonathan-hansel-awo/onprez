'use client'

import { InputHTMLAttributes, forwardRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  onRightIconClick?: () => void
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      onRightIconClick,
      type = 'text',
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false)
    const [hasValue, setHasValue] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value.length > 0)
      if (props.onChange) {
        props.onChange(e)
      }
    }

    return (
      <div className="relative w-full">
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            type={type}
            className={cn(
              'w-full px-4 py-3 text-base border-2 rounded-lg transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-onprez-blue/20',
              error
                ? 'border-red-500 focus:border-red-500'
                : 'border-gray-300 focus:border-onprez-blue',
              label && 'pt-6 pb-2',
              leftIcon && 'pl-11',
              rightIcon && 'pr-11',
              className
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={handleChange}
            {...props}
          />

          {/* Floating Label */}
          {label && (
            <motion.label
              className={cn(
                'absolute pointer-events-none transition-all duration-200',
                leftIcon ? 'left-11' : 'left-4',
                isFocused || hasValue || props.value
                  ? 'top-2 text-xs text-onprez-blue'
                  : 'top-1/2 -translate-y-1/2 text-base text-gray-500'
              )}
              initial={false}
              animate={{
                fontSize: isFocused || hasValue || props.value ? '0.75rem' : '1rem',
                top: isFocused || hasValue || props.value ? '0.5rem' : '50%',
              }}
            >
              {label}
            </motion.label>
          )}

          {/* Right Icon */}
          {rightIcon && (
            <button
              type="button"
              onClick={onRightIconClick}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {rightIcon}
            </button>
          )}
        </div>

        {/* Error or Helper Text */}
        <AnimatePresence>
          {(error || helperText) && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn('mt-1 text-sm', error ? 'text-red-500' : 'text-gray-500')}
            >
              {error || helperText}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
