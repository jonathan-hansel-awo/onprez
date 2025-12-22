'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Phone, MessageSquare, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface CustomerDetailsStepProps {
  customerName: string
  customerEmail: string
  customerPhone: string
  customerNotes: string
  onUpdate: (updates: {
    customerName?: string
    customerEmail?: string
    customerPhone?: string
    customerNotes?: string
  }) => void
  errors?: {
    customerName?: string
    customerEmail?: string
    customerPhone?: string
  }
}

// UK phone number formatting
function formatUKPhone(value: string): string {
  const digits = value.replace(/\D/g, '')

  // Handle UK mobile numbers (07xxx)
  if (digits.startsWith('07') || digits.startsWith('447')) {
    const normalized = digits.startsWith('447') ? '0' + digits.slice(2) : digits
    if (normalized.length <= 5) return normalized
    if (normalized.length <= 8) return `${normalized.slice(0, 5)} ${normalized.slice(5)}`
    return `${normalized.slice(0, 5)} ${normalized.slice(5, 8)} ${normalized.slice(8, 11)}`
  }

  // Handle UK landlines (01xxx, 02xxx, 03xxx)
  if (digits.startsWith('0')) {
    if (digits.length <= 4) return digits
    if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`
  }

  return value
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidUKPhone(phone: string): boolean {
  if (!phone) return true
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 11
}

export function CustomerDetailsStep({
  customerName,
  customerEmail,
  customerPhone,
  customerNotes,
  onUpdate,
  errors: externalErrors,
}: CustomerDetailsStepProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({})

  const validateField = (field: string, value: string) => {
    const newErrors = { ...localErrors }

    switch (field) {
      case 'customerName':
        if (!value.trim()) {
          newErrors.customerName = 'Name is required'
        } else if (value.trim().length < 2) {
          newErrors.customerName = 'Name must be at least 2 characters'
        } else {
          delete newErrors.customerName
        }
        break

      case 'customerEmail':
        if (!value.trim()) {
          newErrors.customerEmail = 'Email is required'
        } else if (!isValidEmail(value)) {
          newErrors.customerEmail = 'Please enter a valid email address'
        } else {
          delete newErrors.customerEmail
        }
        break

      case 'customerPhone':
        if (value && !isValidUKPhone(value)) {
          newErrors.customerPhone = 'Please enter a valid UK phone number'
        } else {
          delete newErrors.customerPhone
        }
        break
    }

    setLocalErrors(newErrors)
  }

  const handleBlur = (field: string, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    validateField(field, value)
  }

  const handlePhoneChange = (value: string) => {
    const formatted = formatUKPhone(value)
    onUpdate({ customerPhone: formatted })
  }

  const errors = { ...localErrors, ...externalErrors }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Your Details</h3>
        <p className="text-sm text-gray-500 mt-1">
          Please provide your contact information for the booking
        </p>
      </div>

      <div className="space-y-4">
        {/* Full Name */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="customerName"
              value={customerName}
              onChange={e => onUpdate({ customerName: e.target.value })}
              onBlur={e => handleBlur('customerName', e.target.value)}
              className={cn(
                'block w-full pl-10 pr-3 py-2.5 border rounded-lg shadow-sm text-sm',
                'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                'placeholder:text-gray-400',
                touched.customerName && errors.customerName
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              )}
              placeholder="John Smith"
              autoComplete="name"
            />
          </div>
          {touched.customerName && errors.customerName && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-1.5 text-sm text-red-600 flex items-center gap-1"
            >
              <AlertCircle className="w-4 h-4" />
              {errors.customerName}
            </motion.p>
          )}
        </motion.div>

        {/* Email Address */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              id="customerEmail"
              value={customerEmail}
              onChange={e => onUpdate({ customerEmail: e.target.value })}
              onBlur={e => handleBlur('customerEmail', e.target.value)}
              className={cn(
                'block w-full pl-10 pr-3 py-2.5 border rounded-lg shadow-sm text-sm',
                'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                'placeholder:text-gray-400',
                touched.customerEmail && errors.customerEmail
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              )}
              placeholder="john@example.com"
              autoComplete="email"
            />
          </div>
          {touched.customerEmail && errors.customerEmail && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-1.5 text-sm text-red-600 flex items-center gap-1"
            >
              <AlertCircle className="w-4 h-4" />
              {errors.customerEmail}
            </motion.p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            We&apos;ll send your booking confirmation to this email
          </p>
        </motion.div>

        {/* Phone Number */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="tel"
              id="customerPhone"
              value={customerPhone}
              onChange={e => handlePhoneChange(e.target.value)}
              onBlur={e => handleBlur('customerPhone', e.target.value)}
              className={cn(
                'block w-full pl-10 pr-3 py-2.5 border rounded-lg shadow-sm text-sm',
                'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                'placeholder:text-gray-400',
                touched.customerPhone && errors.customerPhone
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              )}
              placeholder="07123 456 789"
              autoComplete="tel"
            />
          </div>
          {touched.customerPhone && errors.customerPhone && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-1.5 text-sm text-red-600 flex items-center gap-1"
            >
              <AlertCircle className="w-4 h-4" />
              {errors.customerPhone}
            </motion.p>
          )}
          <p className="mt-1 text-xs text-gray-500">For appointment reminders and updates</p>
        </motion.div>

        {/* Additional Notes */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <label htmlFor="customerNotes" className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <div className="relative">
            <div className="absolute top-2.5 left-3 pointer-events-none">
              <MessageSquare className="h-5 w-5 text-gray-400" />
            </div>
            <textarea
              id="customerNotes"
              value={customerNotes}
              onChange={e => onUpdate({ customerNotes: e.target.value })}
              rows={3}
              maxLength={500}
              className={cn(
                'block w-full pl-10 pr-3 py-2.5 border rounded-lg shadow-sm text-sm',
                'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                'placeholder:text-gray-400 resize-none',
                'border-gray-300'
              )}
              placeholder="Any special requests or information we should know..."
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">{customerNotes.length}/500 characters</p>
        </motion.div>
      </div>

      {/* Privacy Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="p-4 bg-gray-50 rounded-lg border border-gray-200"
      >
        <p className="text-xs text-gray-600 leading-relaxed">
          By proceeding, you agree to receive booking confirmations and reminders via email. Your
          information will be used solely for managing your appointment and will be handled in
          accordance with our{' '}
          <a href="/privacy" className="text-blue-600 hover:underline" target="_blank">
            Privacy Policy
          </a>
          .
        </p>
      </motion.div>
    </div>
  )
}
