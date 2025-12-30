'use client'

import { format } from 'date-fns'
import { User } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Booking {
  id: string
  status: string
  startTime: string
  endTime: string
  duration: number
  customerNotes: string | null
  service: {
    id: string
    name: string
    price: number
    duration: number
  }
  customer: {
    id: string
    name: string
    email: string
    phone: string | null
  }
}

interface CalendarWeekDayProps {
  date: string
  dayName: string
  dayNumber: string
  isToday: boolean
  bookings: Booking[]
  onBookingClick?: (booking: Booking) => void
  onDayClick?: (date: string) => void
}

const statusColors: Record<string, string> = {
  CONFIRMED: 'bg-green-100 border-green-300 text-green-800',
  PENDING: 'bg-amber-100 border-amber-300 text-amber-800',
  COMPLETED: 'bg-blue-100 border-blue-300 text-blue-800',
  CANCELLED: 'bg-gray-100 border-gray-300 text-gray-500',
  NO_SHOW: 'bg-red-100 border-red-300 text-red-800',
}

export function CalendarWeekDay({
  date,
  dayName,
  dayNumber,
  isToday,
  bookings,
  onBookingClick,
  onDayClick,
}: CalendarWeekDayProps) {
  // Sort bookings by start time
  const sortedBookings = [...bookings].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )

  return (
    <div
      className={cn(
        'flex flex-col min-w-[140px] border-r border-gray-200 last:border-r-0',
        isToday && 'bg-blue-50/30'
      )}
    >
      {/* Day Header */}
      <button
        onClick={() => onDayClick?.(date)}
        className={cn(
          'p-3 border-b border-gray-200 text-center hover:bg-gray-50 transition-colors',
          isToday && 'bg-blue-100/50'
        )}
      >
        <p className="text-xs font-medium text-gray-500 uppercase">{dayName}</p>
        <p className={cn('text-2xl font-bold mt-1', isToday ? 'text-blue-600' : 'text-gray-900')}>
          {dayNumber}
        </p>
        {bookings.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
          </p>
        )}
      </button>

      {/* Bookings */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {sortedBookings.length > 0 ? (
          sortedBookings.map(booking => {
            const startTime = new Date(booking.startTime)
            const colorClass = statusColors[booking.status] || statusColors.PENDING

            return (
              <button
                key={booking.id}
                onClick={() => onBookingClick?.(booking)}
                className={cn(
                  'w-full text-left p-2 rounded-lg border transition-all hover:shadow-sm',
                  colorClass
                )}
              >
                <p className="text-xs font-medium">{format(startTime, 'HH:mm')}</p>
                <p className="text-sm font-medium truncate mt-0.5">{booking.service.name}</p>
                <p className="text-xs truncate flex items-center gap-1 mt-1 opacity-80">
                  <User className="w-3 h-3" />
                  {booking.customer.name}
                </p>
              </button>
            )
          })
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-gray-400">No bookings</p>
          </div>
        )}
      </div>
    </div>
  )
}
