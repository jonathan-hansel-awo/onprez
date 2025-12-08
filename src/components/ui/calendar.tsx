'use client'

import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

export interface CalendarDay {
  date: Date
  dateString: string
  dayOfMonth: number
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  isDisabled: boolean
  events?: CalendarEvent[]
}

export interface CalendarEvent {
  id: string
  title: string
  startTime: string
  endTime: string
  status?: string
  color?: string
}

export interface CalendarProps {
  selectedDate?: Date | null
  onDateSelect?: (date: Date) => void
  events?: Record<string, CalendarEvent[]>
  minDate?: Date
  maxDate?: Date
  disabledDates?: string[]
  disabledDaysOfWeek?: number[]
  highlightedDates?: string[]
  className?: string
  showOutsideDays?: boolean
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
  return date.toISOString().split('T')[0]
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

export function Calendar({
  selectedDate,
  onDateSelect,
  events = {},
  minDate,
  maxDate,
  disabledDates = [],
  disabledDaysOfWeek = [],
  highlightedDates = [],
  className,
  showOutsideDays = true,
}: CalendarProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [viewDate, setViewDate] = useState(() => {
    if (selectedDate) return new Date(selectedDate)
    return new Date()
  })

  const currentYear = viewDate.getFullYear()
  const currentMonth = viewDate.getMonth()

  const calendarDays = useMemo(() => {
    const days: CalendarDay[] = []
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
        isDisabled: isDateDisabled(date, dateString),
        events: events[dateString] || [],
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
        isDisabled: isDateDisabled(date, dateString),
        events: events[dateString] || [],
      })
    }

    // Next month days
    const remainingDays = 42 - days.length // 6 rows × 7 days
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
        isDisabled: isDateDisabled(date, dateString),
        events: events[dateString] || [],
      })
    }

    return days
  }, [
    currentYear,
    currentMonth,
    selectedDate,
    events,
    disabledDates,
    disabledDaysOfWeek,
    minDate,
    maxDate,
  ])

  function isDateDisabled(date: Date, dateString: string): boolean {
    if (minDate && date < minDate) return true
    if (maxDate && date > maxDate) return true
    if (disabledDates.includes(dateString)) return true
    if (disabledDaysOfWeek.includes(date.getDay())) return true
    return false
  }

  function goToPreviousMonth() {
    setViewDate(new Date(currentYear, currentMonth - 1, 1))
  }

  function goToNextMonth() {
    setViewDate(new Date(currentYear, currentMonth + 1, 1))
  }

  function goToToday() {
    setViewDate(new Date())
    onDateSelect?.(new Date())
  }

  function handleDateClick(day: CalendarDay) {
    if (day.isDisabled) return
    if (!showOutsideDays && !day.isCurrentMonth) return
    onDateSelect?.(day.date)
  }

  const isHighlighted = (dateString: string) => highlightedDates.includes(dateString)

  return (
    <div className={cn('w-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[160px] text-center">
            {MONTHS[currentMonth]} {currentYear}
          </h2>
          <Button variant="ghost" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button variant="secondary" size="sm" onClick={goToToday}>
          Today
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS_OF_WEEK.map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const hasEvents = day.events && day.events.length > 0

          if (!showOutsideDays && !day.isCurrentMonth) {
            return <div key={index} className="aspect-square" />
          }

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleDateClick(day)}
              disabled={day.isDisabled}
              className={cn(
                'aspect-square p-1 relative rounded-lg transition-all text-sm',
                'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-onprez-blue focus:ring-offset-1',
                !day.isCurrentMonth && 'text-gray-300',
                day.isCurrentMonth && 'text-gray-900',
                day.isToday && 'font-bold',
                day.isToday && !day.isSelected && 'bg-blue-50 text-onprez-blue',
                day.isSelected && 'bg-onprez-blue text-white hover:bg-blue-600',
                day.isDisabled && 'opacity-40 cursor-not-allowed hover:bg-transparent',
                isHighlighted(day.dateString) && !day.isSelected && 'bg-green-50 text-green-700',
                hasEvents && !day.isSelected && 'font-medium'
              )}
            >
              <span className="block">{day.dayOfMonth}</span>
              {hasEvents && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {day.events!.slice(0, 3).map((event, i) => (
                    <span
                      key={i}
                      className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        day.isSelected ? 'bg-white' : 'bg-onprez-blue'
                      )}
                    />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

Calendar.displayName = 'Calendar'
