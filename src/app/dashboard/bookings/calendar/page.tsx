'use client'

import { useCallback, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDayView } from '@/components/bookings/calendar-day-view'
import { CalendarWeekView } from '@/components/bookings/calendar-week-view'
import {
  CalendarMonthView,
  CalendarSpecialDate,
  MonthCalendarData,
} from '@/components/bookings/calendar-month-view'
import { CalendarViewToggle } from '@/components/bookings/calendar-view-toggle'
import { BookingsViewNavigation } from '@/components/bookings/bookings-view-navigation'
import { BookingDetailModal } from '@/components/bookings/booking-detail-modal'
import { QuickCreateBookingModal } from '@/components/bookings/quick-create-booking-modal'
import { RescheduleModal } from '@/components/bookings/reschedule-modal'
import { CancelBookingModal, CancellationReason } from '@/components/bookings/cancel-booking-modal'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { Input, FormError } from '@/components/form'
import { AlertTriangle, CalendarPlus, CalendarX2, Loader2, X } from 'lucide-react'

type CalendarView = 'month' | 'day' | 'week'

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
  const [view, setView] = useState<CalendarView>('month')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [monthData, setMonthData] = useState<MonthCalendarData>({
    bookingCounts: {},
    specialDates: [],
  })

  // Block-time workflow
  const [isBlockMode, setIsBlockMode] = useState(false)
  const [selectedBlockDates, setSelectedBlockDates] = useState<string[]>([])
  const [blockReason, setBlockReason] = useState('Time off')
  const [blockNotes, setBlockNotes] = useState('')
  const [blockError, setBlockError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isBlocking, setIsBlocking] = useState(false)

  // Existing closure editor
  const [selectedSpecialDate, setSelectedSpecialDate] = useState<CalendarSpecialDate | null>(null)
  const [editName, setEditName] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [specialDateError, setSpecialDateError] = useState('')
  const [isSavingSpecialDate, setIsSavingSpecialDate] = useState(false)
  const [isRemovingSpecialDate, setIsRemovingSpecialDate] = useState(false)

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
    const shouldBlock = new URLSearchParams(window.location.search).get('block') === 'true'

    if (shouldBlock) {
      setView('month')
      setIsBlockMode(true)
    }
  }, [])

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

  const handleMonthDataChange = useCallback((data: MonthCalendarData) => {
    setMonthData(data)
  }, [])

  const clearBlockMode = () => {
    setIsBlockMode(false)
    setSelectedBlockDates([])
    setBlockReason('Time off')
    setBlockNotes('')
    setBlockError('')
    router.replace('/dashboard/bookings/calendar')
  }

  const handleStartBlock = () => {
    setView('month')
    setIsBlockMode(true)
    setSuccessMessage('')
    setBlockError('')
  }

  const handleViewChange = (nextView: CalendarView) => {
    if (nextView !== 'month' && isBlockMode) clearBlockMode()
    setView(nextView)
  }

  const conflictingDates = selectedBlockDates.filter(
    date => (monthData.bookingCounts[date] || 0) > 0
  )
  const conflictingBookingCount = conflictingDates.reduce(
    (total, date) => total + (monthData.bookingCounts[date] || 0),
    0
  )

  const handleBlockDates = async () => {
    if (selectedBlockDates.length === 0) {
      setBlockError('Select at least one date to block.')
      return
    }

    setIsBlocking(true)
    setBlockError('')

    try {
      const response = await fetch('/api/business/special-dates/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dates: selectedBlockDates,
          name: blockReason.trim() || 'Time off',
          notes: blockNotes.trim() || null,
        }),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to block selected dates')
      }

      setSuccessMessage(result.message || 'Selected dates are now closed to new bookings.')
      clearBlockMode()
      setRefreshTrigger(value => value + 1)
    } catch (error) {
      setBlockError(error instanceof Error ? error.message : 'Failed to block selected dates')
    } finally {
      setIsBlocking(false)
    }
  }

  const handleSpecialDateClick = (specialDate: CalendarSpecialDate) => {
    setSelectedSpecialDate(specialDate)
    setEditName(specialDate.name)
    setEditNotes(specialDate.notes || '')
    setSpecialDateError('')
  }

  const closeSpecialDateEditor = () => {
    setSelectedSpecialDate(null)
    setSpecialDateError('')
  }

  const handleSaveSpecialDate = async () => {
    if (!selectedSpecialDate || !editName.trim()) {
      setSpecialDateError('A name or reason is required.')
      return
    }

    setIsSavingSpecialDate(true)
    setSpecialDateError('')

    try {
      const response = await fetch(`/api/business/special-dates/${selectedSpecialDate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), notes: editNotes.trim() || null }),
      })
      const result = await response.json()

      if (!response.ok) throw new Error(result.error || 'Failed to update closure')

      setSuccessMessage('Closure updated successfully.')
      closeSpecialDateEditor()
      setRefreshTrigger(value => value + 1)
    } catch (error) {
      setSpecialDateError(error instanceof Error ? error.message : 'Failed to update closure')
    } finally {
      setIsSavingSpecialDate(false)
    }
  }

  const handleRemoveSpecialDate = async () => {
    if (!selectedSpecialDate) return

    const action = selectedSpecialDate.isClosed ? 'reopen this date' : 'remove these special hours'
    if (!window.confirm(`Are you sure you want to ${action}?`)) return

    setIsRemovingSpecialDate(true)
    setSpecialDateError('')

    try {
      const response = await fetch(`/api/business/special-dates/${selectedSpecialDate.id}`, {
        method: 'DELETE',
      })
      const result = await response.json()

      if (!response.ok) throw new Error(result.error || 'Failed to reopen date')

      setSuccessMessage(
        selectedSpecialDate.isClosed ? 'Date reopened successfully.' : 'Special hours removed.'
      )
      closeSpecialDateEditor()
      setRefreshTrigger(value => value + 1)
    } catch (error) {
      setSpecialDateError(error instanceof Error ? error.message : 'Failed to reopen date')
    } finally {
      setIsRemovingSpecialDate(false)
    }
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
    <div className="flex min-h-[calc(100vh-120px)] flex-col space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Calendar</h1>
          <p className="mt-1 text-gray-600">
            See busy days and manage when your business is closed.
          </p>
        </div>
        <BookingsViewNavigation current="calendar" />
      </div>

      {successMessage && (
        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <span>{successMessage}</span>
          <button type="button" onClick={() => setSuccessMessage('')} aria-label="Dismiss message">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <CalendarViewToggle view={view} onChange={handleViewChange} />
        <div className="flex gap-2">
          <Button
            variant={isBlockMode ? 'primary' : 'secondary'}
            size="sm"
            onClick={handleStartBlock}
          >
            <CalendarX2 className="mr-2 h-4 w-4" />
            Block Time
          </Button>
          <Button size="sm" onClick={() => handleAddBooking()}>
            <CalendarPlus className="mr-2 h-4 w-4" />
            New Booking
          </Button>
        </div>
      </div>

      {isBlockMode && view === 'month' && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="space-y-4 p-4">
            <div>
              <h2 className="font-semibold text-gray-900">Block unavailable dates</h2>
              <p className="mt-1 text-sm text-gray-600">
                Choose multiple dates in the month below. Customers will no longer be offered those
                dates.
              </p>
            </div>

            {blockError && <FormError errors={blockError} />}

            <div className="grid gap-3 md:grid-cols-2">
              <Input
                label="Reason (optional)"
                value={blockReason}
                onChange={event => setBlockReason(event.target.value)}
                placeholder="Time off"
              />
              <Input
                label="Private note (optional)"
                value={blockNotes}
                onChange={event => setBlockNotes(event.target.value)}
                placeholder="Only your team can see this"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-700">
                <strong>{selectedBlockDates.length}</strong>{' '}
                {selectedBlockDates.length === 1 ? 'date selected' : 'dates selected'}
                {selectedBlockDates.length > 0 && (
                  <span className="ml-2 text-gray-500">{selectedBlockDates.join(', ')}</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={clearBlockMode} disabled={isBlocking}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleBlockDates}
                  disabled={isBlocking || selectedBlockDates.length === 0}
                >
                  {isBlocking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Block selected dates
                </Button>
              </div>
            </div>

            {conflictingBookingCount > 0 && (
              <div className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-none" />
                <p>
                  {conflictingBookingCount} existing{' '}
                  {conflictingBookingCount === 1 ? 'booking falls' : 'bookings fall'} on{' '}
                  {conflictingDates.join(', ')}. Blocking prevents new bookings; it does not cancel
                  or change existing appointments.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Calendar View */}
      <div className="min-h-0 flex-1">
        {view === 'month' ? (
          <CalendarMonthView
            isSelecting={isBlockMode}
            selectedDates={selectedBlockDates}
            onSelectedDatesChange={setSelectedBlockDates}
            onDayClick={handleDayClick}
            onSpecialDateClick={handleSpecialDateClick}
            onDataChange={handleMonthDataChange}
            refreshTrigger={refreshTrigger}
          />
        ) : view === 'day' ? (
          <CalendarDayView
            initialDate={selectedDate || undefined}
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

      <Modal
        isOpen={Boolean(selectedSpecialDate)}
        onClose={closeSpecialDateEditor}
        title={selectedSpecialDate?.isClosed ? 'Edit closure' : 'Edit special date'}
        description={selectedSpecialDate?.date}
        size="sm"
      >
        <ModalBody className="space-y-4">
          {specialDateError && <FormError errors={specialDateError} />}
          <Input
            label="Name or reason"
            value={editName}
            onChange={event => setEditName(event.target.value)}
          />
          <Input
            label="Private note (optional)"
            value={editNotes}
            onChange={event => setEditNotes(event.target.value)}
          />
          {selectedSpecialDate?.isClosed && (
            <p className="text-sm text-gray-600">
              Existing appointments remain in the calendar. This closure only stops customers making
              new bookings.
            </p>
          )}
        </ModalBody>
        <ModalFooter className="flex-col-reverse sm:flex-row sm:justify-between">
          <Button
            variant="destructive"
            onClick={handleRemoveSpecialDate}
            disabled={isRemovingSpecialDate || isSavingSpecialDate}
          >
            {isRemovingSpecialDate && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {selectedSpecialDate?.isClosed ? 'Reopen date' : 'Remove special hours'}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={closeSpecialDateEditor}
              disabled={isSavingSpecialDate || isRemovingSpecialDate}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSpecialDate}
              disabled={isSavingSpecialDate || isRemovingSpecialDate}
            >
              {isSavingSpecialDate && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </div>
        </ModalFooter>
      </Modal>

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
