'use client'

import { ChevronLeft, ChevronRight, Calendar, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, isThisWeek } from 'date-fns'

interface CalendarWeekHeaderProps {
  currentDate: Date
  onDateChange: (date: Date) => void
  onAddBooking?: () => void
  stats?: {
    total: number
    confirmed: number
    pending: number
    completed: number
    cancelled: number
  }
}

export function CalendarWeekHeader({
  currentDate,
  onDateChange,
  onAddBooking,
  stats,
}: CalendarWeekHeaderProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })

  const goToPreviousWeek = () => onDateChange(subWeeks(currentDate, 1))
  const goToNextWeek = () => onDateChange(addWeeks(currentDate, 1))
  const goToThisWeek = () => onDateChange(new Date())

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border-b border-gray-200">
      {/* Week Navigation */}
      <div className="flex items-center gap-3">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={goToPreviousWeek} aria-label="Previous week">
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-2 min-w-[280px] justify-center">
            <Calendar className="w-5 h-5 text-gray-500" />
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900">
                {format(weekStart, 'd MMM')} - {format(weekEnd, 'd MMM yyyy')}
              </h2>
              <p className="text-sm text-gray-500">Week {format(currentDate, 'w')}</p>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={goToNextWeek} aria-label="Next week">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {!isThisWeek(currentDate, { weekStartsOn: 1 }) && (
          <Button variant="secondary" size="sm" onClick={goToThisWeek}>
            This Week
          </Button>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-gray-600">{stats.total} bookings</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-600">{stats.confirmed} confirmed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-gray-600">{stats.pending} pending</span>
          </div>
        </div>
      )}

      {/* Add Booking */}
      {onAddBooking && (
        <Button onClick={onAddBooking} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          New Booking
        </Button>
      )}
    </div>
  )
}
