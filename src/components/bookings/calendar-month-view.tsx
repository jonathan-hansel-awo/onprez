'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

export interface CalendarSpecialDate {
  id: string
  date: string
  name: string
  isClosed: boolean
  openTime: string | null
  closeTime: string | null
  notes: string | null
  isRecurring: boolean
}

export interface MonthCalendarData {
  bookingCounts: Record<string, number>
  specialDates: CalendarSpecialDate[]
}

interface CalendarMonthViewProps {
  isSelecting?: boolean
  selectedDates?: string[]
  refreshTrigger?: number
  onSelectedDatesChange?: (dates: string[]) => void
  onDayClick?: (date: string) => void
  onSpecialDateClick?: (specialDate: CalendarSpecialDate) => void
  onDataChange?: (data: MonthCalendarData) => void
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function CalendarMonthView({
  isSelecting = false,
  selectedDates = [],
  refreshTrigger,
  onSelectedDatesChange,
  onDayClick,
  onSpecialDateClick,
  onDataChange,
}: CalendarMonthViewProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()))
  const [data, setData] = useState<MonthCalendarData>({ bookingCounts: {}, specialDates: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchMonth() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `/api/dashboard/bookings/month?month=${format(currentMonth, 'yyyy-MM')}`,
          {
            signal: controller.signal,
          }
        )
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to load month')
        }

        const nextData = {
          bookingCounts: result.data.bookingCounts || {},
          specialDates: result.data.specialDates || [],
        }
        setData(nextData)
        onDataChange?.(nextData)
      } catch (loadError) {
        if ((loadError as Error).name !== 'AbortError') {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load month')
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    fetchMonth()
    return () => controller.abort()
  }, [currentMonth, refreshTrigger, onDataChange])

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: 1 }),
      end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
    })
  }, [currentMonth])

  const specialDatesByDate = useMemo(
    () => new Map(data.specialDates.map(specialDate => [specialDate.date, specialDate])),
    [data.specialDates]
  )
  const selected = useMemo(() => new Set(selectedDates), [selectedDates])

  function changeMonth(nextMonth: Date) {
    setCurrentMonth(nextMonth)
    onSelectedDatesChange?.([])
  }

  function handleDayClick(day: Date) {
    const date = format(day, 'yyyy-MM-dd')
    const specialDate = specialDatesByDate.get(date)

    if (specialDate) {
      onSpecialDateClick?.(specialDate)
      return
    }

    if (isSelecting) {
      if (!isSameMonth(day, currentMonth) || isBefore(day, startOfDay(new Date()))) return

      const nextDates = selected.has(date)
        ? selectedDates.filter(selectedDate => selectedDate !== date)
        : [...selectedDates, date].sort()
      onSelectedDatesChange?.(nextDates)
      return
    }

    onDayClick?.(date)
  }

  return (
    <div className="flex h-full min-h-[560px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-2 sm:justify-start">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => changeMonth(subMonths(currentMonth, 1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-40 text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => changeMonth(addMonths(currentMonth, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Bookings
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Closed
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => changeMonth(startOfMonth(new Date()))}
          >
            Today
          </Button>
        </div>
      </div>

      {isSelecting && (
        <div className="border-b border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800">
          Select one or more dates to block. Select a date again to remove it.
        </div>
      )}

      {error && (
        <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {WEEKDAYS.map(day => (
          <div
            key={day}
            className="px-1 py-2 text-center text-xs font-semibold uppercase text-gray-500 sm:px-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="relative grid flex-1 grid-cols-7 auto-rows-fr">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/75">
            <Loader2 className="h-8 w-8 animate-spin text-onprez-blue" />
          </div>
        )}

        {days.map(day => {
          const date = format(day, 'yyyy-MM-dd')
          const bookingCount = data.bookingCounts[date] || 0
          const specialDate = specialDatesByDate.get(date)
          const isSelected = selected.has(date)
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const selectionDisabled =
            isSelecting && (!isCurrentMonth || isBefore(day, startOfDay(new Date())))

          return (
            <button
              type="button"
              key={date}
              onClick={() => handleDayClick(day)}
              disabled={selectionDisabled}
              aria-pressed={isSelecting ? isSelected : undefined}
              aria-label={`${format(day, 'EEEE d MMMM yyyy')}${bookingCount ? `, ${bookingCount} bookings` : ''}${specialDate ? `, ${specialDate.isClosed ? 'closed' : 'special hours'}: ${specialDate.name}` : ''}`}
              className={cn(
                'group relative min-h-20 border-b border-r border-gray-100 p-1 text-left transition-colors sm:min-h-24 sm:p-2',
                !isCurrentMonth && 'bg-gray-50 text-gray-400',
                isCurrentMonth && !specialDate && 'hover:bg-blue-50',
                specialDate?.isClosed && 'bg-red-50 hover:bg-red-100',
                specialDate && !specialDate.isClosed && 'bg-amber-50 hover:bg-amber-100',
                isSelected && 'z-[1] bg-blue-100 ring-2 ring-inset ring-onprez-blue',
                selectionDisabled && 'cursor-not-allowed opacity-50'
              )}
            >
              <span
                className={cn(
                  'inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium',
                  isToday(day) && 'bg-onprez-blue text-white'
                )}
              >
                {format(day, 'd')}
              </span>

              <div className="mt-1 space-y-1">
                {bookingCount > 0 && (
                  <span className="flex items-center gap-1 truncate rounded bg-blue-100 px-1 py-0.5 text-[10px] font-semibold text-blue-800 sm:text-xs">
                    <span className="h-1.5 w-1.5 flex-none rounded-full bg-blue-500" />
                    <span>{bookingCount}</span>
                    <span className="hidden sm:inline">booking{bookingCount === 1 ? '' : 's'}</span>
                  </span>
                )}
                {specialDate && (
                  <span
                    className={cn(
                      'flex items-center gap-1 truncate rounded px-1 py-0.5 text-[10px] font-semibold sm:text-xs',
                      specialDate.isClosed
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 flex-none rounded-full',
                        specialDate.isClosed ? 'bg-red-500' : 'bg-amber-500'
                      )}
                    />
                    <span className="hidden sm:inline">
                      {specialDate.isClosed ? 'Closed' : specialDate.name}
                    </span>
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {!isLoading && days.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-gray-500">
          <CalendarDays className="mb-3 h-10 w-10 text-gray-300" />
          No calendar days available
        </div>
      )}
    </div>
  )
}
