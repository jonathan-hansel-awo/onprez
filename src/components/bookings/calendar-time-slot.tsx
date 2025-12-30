'use client'

import { format } from 'date-fns'
import { Clock, User, Phone, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

interface CalendarTimeSlotProps {
  time: string // HH:MM format
  bookings: Booking[]
  onBookingClick?: (booking: Booking) => void
  onSlotClick?: (time: string) => void
  isBusinessHours?: boolean
}

const statusStyles: Record<string, { bg: string; text: string; border: string }> = {
  CONFIRMED: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  PENDING: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  COMPLETED: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  CANCELLED: {
    bg: 'bg-gray-50',
    text: 'text-gray-500',
    border: 'border-gray-200',
  },
  NO_SHOW: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
}

export function CalendarTimeSlot({
  time,
  bookings,
  onBookingClick,
  onSlotClick,
  isBusinessHours = true,
}: CalendarTimeSlotProps) {
  const hasBookings = bookings.length > 0

  return (
    <div
      className={cn(
        'flex border-b border-gray-100 min-h-[60px]',
        !isBusinessHours && 'bg-gray-50/50'
      )}
    >
      {/* Time Label */}
      <div className="w-20 flex-shrink-0 py-2 px-3 border-r border-gray-100 text-sm text-gray-500 font-medium">
        {time}
      </div>

      {/* Booking Slot */}
      <div
        className={cn(
          'flex-1 py-1 px-2',
          !hasBookings && isBusinessHours && 'hover:bg-gray-50 cursor-pointer'
        )}
        onClick={() => !hasBookings && isBusinessHours && onSlotClick?.(time)}
      >
        {hasBookings ? (
          <div className="space-y-1">
            {bookings.map(booking => {
              const style = statusStyles[booking.status] || statusStyles.PENDING
              const startTime = new Date(booking.startTime)
              const endTime = new Date(booking.endTime)

              return (
                <div
                  key={booking.id}
                  className={cn(
                    'p-2 rounded-lg border cursor-pointer transition-all hover:shadow-sm',
                    style.bg,
                    style.border
                  )}
                  onClick={e => {
                    e.stopPropagation()
                    onBookingClick?.(booking)
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {/* Service & Time */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn('font-medium text-sm', style.text)}>
                          {booking.service.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                        </span>
                      </div>

                      {/* Customer Info */}
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {booking.customer.name}
                        </span>
                        {booking.customer.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {booking.customer.phone}
                          </span>
                        )}
                      </div>

                      {/* Notes Preview */}
                      {booking.customerNotes && (
                        <p className="mt-1 text-xs text-gray-500 truncate">
                          "{booking.customerNotes}"
                        </p>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-1">
                      <span
                        className={cn(
                          'px-2 py-0.5 text-xs font-medium rounded-full',
                          style.bg,
                          style.text
                        )}
                      >
                        {booking.status.toLowerCase()}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          isBusinessHours && (
            <div className="h-full flex items-center justify-center text-xs text-gray-400">
              Click to add booking
            </div>
          )
        )}
      </div>
    </div>
  )
}
