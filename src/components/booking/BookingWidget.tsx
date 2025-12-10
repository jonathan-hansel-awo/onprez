'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Calendar, Clock, User, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

// Step components will be created in subsequent milestones
// For now, we define the structure and navigation

export type BookingStep = 'service' | 'datetime' | 'details' | 'confirmation'

export interface BookingData {
  serviceId: string | null
  serviceName: string | null
  servicePrice: number | null
  serviceDuration: number | null
  date: Date | null
  timeSlot: string | null
  customerName: string
  customerEmail: string
  customerPhone: string
  customerNotes: string
}

export interface BookingWidgetProps {
  businessId: string
  businessHandle: string
  businessName: string
  businessTimezone?: string
  initialServiceId?: string
  onComplete?: (bookingData: BookingData) => void
  onCancel?: () => void
  className?: string
}

const STEPS: { id: BookingStep; label: string; icon: React.ReactNode }[] = [
  { id: 'service', label: 'Service', icon: <Calendar className="w-4 h-4" /> },
  { id: 'datetime', label: 'Date & Time', icon: <Clock className="w-4 h-4" /> },
  { id: 'details', label: 'Your Details', icon: <User className="w-4 h-4" /> },
  { id: 'confirmation', label: 'Confirm', icon: <Check className="w-4 h-4" /> },
]

const initialBookingData: BookingData = {
  serviceId: null,
  serviceName: null,
  servicePrice: null,
  serviceDuration: null,
  date: null,
  timeSlot: null,
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  customerNotes: '',
}

export function BookingWidget({
  businessId,
  businessHandle,
  businessName,
  businessTimezone = 'Europe/London',
  initialServiceId,
  onComplete,
  onCancel,
  className,
}: BookingWidgetProps) {
  const [currentStep, setCurrentStep] = useState<BookingStep>(
    initialServiceId ? 'datetime' : 'service'
  )
  const [bookingData, setBookingData] = useState<BookingData>({
    ...initialBookingData,
    serviceId: initialServiceId || null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep)

  const updateBookingData = useCallback((updates: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...updates }))
  }, [])

  const canProceed = useCallback((): boolean => {
    switch (currentStep) {
      case 'service':
        return !!bookingData.serviceId
      case 'datetime':
        return !!bookingData.date && !!bookingData.timeSlot
      case 'details':
        return (
          !!bookingData.customerName.trim() &&
          !!bookingData.customerEmail.trim() &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingData.customerEmail)
        )
      case 'confirmation':
        return true
      default:
        return false
    }
  }, [currentStep, bookingData])

  const goToNextStep = useCallback(() => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id)
    }
  }, [currentStepIndex])

  const goToPreviousStep = useCallback(() => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id)
    } else if (onCancel) {
      onCancel()
    }
  }, [currentStepIndex, onCancel])

  const handleSubmit = async () => {
    if (!canProceed()) return

    setIsSubmitting(true)
    try {
      // Will be implemented in Milestone 8.7
      if (onComplete) {
        onComplete(bookingData)
      }
    } catch (error) {
      console.error('Booking submission failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={cn('bg-white rounded-2xl shadow-xl overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <h2 className="text-xl font-bold text-white">Book an Appointment</h2>
        <p className="text-blue-100 text-sm mt-1">{businessName}</p>
      </div>

      {/* Progress Steps */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const isActive = step.id === currentStep
            const isCompleted = index < currentStepIndex
            const isClickable = index < currentStepIndex

            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => isClickable && setCurrentStep(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg transition-all',
                    isActive && 'bg-blue-50 text-blue-600',
                    isCompleted && 'text-green-600 cursor-pointer hover:bg-green-50',
                    !isActive && !isCompleted && 'text-gray-400',
                    isClickable && 'cursor-pointer'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                      isActive && 'bg-blue-600 text-white',
                      isCompleted && 'bg-green-500 text-white',
                      !isActive && !isCompleted && 'bg-gray-200 text-gray-500'
                    )}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium">{step.label}</span>
                </button>

                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'w-8 sm:w-12 h-0.5 mx-1',
                      index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6 min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {currentStep === 'service' && (
              <ServiceStepPlaceholder
                businessId={businessId}
                businessHandle={businessHandle}
                selectedServiceId={bookingData.serviceId}
                onSelect={service => {
                  updateBookingData({
                    serviceId: service.id,
                    serviceName: service.name,
                    servicePrice: service.price,
                    serviceDuration: service.duration,
                  })
                }}
              />
            )}

            {currentStep === 'datetime' && (
              <DateTimeStepPlaceholder
                businessId={businessId}
                serviceId={bookingData.serviceId}
                serviceDuration={bookingData.serviceDuration}
                timezone={businessTimezone}
                selectedDate={bookingData.date}
                selectedTime={bookingData.timeSlot}
                onSelect={(date, time) => {
                  updateBookingData({ date, timeSlot: time })
                }}
              />
            )}

            {currentStep === 'details' && (
              <DetailsStepPlaceholder data={bookingData} onChange={updateBookingData} />
            )}

            {currentStep === 'confirmation' && (
              <ConfirmationStepPlaceholder
                data={bookingData}
                businessName={businessName}
                timezone={businessTimezone}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <Button variant="ghost" onClick={goToPreviousStep} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          {currentStepIndex === 0 ? 'Cancel' : 'Back'}
        </Button>

        {currentStep === 'confirmation' ? (
          <Button
            onClick={handleSubmit}
            disabled={!canProceed() || isSubmitting}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Booking...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Confirm Booking
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={goToNextStep}
            disabled={!canProceed()}
            className="flex items-center gap-2"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

// Placeholder components - will be fully implemented in subsequent milestones

interface ServiceStepPlaceholderProps {
  businessId: string
  businessHandle: string
  selectedServiceId: string | null
  onSelect: (service: { id: string; name: string; price: number; duration: number }) => void
}

function ServiceStepPlaceholder({
  businessHandle,
  selectedServiceId,
  onSelect,
}: ServiceStepPlaceholderProps) {
  const [services, setServices] = useState<
    Array<{
      id: string
      name: string
      description: string
      price: number
      duration: number
      category?: string
    }>
  >([])
  const [loading, setLoading] = useState(true)

  useState(() => {
    fetch(`/api/public/businesses/${businessHandle}/services`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setServices(data.data.services)
        }
      })
      .finally(() => setLoading(false))
  })

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Select a Service</h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Select a Service</h3>
      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
        {services.map(service => (
          <button
            key={service.id}
            onClick={() => onSelect(service)}
            className={cn(
              'w-full p-4 rounded-lg border-2 text-left transition-all hover:border-blue-300',
              selectedServiceId === service.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white'
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {service.category && (
                  <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                    {service.category}
                  </span>
                )}
                <h4 className="font-semibold text-gray-900">{service.name}</h4>
                <p className="text-sm text-gray-500 line-clamp-2 mt-1">{service.description}</p>
              </div>
              <div className="text-right ml-4">
                <div className="font-bold text-gray-900">£{service.price.toFixed(2)}</div>
                <div className="text-sm text-gray-500">{service.duration} min</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

interface DateTimeStepPlaceholderProps {
  businessId: string
  serviceId: string | null
  serviceDuration: number | null
  timezone: string
  selectedDate: Date | null
  selectedTime: string | null
  onSelect: (date: Date, time: string) => void
}

function DateTimeStepPlaceholder({ selectedDate, selectedTime }: DateTimeStepPlaceholderProps) {
  // Full implementation in Milestone 8.3 and 8.4
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Choose Date & Time</h3>
      <p className="text-gray-500">
        Date picker and time slot selection will be implemented in Milestone 8.3 and 8.4
      </p>
      {selectedDate && (
        <p className="text-sm text-blue-600">
          Selected: {selectedDate.toLocaleDateString()} at {selectedTime}
        </p>
      )}
    </div>
  )
}

interface DetailsStepPlaceholderProps {
  data: BookingData
  onChange: (updates: Partial<BookingData>) => void
}

function DetailsStepPlaceholder({ data, onChange }: DetailsStepPlaceholderProps) {
  // Full implementation in Milestone 8.5
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Your Details</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input
            type="text"
            value={data.customerName}
            onChange={e => onChange({ customerName: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="John Smith"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
          <input
            type="email"
            value={data.customerEmail}
            onChange={e => onChange({ customerEmail: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="john@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input
            type="tel"
            value={data.customerPhone}
            onChange={e => onChange({ customerPhone: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="+44 7123 456789"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <textarea
            value={data.customerNotes}
            onChange={e => onChange({ customerNotes: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            placeholder="Any special requests or notes..."
          />
        </div>
      </div>
    </div>
  )
}

interface ConfirmationStepPlaceholderProps {
  data: BookingData
  businessName: string
  timezone: string
}

function ConfirmationStepPlaceholder({ data, businessName }: ConfirmationStepPlaceholderProps) {
  // Full implementation in Milestone 8.6
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Confirm Your Booking</h3>

      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">Service</p>
            <p className="font-semibold text-gray-900">{data.serviceName}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-900">£{data.servicePrice?.toFixed(2)}</p>
            <p className="text-sm text-gray-500">{data.serviceDuration} min</p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-500">Date & Time</p>
          <p className="font-semibold text-gray-900">
            {data.date?.toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}{' '}
            at {data.timeSlot}
          </p>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-500">Your Details</p>
          <p className="font-semibold text-gray-900">{data.customerName}</p>
          <p className="text-sm text-gray-600">{data.customerEmail}</p>
          {data.customerPhone && <p className="text-sm text-gray-600">{data.customerPhone}</p>}
        </div>

        {data.customerNotes && (
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-500">Notes</p>
            <p className="text-sm text-gray-900">{data.customerNotes}</p>
          </div>
        )}
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          By confirming this booking, you agree to the cancellation policy of{' '}
          <span className="font-semibold">{businessName}</span>.
        </p>
      </div>
    </div>
  )
}
