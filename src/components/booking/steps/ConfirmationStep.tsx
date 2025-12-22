'use client'

import { motion } from 'framer-motion'
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  MessageSquare,
  MapPin,
  Scissors,
  PoundSterling,
  CheckCircle,
  Edit2,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ConfirmationStepProps {
  // Business info
  businessName: string
  businessAddress?: string
  timezone: string

  // Service info
  serviceName: string | null
  servicePrice: number | null
  serviceDuration: number | null

  // Date/time
  date: Date | null
  timeSlot: string | null
  endTime: string | null

  // Customer info
  customerName: string
  customerEmail: string
  customerPhone: string
  customerNotes: string

  // Actions
  onEditStep?: (step: 'service' | 'datetime' | 'details') => void
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours} hr${hours > 1 ? 's' : ''}`
  return `${hours} hr ${mins} min`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function ConfirmationStep({
  businessName,
  businessAddress,
  timezone,
  serviceName,
  servicePrice,
  serviceDuration,
  date,
  timeSlot,
  endTime,
  customerName,
  customerEmail,
  customerPhone,
  customerNotes,
  onEditStep,
}: ConfirmationStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Confirm Your Booking</h3>
        <p className="text-sm text-gray-500 mt-1">
          Please review your booking details before confirming
        </p>
      </div>

      {/* Booking Summary Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 px-4 py-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-white" />
            <span className="font-medium text-white">Booking Summary</span>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Business */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-start gap-3"
          >
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Business</p>
              <p className="font-semibold text-gray-900">{businessName}</p>
              {businessAddress && <p className="text-sm text-gray-600">{businessAddress}</p>}
            </div>
          </motion.div>

          {/* Service */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-start gap-3"
          >
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Scissors className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                    Service
                  </p>
                  <p className="font-semibold text-gray-900">{serviceName}</p>
                  {serviceDuration && (
                    <p className="text-sm text-gray-600">{formatDuration(serviceDuration)}</p>
                  )}
                </div>
                {onEditStep && (
                  <button
                    onClick={() => onEditStep('service')}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
                    aria-label="Edit service"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Date & Time */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-start gap-3"
          >
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                    Date & Time
                  </p>
                  {date && <p className="font-semibold text-gray-900">{formatDate(date)}</p>}
                  {timeSlot && endTime && (
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTime(timeSlot)} - {formatTime(endTime)}
                      <span className="text-gray-400">({timezone})</span>
                    </p>
                  )}
                </div>
                {onEditStep && (
                  <button
                    onClick={() => onEditStep('datetime')}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
                    aria-label="Edit date and time"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Customer Details */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex items-start gap-3"
          >
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                    Your Details
                  </p>
                  <p className="font-semibold text-gray-900">{customerName}</p>
                  <div className="space-y-0.5 mt-1">
                    <p className="text-sm text-gray-600 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      {customerEmail}
                    </p>
                    {customerPhone && (
                      <p className="text-sm text-gray-600 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" />
                        {customerPhone}
                      </p>
                    )}
                  </div>
                </div>
                {onEditStep && (
                  <button
                    onClick={() => onEditStep('details')}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
                    aria-label="Edit your details"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Notes */}
          {customerNotes && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-start gap-3"
            >
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Notes</p>
                <p className="text-sm text-gray-700 mt-0.5">{customerNotes}</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Price Footer */}
        {servicePrice !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="border-t border-blue-100 bg-white px-4 py-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Total</span>
              <div className="flex items-center gap-1">
                <PoundSterling className="w-5 h-5 text-gray-900" />
                <span className="text-2xl font-bold text-gray-900">{servicePrice.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Payment will be collected at the appointment
            </p>
          </motion.div>
        )}
      </div>

      {/* Terms Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="p-4 bg-gray-50 rounded-lg border border-gray-200"
      >
        <p className="text-xs text-gray-600 leading-relaxed">
          By confirming this booking, you agree to receive confirmation and reminder emails. Please
          arrive 5 minutes before your appointment time. Cancellations must be made at least 24
          hours in advance. For any changes, please contact the business directly.
        </p>
      </motion.div>
    </div>
  )
}
