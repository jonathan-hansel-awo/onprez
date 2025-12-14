'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { ServiceSelectionStep, DatePickerStep, TimeSlotSelectionStep } from './steps'

// Booking flow steps
type BookingStep = 'service' | 'datetime' | 'details' | 'confirmation'

const STEPS: { id: BookingStep; label: string; shortLabel: string }[] = [
  { id: 'service', label: 'Select Service', shortLabel: 'Service' },
  { id: 'datetime', label: 'Choose Date & Time', shortLabel: 'Date & Time' },
  { id: 'details', label: 'Your Details', shortLabel: 'Details' },
  { id: 'confirmation', label: 'Confirmation', shortLabel: 'Confirm' },
]

// Data collected during booking
export interface BookingData {
  // Service info
  serviceId: string | null
  serviceName: string | null
  servicePrice: number | null
  serviceDuration: number | null

  // Date/time
  date: Date | null
  timeSlot: string | null // "09:00"
  endTime: string | null // "10:00"

  // Customer info
  customerName: string
  customerEmail: string
  customerPhone: string
  customerNotes: string
}

const initialBookingData: BookingData = {
  serviceId: null,
  serviceName: null,
  servicePrice: null,
  serviceDuration: null,
  date: null,
  timeSlot: null,
  endTime: null,
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  customerNotes: '',
}

interface BookingWidgetProps {
  businessId: string
  businessHandle: string
  businessName: string
  businessTimezone: string
  preselectedServiceId?: string
  onComplete?: (booking: BookingData) => void
  onCancel?: () => void
}

export function BookingWidget({
  businessId,
  businessHandle,
  businessName,
  businessTimezone,
  preselectedServiceId,
  onComplete,
  onCancel,
}: BookingWidgetProps) {
  const [currentStep, setCurrentStep] = useState<BookingStep>(
    preselectedServiceId ? 'datetime' : 'service'
  )
  const [bookingData, setBookingData] = useState<BookingData>(() => ({
    ...initialBookingData,
    serviceId: preselectedServiceId || null,
  }))

  // Sub-step for datetime: 'date' or 'time'
  const [dateTimeSubStep, setDateTimeSubStep] = useState<'date' | 'time'>('date')

  // Update booking data
  const updateBookingData = useCallback((updates: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...updates }))
  }, [])

  // Get current step index
  const currentStepIndex = useMemo(() => STEPS.findIndex(s => s.id === currentStep), [currentStep])

  // Check if can proceed to next step
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 'service':
        return !!bookingData.serviceId
      case 'datetime':
        return !!bookingData.date && !!bookingData.timeSlot
      case 'details':
        return (
          bookingData.customerName.trim() !== '' &&
          bookingData.customerEmail.trim() !== '' &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingData.customerEmail)
        )
      case 'confirmation':
        return true
      default:
        return false
    }
  }, [currentStep, bookingData])

  // Navigate to next step
  const goToNextStep = useCallback(() => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id)
      // Reset datetime sub-step when entering datetime step
      if (STEPS[nextIndex].id === 'datetime') {
        setDateTimeSubStep('date')
      }
    }
  }, [currentStepIndex])

  // Navigate to previous step
  const goToPreviousStep = useCallback(() => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id)
    }
  }, [currentStepIndex])

  // Navigate to specific step (only if completed)
  const goToStep = useCallback(
    (step: BookingStep) => {
      const targetIndex = STEPS.findIndex(s => s.id === step)
      if (targetIndex <= currentStepIndex) {
        setCurrentStep(step)
        if (step === 'datetime') {
          // If going back to datetime, check if we already have a date
          setDateTimeSubStep(bookingData.date ? 'time' : 'date')
        }
      }
    },
    [currentStepIndex, bookingData.date]
  )

  // Handle booking completion
  const handleComplete = useCallback(() => {
    if (onComplete) {
      onComplete(bookingData)
    }
  }, [bookingData, onComplete])

  // Handle service selection
  const handleServiceSelect = useCallback(
    (service: { id: string; name: string; price: number; duration: number }) => {
      updateBookingData({
        serviceId: service.id,
        serviceName: service.name,
        servicePrice: service.price,
        serviceDuration: service.duration,
      })
    },
    [updateBookingData]
  )

  // Handle date selection
  const handleDateSelect = useCallback(
    (date: Date) => {
      updateBookingData({
        date,
        timeSlot: null, // Reset time when date changes
        endTime: null,
      })
      setDateTimeSubStep('time')
    },
    [updateBookingData]
  )

  // Handle time selection
  const handleTimeSelect = useCallback(
    (startTime: string, endTime: string) => {
      updateBookingData({
        timeSlot: startTime,
        endTime: endTime,
      })
    },
    [updateBookingData]
  )

  // Handle back from time selection
  const handleBackToDate = useCallback(() => {
    setDateTimeSubStep('date')
  }, [])

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const isCompleted = index < currentStepIndex
            const isCurrent = step.id === currentStep
            const isClickable = index <= currentStepIndex

            return (
              <div key={step.id} className="flex items-center flex-1">
                {/* Step circle */}
                <button
                  onClick={() => isClickable && goToStep(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                    isCompleted && 'bg-blue-600 text-white cursor-pointer hover:bg-blue-700',
                    isCurrent && 'bg-blue-600 text-white ring-4 ring-blue-100',
                    !isCompleted && !isCurrent && 'bg-gray-200 text-gray-500',
                    isClickable && !isCurrent && 'cursor-pointer'
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                </button>

                {/* Step label (hidden on mobile) */}
                <span
                  className={cn(
                    'hidden sm:block ml-2 text-sm font-medium',
                    isCurrent ? 'text-blue-600' : 'text-gray-500'
                  )}
                >
                  {step.shortLabel}
                </span>

                {/* Connector line */}
                {index < STEPS.length - 1 && (
                  <div className="flex-1 mx-2 sm:mx-4">
                    <div
                      className={cn(
                        'h-0.5 rounded-full',
                        index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'
                      )}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep + (currentStep === 'datetime' ? `-${dateTimeSubStep}` : '')}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="p-6"
          >
            {/* Service Selection Step */}
            {currentStep === 'service' && (
              <ServiceSelectionStep
                businessHandle={businessHandle}
                selectedServiceId={bookingData.serviceId}
                onSelect={handleServiceSelect}
              />
            )}

            {/* DateTime Step - Date Selection */}
            {currentStep === 'datetime' && dateTimeSubStep === 'date' && (
              <DatePickerStep
                businessId={businessId}
                businessHandle={businessHandle}
                serviceId={bookingData.serviceId}
                serviceDuration={bookingData.serviceDuration}
                timezone={businessTimezone}
                selectedDate={bookingData.date}
                onSelect={handleDateSelect}
              />
            )}

            {/* DateTime Step - Time Selection */}
            {currentStep === 'datetime' && dateTimeSubStep === 'time' && bookingData.date && (
              <TimeSlotSelectionStep
                businessHandle={businessHandle}
                serviceId={bookingData.serviceId!}
                serviceDuration={bookingData.serviceDuration!}
                selectedDate={bookingData.date}
                timezone={businessTimezone}
                selectedTimeSlot={bookingData.timeSlot}
                onSelect={handleTimeSelect}
                onBack={handleBackToDate}
              />
            )}

            {/* Details Step - Placeholder */}
            {currentStep === 'details' && (
              <CustomerDetailsStepPlaceholder data={bookingData} onUpdate={updateBookingData} />
            )}

            {/* Confirmation Step - Placeholder */}
            {currentStep === 'confirmation' && (
              <ConfirmationStepPlaceholder
                data={bookingData}
                businessName={businessName}
                timezone={businessTimezone}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
          <div className="flex items-center justify-between">
            {/* Back button */}
            <div>
              {currentStepIndex > 0 &&
                !(currentStep === 'datetime' && dateTimeSubStep === 'time') && (
                  <Button variant="ghost" onClick={goToPreviousStep}>
                    Back
                  </Button>
                )}
              {currentStep === 'datetime' && dateTimeSubStep === 'time' && (
                <Button variant="ghost" onClick={handleBackToDate}>
                  Back to Date
                </Button>
              )}
            </div>

            {/* Next/Submit button */}
            <div className="flex items-center gap-3">
              {onCancel && currentStepIndex === 0 && (
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}

              {currentStep !== 'confirmation' ? (
                <Button onClick={goToNextStep} disabled={!canProceed} className="min-w-[120px]">
                  Continue
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleComplete} className="min-w-[120px]">
                  Confirm Booking
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Placeholder components for steps not yet implemented

function CustomerDetailsStepPlaceholder({
  data,
  onUpdate,
}: {
  data: BookingData
  onUpdate: (updates: Partial<BookingData>) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Your Details</h3>
        <p className="text-sm text-gray-500 mt-1">Please provide your contact information</p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            value={data.customerName}
            onChange={e => onUpdate({ customerName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="John Smith"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            value={data.customerEmail}
            onChange={e => onUpdate({ customerEmail: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="john@example.com"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            value={data.customerPhone}
            onChange={e => onUpdate({ customerPhone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="+44 7123 456789"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes
          </label>
          <textarea
            id="notes"
            value={data.customerNotes}
            onChange={e => onUpdate({ customerNotes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            placeholder="Any special requests or notes..."
          />
        </div>
      </div>
    </div>
  )
}

function ConfirmationStepPlaceholder({
  data,
  businessName,
  timezone,
}: {
  data: BookingData
  businessName: string
  timezone: string
}) {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Confirm Your Booking</h3>
        <p className="text-sm text-gray-500 mt-1">
          Please review your booking details before confirming
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Business</p>
          <p className="font-medium text-gray-900">{businessName}</p>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Service</p>
          <p className="font-medium text-gray-900">{data.serviceName}</p>
          {data.servicePrice && (
            <p className="text-sm text-gray-600">£{data.servicePrice.toFixed(2)}</p>
          )}
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Date & Time</p>
          <p className="font-medium text-gray-900">
            {data.date?.toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          {data.timeSlot && data.endTime && (
            <p className="text-sm text-gray-600">
              {formatTime(data.timeSlot)} - {formatTime(data.endTime)} ({timezone})
            </p>
          )}
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Your Details</p>
          <p className="font-medium text-gray-900">{data.customerName}</p>
          <p className="text-sm text-gray-600">{data.customerEmail}</p>
          {data.customerPhone && <p className="text-sm text-gray-600">{data.customerPhone}</p>}
        </div>

        {data.customerNotes && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Notes</p>
            <p className="text-sm text-gray-600">{data.customerNotes}</p>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 text-center">
        By confirming, you agree to receive booking confirmation and reminder emails.
      </p>
    </div>
  )
}
