'use client'

import { useState, useEffect, useCallback } from 'react'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, Clock, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface TimeSlot {
  startTime: string
  endTime: string
  available: boolean
}

interface RescheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onReschedule: (date: string, startTime: string, endTime: string, reason?: string) => Promise<void>
  booking: {
    id: string
    confirmationNumber: string
    startTime: string
    endTime: string
    duration: number
    service: {
      id: string
      name: string
      duration: number
    }
  } | null
  businessSlug: string
  isLoading?: boolean
}

// Calendar helpers
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatDisplayDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  return `${hours}:${minutes}`
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function RescheduleModal({
  isOpen,
  onClose,
  onReschedule,
  booking,
  businessSlug,
  isLoading = false,
}: RescheduleModalProps) {
  const [step, setStep] = useState<'date' | 'time' | 'confirm'>('date')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Calendar state
  const today = new Date()
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [viewYear, setViewYear] = useState(today.getFullYear())

  // Time slots state
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('date')
      setSelectedDate(null)
      setSelectedSlot(null)
      setReason('')
      setError(null)
      setViewMonth(today.getMonth())
      setViewYear(today.getFullYear())
    }
  }, [isOpen])

  // Fetch available time slots when date is selected
  const fetchTimeSlots = useCallback(
    async (date: Date) => {
      if (!booking || !businessSlug) return

      setLoadingSlots(true)
      setError(null)

      try {
        const dateStr = formatDate(date)
        const response = await fetch(
          `/api/availability?slug=${encodeURIComponent(businessSlug)}&date=${dateStr}&serviceId=${booking.service.id}&includeSlots=true`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch available times')
        }

        const result = await response.json()

        // Transform the availability response to TimeSlot format
        const dayAvailability = result.data?.availability?.[0]
        if (dayAvailability?.slots) {
          setTimeSlots(
            dayAvailability.slots.map(
              (slot: { startTime: string; endTime: string; available: boolean }) => ({
                startTime: slot.startTime,
                endTime: slot.endTime,
                available: slot.available,
              })
            )
          )
        } else {
          setTimeSlots([])
        }
      } catch (err) {
        setError('Failed to load available times. Please try again.')
        setTimeSlots([])
      } finally {
        setLoadingSlots(false)
      }
    },
    [booking, businessSlug]
  )

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setSelectedSlot(null)
    fetchTimeSlots(date)
    setStep('time')
  }

  // Handle time selection
  const handleTimeSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    setStep('confirm')
  }

  // Handle reschedule submission
  const handleSubmit = async () => {
    if (!selectedDate || !selectedSlot) return

    setError(null)

    try {
      await onReschedule(
        formatDate(selectedDate),
        selectedSlot.startTime,
        selectedSlot.endTime,
        reason || undefined
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reschedule appointment')
    }
  }

  // Navigate months
  const goToPreviousMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  // Check if a date is selectable
  const isDateSelectable = (date: Date): boolean => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return date >= now
  }

  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth)
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
    const days: (Date | null)[] = []

    // Add empty slots for days before first of month
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(viewYear, viewMonth, i))
    }

    return days
  }

  if (!booking) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reschedule Appointment"
      description={`#${booking.confirmationNumber} - ${booking.service.name}`}
      size="lg"
    >
      <ModalBody className="space-y-6">
        {/* Current Appointment Info */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Current appointment</p>
          <p className="font-medium text-gray-900">
            {formatDisplayDate(new Date(booking.startTime))}
          </p>
          <p className="text-sm text-gray-600">
            {formatTime(new Date(booking.startTime).toTimeString().slice(0, 5))} -{' '}
            {formatTime(new Date(booking.endTime).toTimeString().slice(0, 5))}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Step: Date Selection */}
        {step === 'date' && (
          <div>
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Select new date
            </h3>

            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={viewYear === today.getFullYear() && viewMonth === today.getMonth()}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-semibold">
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS.map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {generateCalendarDays().map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="aspect-square" />
                }

                const isSelectable = isDateSelectable(date)
                const isToday = formatDate(date) === formatDate(today)
                const isSelected = selectedDate && formatDate(date) === formatDate(selectedDate)

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => isSelectable && handleDateSelect(date)}
                    disabled={!isSelectable}
                    className={cn(
                      'aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all',
                      isSelectable
                        ? 'hover:bg-blue-50 hover:text-blue-600 cursor-pointer'
                        : 'text-gray-300 cursor-not-allowed',
                      isToday && !isSelected && 'ring-2 ring-blue-200',
                      isSelected && 'bg-blue-600 text-white hover:bg-blue-700'
                    )}
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step: Time Selection */}
        {step === 'time' && selectedDate && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Select new time
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setStep('date')}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Change date
              </Button>
            </div>

            <p className="text-sm text-gray-600 mb-4">{formatDisplayDate(selectedDate)}</p>

            {loadingSlots ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No available times for this date</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setStep('date')}
                  className="mt-4"
                >
                  Choose another date
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                {timeSlots
                  .filter(slot => slot.available)
                  .map(slot => {
                    const isSelected =
                      selectedSlot?.startTime === slot.startTime &&
                      selectedSlot?.endTime === slot.endTime

                    return (
                      <button
                        key={slot.startTime}
                        onClick={() => handleTimeSelect(slot)}
                        className={cn(
                          'p-3 rounded-lg text-sm font-medium border-2 transition-all',
                          isSelected
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        )}
                      >
                        {formatTime(slot.startTime)}
                      </button>
                    )
                  })}
              </div>
            )}
          </div>
        )}

        {/* Step: Confirmation */}
        {step === 'confirm' && selectedDate && selectedSlot && (
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Confirm new time</h3>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <p className="text-sm text-blue-700 mb-1">New appointment</p>
              <p className="font-semibold text-blue-900">{formatDisplayDate(selectedDate)}</p>
              <p className="text-blue-800">
                {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
              </p>
            </div>

            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for rescheduling (optional)
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors resize-none"
                placeholder="e.g., Customer requested a different time"
              />
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        {step === 'confirm' ? (
          <>
            <Button variant="secondary" onClick={() => setStep('time')} disabled={isLoading}>
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Rescheduling...
                </>
              ) : (
                'Confirm Reschedule'
              )}
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        )}
      </ModalFooter>
    </Modal>
  )
}
