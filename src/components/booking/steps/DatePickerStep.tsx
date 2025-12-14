'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

interface DayAvailability {
  date: string
  dateFormatted: string
  dayName: string
  dayOfWeek: number
  isOpen: boolean
  availableSlots: number
  totalSlots: number
  isSpecialDate: boolean
  specialDateName?: string
}

interface DatePickerStepProps {
  businessId: string
  businessHandle: string
  serviceId: string | null
  serviceDuration: number | null
  timezone: string
  selectedDate: Date | null
  onSelect: (date: Date) => void
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
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

function getDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isSameDay(date1: Date, date2: Date): boolean {
  return getDateString(date1) === getDateString(date2)
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

export function DatePickerStep({
  businessHandle,
  serviceId,
  timezone,
  selectedDate,
  onSelect,
}: DatePickerStepProps) {
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const [viewDate, setViewDate] = useState(() => {
    if (selectedDate) return new Date(selectedDate)
    return new Date()
  })

  const [availability, setAvailability] = useState<Record<string, DayAvailability>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const currentYear = viewDate.getFullYear()
  const currentMonth = viewDate.getMonth()

  // Calculate the date range to fetch
  const fetchStartDate = useMemo(() => {
    const start = new Date(currentYear, currentMonth, 1)
    return start < today ? today : start
  }, [currentYear, currentMonth, today])

  const fetchEndDate = useMemo(() => {
    // End of current month + first week of next month
    return new Date(currentYear, currentMonth + 1, 7)
  }, [currentYear, currentMonth])

  // Fetch availability for the visible month
  useEffect(() => {
    fetchAvailability()
  }, [currentMonth, currentYear, serviceId])

  async function fetchAvailability() {
    if (!serviceId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const startStr = getDateString(fetchStartDate)
      const endStr = getDateString(fetchEndDate)

      const params = new URLSearchParams({
        slug: businessHandle,
        startDate: startStr,
        endDate: endStr,
        serviceId: serviceId,
        includeSlots: 'false', // We only need day-level availability for the calendar
      })

      const response = await fetch(`/api/availability?${params}`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch availability')
      }

      // Convert array to lookup object by date
      const availabilityMap: Record<string, DayAvailability> = {}
      if (data.data?.availability && Array.isArray(data.data.availability)) {
        data.data.availability.forEach((day: DayAvailability) => {
          availabilityMap[day.date] = day
        })
      }

      setAvailability(availabilityMap)
    } catch (err) {
      console.error('Failed to fetch availability:', err)
      setError(err instanceof Error ? err.message : 'Failed to load availability')
    } finally {
      setLoading(false)
    }
  }

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: Array<{
      date: Date
      dateString: string
      dayOfMonth: number
      isCurrentMonth: boolean
      isToday: boolean
      isSelected: boolean
      isPast: boolean
      availability: DayAvailability | null
    }> = []

    const daysInMonth = getDaysInMonth(currentYear, currentMonth)
    const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth)
    const daysInPrevMonth = getDaysInMonth(currentYear, currentMonth - 1)

    // Previous month days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i
      const date = new Date(currentYear, currentMonth - 1, day)
      const dateString = getDateString(date)

      days.push({
        date,
        dateString,
        dayOfMonth: day,
        isCurrentMonth: false,
        isToday: isSameDay(date, today),
        isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
        isPast: date < today,
        availability: availability[dateString] || null,
      })
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day)
      const dateString = getDateString(date)

      days.push({
        date,
        dateString,
        dayOfMonth: day,
        isCurrentMonth: true,
        isToday: isSameDay(date, today),
        isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
        isPast: date < today,
        availability: availability[dateString] || null,
      })
    }

    // Next month days to fill grid (6 rows)
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(currentYear, currentMonth + 1, day)
      const dateString = getDateString(date)

      days.push({
        date,
        dateString,
        dayOfMonth: day,
        isCurrentMonth: false,
        isToday: isSameDay(date, today),
        isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
        isPast: date < today,
        availability: availability[dateString] || null,
      })
    }

    return days
  }, [currentYear, currentMonth, selectedDate, availability, today])

  function goToPreviousMonth() {
    const prevMonth = new Date(currentYear, currentMonth - 1, 1)
    if (prevMonth >= new Date(today.getFullYear(), today.getMonth(), 1)) {
      setViewDate(prevMonth)
    }
  }

  function goToNextMonth() {
    // Limit to 3 months ahead
    const maxDate = new Date(today.getFullYear(), today.getMonth() + 3, 1)
    const nextMonth = new Date(currentYear, currentMonth + 1, 1)
    if (nextMonth <= maxDate) {
      setViewDate(nextMonth)
    }
  }

  const canGoPrev =
    new Date(currentYear, currentMonth - 1, 1) >= new Date(today.getFullYear(), today.getMonth(), 1)
  const canGoNext =
    new Date(currentYear, currentMonth + 1, 1) <=
    new Date(today.getFullYear(), today.getMonth() + 3, 1)

  function handleDateClick(day: (typeof calendarDays)[0]) {
    if (day.isPast) return
    if (!day.isCurrentMonth) return
    if (!day.availability?.isOpen) return
    if (day.availability.availableSlots === 0) return

    onSelect(day.date)
  }

  function getAvailabilityStatus(
    day: (typeof calendarDays)[0]
  ): 'available' | 'limited' | 'unavailable' | 'closed' | 'unknown' {
    if (day.isPast) return 'unavailable'
    if (!day.availability) return 'unknown'
    if (!day.availability.isOpen) return 'closed'
    if (day.availability.availableSlots === 0) return 'unavailable'
    if (day.availability.availableSlots <= 3) return 'limited'
    return 'available'
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Select a Date</h3>
        <p className="text-sm text-gray-500 mt-1">Choose your preferred appointment date</p>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchAvailability}
            className="ml-auto text-sm font-medium hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPreviousMonth}
            disabled={!canGoPrev}
            className="p-2"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <h4 className="text-lg font-semibold text-gray-900">
            {MONTHS[currentMonth]} {currentYear}
          </h4>

          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextMonth}
            disabled={!canGoNext}
            className="p-2"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS_OF_WEEK.map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 relative">
          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-lg">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          )}

          {calendarDays.map((day, index) => {
            const status = getAvailabilityStatus(day)
            const isClickable =
              day.isCurrentMonth &&
              !day.isPast &&
              day.availability?.isOpen &&
              (day.availability?.availableSlots ?? 0) > 0

            return (
              <motion.button
                key={index}
                type="button"
                onClick={() => handleDateClick(day)}
                disabled={!isClickable}
                whileHover={isClickable ? { scale: 1.05 } : undefined}
                whileTap={isClickable ? { scale: 0.95 } : undefined}
                className={cn(
                  'aspect-square p-1 relative rounded-lg transition-all text-sm flex flex-col items-center justify-center',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',

                  // Base styling
                  !day.isCurrentMonth && 'text-gray-300',
                  day.isCurrentMonth && 'text-gray-900',

                  // Today indicator
                  day.isToday && !day.isSelected && 'ring-2 ring-blue-500 ring-inset',

                  // Selected state
                  day.isSelected && 'bg-blue-600 text-white shadow-md',

                  // Availability states (only for current month, non-selected)
                  day.isCurrentMonth &&
                    !day.isSelected &&
                    status === 'available' &&
                    'bg-green-50 hover:bg-green-100 text-green-800',
                  day.isCurrentMonth &&
                    !day.isSelected &&
                    status === 'limited' &&
                    'bg-amber-50 hover:bg-amber-100 text-amber-800',
                  day.isCurrentMonth &&
                    !day.isSelected &&
                    status === 'unavailable' &&
                    'bg-gray-100 text-gray-400 cursor-not-allowed',
                  day.isCurrentMonth &&
                    !day.isSelected &&
                    status === 'closed' &&
                    'bg-gray-50 text-gray-300 cursor-not-allowed',
                  day.isCurrentMonth &&
                    !day.isSelected &&
                    status === 'unknown' &&
                    'hover:bg-gray-100',

                  // Past dates
                  day.isPast && 'text-gray-300 cursor-not-allowed bg-transparent'
                )}
              >
                <span className="font-medium">{day.dayOfMonth}</span>

                {/* Availability indicator dots */}
                {day.isCurrentMonth && !day.isPast && day.availability && (
                  <div className="flex gap-0.5 mt-0.5">
                    {status === 'available' && (
                      <span
                        className={cn(
                          'w-1 h-1 rounded-full',
                          day.isSelected ? 'bg-white' : 'bg-green-500'
                        )}
                      />
                    )}
                    {status === 'limited' && (
                      <span
                        className={cn(
                          'w-1 h-1 rounded-full',
                          day.isSelected ? 'bg-white' : 'bg-amber-500'
                        )}
                      />
                    )}
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-green-100 border border-green-300" />
            <span className="text-gray-600">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
            <span className="text-gray-600">Limited</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-gray-100 border border-gray-300" />
            <span className="text-gray-600">Unavailable</span>
          </div>
        </div>
      </div>

      {/* Selected Date Display */}
      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <p className="text-sm text-blue-800">
            <span className="font-medium">Selected:</span>{' '}
            {selectedDate.toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <p className="text-xs text-blue-600 mt-1">Timezone: {timezone}</p>
        </motion.div>
      )}
    </div>
  )
}
