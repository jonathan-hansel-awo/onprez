'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Loader2, AlertCircle, Sun, Sunset, Moon, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

interface TimeSlot {
  startTime: string // "09:00"
  endTime: string // "09:30"
  available: boolean
  reason?: 'closed' | 'special_date' | 'booked' | 'buffer' | 'past' | 'break'
}

interface DayAvailability {
  date: string
  dateFormatted: string
  dayName: string
  dayOfWeek: number
  isOpen: boolean
  reason?: string
  specialDate?: {
    name: string
    isClosed: boolean
  }
  slots: TimeSlot[]
  availableSlots: number
  totalSlots: number
}

interface TimeSlotSelectionStepProps {
  businessHandle: string
  serviceId: string
  serviceDuration: number
  selectedDate: Date
  timezone: string
  selectedTimeSlot: string | null
  onSelect: (timeSlot: string, endTime: string) => void
  onBack: () => void
}

const TIME_PERIODS = {
  morning: { label: 'Morning', icon: Sun, start: 0, end: 12 },
  afternoon: { label: 'Afternoon', icon: Sunset, start: 12, end: 17 },
  evening: { label: 'Evening', icon: Moon, start: 17, end: 24 },
} as const

type TimePeriod = keyof typeof TIME_PERIODS

function getTimePeriod(time: string): TimePeriod {
  const hour = parseInt(time.split(':')[0], 10)
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`
}

function getDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function TimeSlotSelectionStep({
  businessHandle,
  serviceId,
  serviceDuration,
  selectedDate,
  timezone,
  selectedTimeSlot,
  onSelect,
  onBack,
}: TimeSlotSelectionStepProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dayInfo, setDayInfo] = useState<{
    isOpen: boolean
    reason?: string
    specialDate?: { name: string; isClosed: boolean }
  } | null>(null)

  const dateString = useMemo(() => getDateString(selectedDate), [selectedDate])

  useEffect(() => {
    fetchSlots()
  }, [dateString, serviceId])

  async function fetchSlots() {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        slug: businessHandle,
        date: dateString,
        serviceId: serviceId,
        includeSlots: 'true',
      })

      const response = await fetch(`/api/availability?${params}`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch time slots')
      }

      const dayData = data.data?.availability?.[0] as DayAvailability | undefined

      if (!dayData) {
        throw new Error('No availability data for selected date')
      }

      setDayInfo({
        isOpen: dayData.isOpen,
        reason: dayData.reason,
        specialDate: dayData.specialDate,
      })

      if (dayData.isOpen && dayData.slots) {
        setSlots(dayData.slots)
      } else {
        setSlots([])
      }
    } catch (err) {
      console.error('Failed to fetch time slots:', err)
      setError(err instanceof Error ? err.message : 'Failed to load time slots')
      setSlots([])
    } finally {
      setLoading(false)
    }
  }

  const groupedSlots = useMemo(() => {
    const groups: Record<TimePeriod, TimeSlot[]> = {
      morning: [],
      afternoon: [],
      evening: [],
    }

    slots.forEach(slot => {
      const period = getTimePeriod(slot.startTime)
      groups[period].push(slot)
    })

    return groups
  }, [slots])

  const availableCount = useMemo(() => {
    return slots.filter(s => s.available).length
  }, [slots])

  const hasAvailableSlots = (period: TimePeriod): boolean => {
    return groupedSlots[period].some(slot => slot.available)
  }

  function handleSlotClick(slot: TimeSlot) {
    if (!slot.available) return
    onSelect(slot.startTime, slot.endTime)
  }

  const formattedDate = selectedDate.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-4">
      {/* Header with back button */}
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="p-2 -ml-2 text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">Select a Time</h3>
          <p className="text-sm text-gray-500 mt-0.5">{formattedDate}</p>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-sm text-gray-500">Loading available times...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={fetchSlots}
              className="text-sm font-medium text-red-700 hover:text-red-800 mt-2"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Closed Day State */}
      {!loading && !error && dayInfo && !dayInfo.isOpen && (
        <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <Clock className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {dayInfo.specialDate
                ? `Closed for ${dayInfo.specialDate.name}`
                : 'Business is closed on this day'}
            </p>
            <p className="text-sm text-gray-500 mt-1">Please select a different date.</p>
            <Button variant="outline" size="sm" onClick={onBack} className="mt-3">
              Choose another date
            </Button>
          </div>
        </div>
      )}

      {/* No Available Slots */}
      {!loading && !error && dayInfo?.isOpen && availableCount === 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">No available time slots</p>
            <p className="text-sm text-amber-700 mt-1">
              All slots are booked for this date. Please select a different date.
            </p>
            <Button variant="outline" size="sm" onClick={onBack} className="mt-3">
              Choose another date
            </Button>
          </div>
        </div>
      )}

      {/* Time Slots */}
      {!loading && !error && dayInfo?.isOpen && availableCount > 0 && (
        <div className="space-y-6">
          {/* Available count summary */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>
              {availableCount} time slot{availableCount !== 1 ? 's' : ''} available
            </span>
            <span className="text-gray-400">•</span>
            <span>{serviceDuration} minutes each</span>
          </div>

          {/* Time period sections */}
          {(Object.keys(TIME_PERIODS) as TimePeriod[]).map(period => {
            const periodSlots = groupedSlots[period]
            const { label, icon: Icon } = TIME_PERIODS[period]
            const hasSlots = periodSlots.length > 0
            const hasAvailable = hasAvailableSlots(period)

            if (!hasSlots) return null

            return (
              <div key={period} className="space-y-3">
                {/* Period header */}
                <div className="flex items-center gap-2">
                  <Icon
                    className={cn('w-4 h-4', hasAvailable ? 'text-gray-700' : 'text-gray-400')}
                  />
                  <span
                    className={cn(
                      'text-sm font-medium',
                      hasAvailable ? 'text-gray-900' : 'text-gray-400'
                    )}
                  >
                    {label}
                  </span>
                  {!hasAvailable && <span className="text-xs text-gray-400">(fully booked)</span>}
                </div>

                {/* Slots grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  <AnimatePresence mode="popLayout">
                    {periodSlots.map((slot, index) => {
                      const isSelected = selectedTimeSlot === slot.startTime
                      const isAvailable = slot.available

                      return (
                        <motion.button
                          key={slot.startTime}
                          type="button"
                          onClick={() => handleSlotClick(slot)}
                          disabled={!isAvailable}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.02 }}
                          whileHover={isAvailable ? { scale: 1.05 } : undefined}
                          whileTap={isAvailable ? { scale: 0.95 } : undefined}
                          className={cn(
                            'py-2.5 px-3 rounded-lg text-sm font-medium transition-all',
                            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
                            isAvailable &&
                              !isSelected &&
                              'bg-white border border-gray-200 text-gray-900 hover:border-blue-300 hover:bg-blue-50',
                            isSelected && 'bg-blue-600 text-white border border-blue-600 shadow-md',
                            !isAvailable &&
                              'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-100'
                          )}
                          title={
                            !isAvailable && slot.reason ? `Unavailable: ${slot.reason}` : undefined
                          }
                        >
                          {formatTime(slot.startTime)}
                        </motion.button>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Selected Time Display */}
      <AnimatePresence>
        {selectedTimeSlot && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {formatTime(selectedTimeSlot)} -{' '}
                  {formatTime(slots.find(s => s.startTime === selectedTimeSlot)?.endTime || '')}
                </p>
                <p className="text-xs text-blue-700 mt-0.5">{serviceDuration} minute appointment</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timezone notice */}
      <p className="text-xs text-gray-500 text-center">All times shown in {timezone}</p>
    </div>
  )
}
