'use client'

import { useState, useEffect, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { Loader2, Calendar } from 'lucide-react'
import { CalendarDayHeader } from './calendar-day-header'
import { CalendarTimeSlot } from './calendar-time-slot'
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

interface BusinessHours {
  open: string
  close: string
  closed?: boolean
}

interface CalendarDayViewProps {
  onBookingClick?: (booking: Booking) => void
  onAddBooking?: (time?: string) => void
  refreshTrigger?: number
}

// Generate time slots from 00:00 to 23:30 in 30-minute increments
function generateTimeSlots(): string[] {
  const slots: string[] = []
  for (let hour = 0; hour < 24; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`)
    slots.push(`${hour.toString().padStart(2, '0')}:30`)
  }
  return slots
}

export function CalendarDayView({
  onBookingClick,
  onAddBooking,
  refreshTrigger,
}: CalendarDayViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [businessHours, setBusinessHours] = useState<BusinessHours | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
  })

  const timeSlots = useMemo(() => generateTimeSlots(), [])

  // Fetch day's bookings
  const fetchDayBookings = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const dateStr = format(currentDate, 'yyyy-MM-dd')
      const response = await fetch(`/api/dashboard/bookings/day?date=${dateStr}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch bookings')
      }

      setBookings(result.data.bookings)
      setBusinessHours(result.data.businessHours)
      setStats(result.data.stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedule')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDayBookings()
  }, [currentDate, refreshTrigger])

  // Group bookings by time slot
  const bookingsBySlot = useMemo(() => {
    const grouped: Record<string, Booking[]> = {}

    bookings.forEach(booking => {
      const startTime = new Date(booking.startTime)
      const slotTime = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes() < 30 ? '00' : '30'}`

      if (!grouped[slotTime]) {
        grouped[slotTime] = []
      }
      grouped[slotTime].push(booking)
    })

    return grouped
  }, [bookings])

  // Determine if a time slot is within business hours
  const isWithinBusinessHours = (time: string): boolean => {
    if (!businessHours || businessHours.closed) return false

    const [hours, minutes] = time.split(':').map(Number)
    const slotMinutes = hours * 60 + minutes

    const [openHours, openMinutes] = (businessHours.open || '09:00').split(':').map(Number)
    const [closeHours, closeMinutes] = (businessHours.close || '17:00').split(':').map(Number)

    const openTotal = openHours * 60 + openMinutes
    const closeTotal = closeHours * 60 + closeMinutes

    return slotMinutes >= openTotal && slotMinutes < closeTotal
  }

  // Get visible time range (business hours +/- 1 hour, or default 8am-6pm)
  const visibleTimeSlots = useMemo(() => {
    if (!businessHours || businessHours.closed) {
      // Default to 8am - 6pm if no business hours or closed
      return timeSlots.filter(slot => {
        const hour = parseInt(slot.split(':')[0])
        return hour >= 8 && hour < 18
      })
    }

    const [openHour] = (businessHours.open || '09:00').split(':').map(Number)
    const [closeHour] = (businessHours.close || '17:00').split(':').map(Number)

    // Show from 1 hour before open to 1 hour after close
    const startHour = Math.max(0, openHour - 1)
    const endHour = Math.min(23, closeHour + 1)

    return timeSlots.filter(slot => {
      const hour = parseInt(slot.split(':')[0])
      return hour >= startHour && hour <= endHour
    })
  }, [timeSlots, businessHours])

  // Handle slot click
  const handleSlotClick = (time: string) => {
    onAddBooking?.(time)
  }

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
          onClick={fetchDayBookings}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <CalendarDayHeader
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onAddBooking={() => onAddBooking?.()}
        stats={stats}
      />

      {/* Business Hours Info */}
      {businessHours && !businessHours.closed && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 text-sm text-blue-700">
          Business hours: {businessHours.open} - {businessHours.close}
        </div>
      )}

      {businessHours?.closed && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 text-sm text-amber-700">
          Business is closed on this day
        </div>
      )}

      {/* Time Slots */}
      <div className="flex-1 overflow-y-auto">
        {visibleTimeSlots.map(time => (
          <CalendarTimeSlot
            key={time}
            time={time}
            bookings={bookingsBySlot[time] || []}
            onBookingClick={onBookingClick}
            onSlotClick={handleSlotClick}
            isBusinessHours={isWithinBusinessHours(time)}
          />
        ))}
      </div>

      {/* Empty State */}
      {bookings.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center p-8 bg-white/90 rounded-lg shadow-sm">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No bookings for this day</p>
            <button
              onClick={() => onAddBooking?.()}
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
