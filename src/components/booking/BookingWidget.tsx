'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import {
  ServiceSelectionStep,
  DatePickerStep,
  TimeSlotSelectionStep,
  CustomerDetailsStep,
  ConfirmationStep,
} from './steps'
import { useCreateBooking } from '@/lib/hooks/useCreateBooking'

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
  onComplete?: (
    booking: BookingData,
    confirmation: {
      id: string
      confirmationNumber: string
      status: string
    }
  ) => void
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
  const {
    createBooking,
    isLoading: isSubmitting,
    error: submitError,
    reset: resetSubmitError,
  } = useCreateBooking()

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
        const isValidUKPhone = (phone: string): boolean => {
          if (!phone) return true
          const digits = phone.replace(/\D/g, '')
          return digits.length >= 10 && digits.length <= 11
        }
        return (
          bookingData.customerName.trim().length >= 2 &&
          bookingData.customerEmail.trim() !== '' &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingData.customerEmail) &&
          isValidUKPhone(bookingData.customerPhone)
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
  const handleComplete = useCallback(async () => {
    if (
      !bookingData.serviceId ||
      !bookingData.date ||
      !bookingData.timeSlot ||
      !bookingData.endTime
    ) {
      return
    }

    // Format date as YYYY-MM-DD
    const dateStr = bookingData.date.toISOString().split('T')[0]

    const result = await createBooking({
      businessId,
      serviceId: bookingData.serviceId,
      date: dateStr,
      startTime: bookingData.timeSlot,
      endTime: bookingData.endTime,
      customerName: bookingData.customerName,
      customerEmail: bookingData.customerEmail,
      customerPhone: bookingData.customerPhone || undefined,
      customerNotes: bookingData.customerNotes || undefined,
    })

    if (result && onComplete) {
      onComplete(bookingData, result)
    }
  }, [bookingData, businessId, createBooking, onComplete])

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

            {/* Customer Details Step */}
            {currentStep === 'details' && (
              <CustomerDetailsStep
                customerName={bookingData.customerName}
                customerEmail={bookingData.customerEmail}
                customerPhone={bookingData.customerPhone}
                customerNotes={bookingData.customerNotes}
                onUpdate={updateBookingData}
              />
            )}

            {/* Confirmation Step */}
            {currentStep === 'confirmation' && (
              <>
                {submitError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{submitError}</p>
                    <button
                      onClick={resetSubmitError}
                      className="mt-2 text-sm text-red-600 underline hover:no-underline"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
                <ConfirmationStep
                  businessName={businessName}
                  timezone={businessTimezone}
                  serviceName={bookingData.serviceName}
                  servicePrice={bookingData.servicePrice}
                  serviceDuration={bookingData.serviceDuration}
                  date={bookingData.date}
                  timeSlot={bookingData.timeSlot}
                  endTime={bookingData.endTime}
                  customerName={bookingData.customerName}
                  customerEmail={bookingData.customerEmail}
                  customerPhone={bookingData.customerPhone}
                  customerNotes={bookingData.customerNotes}
                  onEditStep={step => {
                    setCurrentStep(step)
                    if (step === 'datetime') {
                      setDateTimeSubStep(bookingData.date ? 'time' : 'date')
                    }
                  }}
                />
              </>
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
                <Button onClick={handleComplete} disabled={isSubmitting} className="min-w-[120px]">
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Booking...
                    </>
                  ) : (
                    'Confirm Booking'
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
