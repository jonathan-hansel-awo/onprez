'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDayView } from '@/components/bookings/calendar-day-view'
import { CalendarWeekView } from '@/components/bookings/calendar-week-view'
import { CalendarViewToggle } from '@/components/bookings/calendar-view-toggle'
import { BookingDetailModal } from '@/components/bookings/booking-detail-modal'
import { QuickCreateBookingModal } from '@/components/bookings/quick-create-booking-modal'
import { RescheduleModal } from '@/components/bookings/reschedule-modal'
import { CancelBookingModal, CancellationReason } from '@/components/bookings/cancel-booking-modal'

type CalendarView = 'day' | 'week'

// Type from CalendarDayView/API response
interface CalendarBooking {
  id: string
  status: string
  startTime: string
  endTime: string
  duration: number
  customerNotes: string | null
  businessNotes?: string | null
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

// Transform API booking to BookingDetails for detail modal
function toBookingDetails(booking: CalendarBooking) {
  return {
    id: booking.id,
    confirmationNumber: booking.id.slice(0, 8).toUpperCase(),
    startTime: booking.startTime,
    endTime: booking.endTime,
    duration: booking.duration,
    status: booking.status as 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW',
    customerName: booking.customer.name,
    customerEmail: booking.customer.email,
    customerPhone: booking.customer.phone,
    customerNotes: booking.customerNotes,
    businessNotes: booking.businessNotes || null,
    totalAmount: booking.service.price,
    paymentStatus: 'UNPAID' as const,
    service: booking.service,
    customer: booking.customer,
    createdAt: new Date().toISOString(),
  }
}

export default function CalendarPage() {
  const router = useRouter()

  // View state
  const [view, setView] = useState<CalendarView>('week')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Raw booking from calendar
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null)

  // Modal states
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false)
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false)
  const [isCancelOpen, setIsCancelOpen] = useState(false)

  // Loading states
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  // Refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Initial time for quick create (from slot click)
  const [initialTime, setInitialTime] = useState<string | undefined>()

  // Business slug
  const [businessSlug, setBusinessSlug] = useState('')

  useEffect(() => {
    const fetchBusinessSlug = async () => {
      try {
        const response = await fetch('/api/dashboard/business')
        const result = await response.json()
        if (result.success && result.data?.slug) {
          setBusinessSlug(result.data.slug)
        }
      } catch (error) {
        console.error('Failed to fetch business:', error)
      }
    }
    fetchBusinessSlug()
  }, [])

  // Handlers
  const handleBookingClick = (booking: CalendarBooking) => {
    setSelectedBooking(booking)
    setIsDetailOpen(true)
  }

  const handleDayClick = (date: string) => {
    setSelectedDate(date)
    setView('day')
  }

  const handleAddBooking = (time?: string) => {
    setInitialTime(time)
    setIsQuickCreateOpen(true)
  }

  const handleOpenReschedule = () => {
    setIsDetailOpen(false)
    setIsRescheduleOpen(true)
  }

  const handleOpenCancel = () => {
    setIsDetailOpen(false)
    setIsCancelOpen(true)
  }

  const handleStatusChange = async (status: string) => {
    if (!selectedBooking) return

    try {
      const response = await fetch(`/api/dashboard/bookings/${selectedBooking.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        setRefreshTrigger(prev => prev + 1)
        setIsDetailOpen(false)
        setSelectedBooking(null)
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleQuickCreateSuccess = () => {
    setIsQuickCreateOpen(false)
    setInitialTime(undefined)
    setRefreshTrigger(prev => prev + 1)
  }

  const handleReschedule = async (
    date: string,
    startTime: string,
    endTime: string,
    reason?: string
  ) => {
    if (!selectedBooking) return

    setIsRescheduling(true)
    try {
      const response = await fetch(`/api/dashboard/bookings/${selectedBooking.id}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          startTime,
          endTime,
          reason,
          notifyCustomer: true,
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to reschedule')
      }

      setIsRescheduleOpen(false)
      setSelectedBooking(null)
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error('Reschedule error:', error)
      throw error
    } finally {
      setIsRescheduling(false)
    }
  }

  const handleCancel = async (
    reason: CancellationReason,
    customReason?: string,
    notifyCustomer?: boolean
  ) => {
    if (!selectedBooking) return

    setIsCancelling(true)
    try {
      const reasonText = reason === 'OTHER' ? customReason : reason

      const response = await fetch(`/api/dashboard/bookings/${selectedBooking.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reasonText,
          notifyCustomer: notifyCustomer ?? true,
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to cancel')
      }

      setIsCancelOpen(false)
      setSelectedBooking(null)
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error('Cancel error:', error)
      throw error
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* View Toggle */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">Calendar</h1>
        <CalendarViewToggle view={view} onChange={setView} />
      </div>

      {/* Calendar View */}
      <div className="flex-1 overflow-hidden">
        {view === 'day' ? (
          <CalendarDayView
            onBookingClick={handleBookingClick}
            onAddBooking={handleAddBooking}
            refreshTrigger={refreshTrigger}
          />
        ) : (
          <CalendarWeekView
            onBookingClick={handleBookingClick}
            onDayClick={handleDayClick}
            onAddBooking={() => handleAddBooking()}
            refreshTrigger={refreshTrigger}
          />
        )}
      </div>

      {/* Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={toBookingDetails(selectedBooking)}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false)
            setSelectedBooking(null)
          }}
          onReschedule={handleOpenReschedule}
          onCancel={handleOpenCancel}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Quick Create Modal */}
      <QuickCreateBookingModal
        isOpen={isQuickCreateOpen}
        onClose={() => {
          setIsQuickCreateOpen(false)
          setInitialTime(undefined)
        }}
        onSuccess={handleQuickCreateSuccess}
        businessSlug={businessSlug}
      />

      {/* Reschedule Modal */}
      {selectedBooking && (
        <RescheduleModal
          isOpen={isRescheduleOpen}
          onClose={() => setIsRescheduleOpen(false)}
          onReschedule={handleReschedule}
          booking={{
            id: selectedBooking.id,
            confirmationNumber: selectedBooking.id.slice(0, 8).toUpperCase(),
            startTime: selectedBooking.startTime,
            endTime: selectedBooking.endTime,
            duration: selectedBooking.duration,
            service: {
              id: selectedBooking.service.id,
              name: selectedBooking.service.name,
              duration: selectedBooking.service.duration,
            },
          }}
          businessSlug={businessSlug}
          isLoading={isRescheduling}
        />
      )}

      {/* Cancel Modal */}
      {selectedBooking && (
        <CancelBookingModal
          isOpen={isCancelOpen}
          onClose={() => setIsCancelOpen(false)}
          onCancel={handleCancel}
          booking={{
            id: selectedBooking.id,
            confirmationNumber: selectedBooking.id.slice(0, 8).toUpperCase(),
            startTime: selectedBooking.startTime,
            endTime: selectedBooking.endTime,
            service: {
              name: selectedBooking.service.name,
            },
            customer: {
              name: selectedBooking.customer.name,
              email: selectedBooking.customer.email,
            },
          }}
          isLoading={isCancelling}
        />
      )}
    </div>
  )
}
