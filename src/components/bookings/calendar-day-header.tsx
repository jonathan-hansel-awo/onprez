'use client'

import { ChevronLeft, ChevronRight, Calendar, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format, addDays, subDays, isToday } from 'date-fns'

interface CalendarDayHeaderProps {
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

export function CalendarDayHeader({
  currentDate,
  onDateChange,
  onAddBooking,
  stats,
}: CalendarDayHeaderProps) {
  const goToPreviousDay = () => onDateChange(subDays(currentDate, 1))
  const goToNextDay = () => onDateChange(addDays(currentDate, 1))
  const goToToday = () => onDateChange(new Date())

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border-b border-gray-200">
      {/* Date Navigation */}
      <div className="flex items-center gap-3">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={goToPreviousDay} aria-label="Previous day">
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-2 min-w-[200px] justify-center">
            <Calendar className="w-5 h-5 text-gray-500" />
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900">{format(currentDate, 'EEEE')}</h2>
              <p className="text-sm text-gray-500">{format(currentDate, 'd MMMM yyyy')}</p>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={goToNextDay} aria-label="Next day">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {!isToday(currentDate) && (
          <Button variant="secondary" size="sm" onClick={goToToday}>
            Today
          </Button>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-gray-600">{stats.total} total</span>
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
