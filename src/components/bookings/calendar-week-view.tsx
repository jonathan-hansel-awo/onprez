'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Loader2, Calendar } from 'lucide-react'
import { CalendarWeekHeader } from './calendar-week-header'
import { CalendarWeekDay } from './calendar-week-day'

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

interface DayData {
  date: string
  dayOfWeek: string
  dayName: string
  dayNumber: string
  isToday: boolean
  bookings: Booking[]
  stats: {
    total: number
    confirmed: number
    pending: number
  }
}

interface CalendarWeekViewProps {
  onBookingClick?: (booking: Booking) => void
  onDayClick?: (date: string) => void
  onAddBooking?: () => void
  refreshTrigger?: number
}

export function CalendarWeekView({
  onBookingClick,
  onDayClick,
  onAddBooking,
  refreshTrigger,
}: CalendarWeekViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState<DayData[]>([])
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
  })

  // Fetch week's bookings
  const fetchWeekBookings = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const dateStr = format(currentDate, 'yyyy-MM-dd')
      const response = await fetch(`/api/dashboard/bookings/week?date=${dateStr}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch bookings')
      }

      setDays(result.data.days)
      setStats(result.data.stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedule')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWeekBookings()
  }, [currentDate, refreshTrigger])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-500">Loading schedule...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchWeekBookings}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Try again
        </button>
      </div>
    )
  }

  const totalBookings = days.reduce((sum, day) => sum + day.bookings.length, 0)

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <CalendarWeekHeader
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onAddBooking={onAddBooking}
        stats={stats}
      />

      {/* Week Grid */}
      <div className="flex-1 flex overflow-x-auto">
        {days.map(day => (
          <CalendarWeekDay
            key={day.date}
            date={day.date}
            dayName={day.dayName}
            dayNumber={day.dayNumber}
            isToday={day.isToday}
            bookings={day.bookings}
            onBookingClick={onBookingClick}
            onDayClick={onDayClick}
          />
        ))}
      </div>

      {/* Empty State */}
      {totalBookings === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center p-8 bg-white/90 rounded-lg shadow-sm">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No bookings this week</p>
            <button
              onClick={onAddBooking}
              className="text-blue-600 hover:text-blue-700 font-medium pointer-events-auto"
            >
              Add a booking
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
