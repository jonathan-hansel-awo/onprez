'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface FormErrorProps {
  title?: string
  errors: string | string[]
  className?: string
  dismissible?: boolean
  onDismiss?: () => void
}

export function FormError({ title, errors, className, dismissible, onDismiss }: FormErrorProps) {
  const errorArray = Array.isArray(errors) ? errors : [errors]

  return (
    <AnimatePresence>
      {errorArray.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          className={cn('bg-red-50 border-2 border-red-200 rounded-xl p-4', className)}
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />

            <div className="flex-1">
              {title && <h4 className="text-sm font-semibold text-red-800 mb-1">{title}</h4>}

              {errorArray.length === 1 ? (
                <p className="text-sm text-red-700">{errorArray[0]}</p>
              ) : (
                <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                  {errorArray.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              )}
            </div>

            {dismissible && onDismiss && (
              <button
                onClick={onDismiss}
                className="text-red-600 hover:text-red-800 transition-colors"
                aria-label="Dismiss error"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
