'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectOption } from '@/components/form/select'
import { DatePicker } from '@/components/ui/date-picker'
import { BookingDetailModal } from '@/components/bookings/booking-detail-modal'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Calendar,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Mail,
  Phone,
  Eye,
  RefreshCw,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_COLORS } from '@/types/appointment'
import { AppointmentStatus, PaymentStatus } from '@prisma/client'
import { RescheduleModal } from '@/components/bookings/reschedule-modal'

interface BookingListItem {
  id: string
  confirmationNumber: string
  startTime: string
  endTime: string
  duration: number
  status: AppointmentStatus
  customerName: string
  customerEmail: string
  customerPhone: string | null
  customerNotes: string | null
  businessNotes: string | null
  totalAmount: number
  paymentStatus: PaymentStatus
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
  createdAt: string
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

// Status change confirmation config
interface StatusChangeConfig {
  title: string
  description: string
  variant: 'info' | 'warning' | 'danger' | 'success'
  confirmLabel: string
}

const STATUS_CHANGE_CONFIG: { [key: string]: StatusChangeConfig } = {
  CONFIRMED: {
    title: 'Confirm Appointment',
    description: 'This will confirm the appointment and notify the customer.',
    variant: 'success',
    confirmLabel: 'Confirm Appointment',
  },
  COMPLETED: {
    title: 'Mark as Complete',
    description: 'This will mark the appointment as completed. This action cannot be undone.',
    variant: 'success',
    confirmLabel: 'Mark Complete',
  },
  NO_SHOW: {
    title: 'Mark as No Show',
    description: 'This will mark the customer as a no-show. This affects their booking history.',
    variant: 'warning',
    confirmLabel: 'Mark No Show',
  },
  CANCELLED: {
    title: 'Cancel Appointment',
    description: 'Are you sure you want to cancel this appointment? The customer will be notified.',
    variant: 'danger',
    confirmLabel: 'Cancel Appointment',
  },
}

const STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'NO_SHOW', label: 'No Show' },
  { value: 'RESCHEDULED', label: 'Rescheduled' },
]

const SORT_OPTIONS: SelectOption[] = [
  { value: 'startTime-desc', label: 'Date (Newest First)' },
  { value: 'startTime-asc', label: 'Date (Oldest First)' },
  { value: 'createdAt-desc', label: 'Created (Newest First)' },
  { value: 'customerName-asc', label: 'Customer Name (A-Z)' },
]

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount)
}

export default function BookingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State
  const [bookings, setBookings] = useState<BookingListItem[]>([])
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [businessSlug, setBusinessSlug] = useState<string>('')

  // Modal state
  const [selectedBooking, setSelectedBooking] = useState<BookingListItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Status change state
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    bookingId: string
    newStatus: AppointmentStatus
  } | null>(null)
  const [isStatusChanging, setIsStatusChanging] = useState(false)
  const [statusChangeError, setStatusChangeError] = useState<string | null>(null)

  // Filters
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false)
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [startDate, setStartDate] = useState<Date | null>(
    searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : null
  )
  const [endDate, setEndDate] = useState<Date | null>(
    searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : null
  )
  const [sortValue, setSortValue] = useState(
    `${searchParams.get('sortBy') || 'startTime'}-${searchParams.get('sortOrder') || 'desc'}`
  )
  const [showFilters, setShowFilters] = useState(false)

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(search)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [sortBy, sortOrder] = sortValue.split('-')
      const params = new URLSearchParams()

      params.set('page', pagination.page.toString())
      params.set('limit', pagination.limit.toString())
      params.set('sortBy', sortBy)
      params.set('sortOrder', sortOrder)

      if (status) params.set('status', status)
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (startDate) params.set('startDate', startDate.toISOString().split('T')[0])
      if (endDate) params.set('endDate', endDate.toISOString().split('T')[0])

      const response = await fetch(`/api/dashboard/bookings?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch bookings')
      }

      setBookings(result.data.appointments)
      setPagination(result.data.pagination)
      setStatusCounts(result.data.statusCounts)
      setBusinessSlug(result.data.businessSlug || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, status, debouncedSearch, startDate, endDate, sortValue])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (search) params.set('search', search)
    if (startDate) params.set('startDate', startDate.toISOString().split('T')[0])
    if (endDate) params.set('endDate', endDate.toISOString().split('T')[0])

    const [sortBy, sortOrder] = sortValue.split('-')
    if (sortBy !== 'startTime') params.set('sortBy', sortBy)
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder)

    router.replace(`/dashboard/bookings?${params.toString()}`, { scroll: false })
  }, [status, search, startDate, endDate, sortValue, router])

  // Handlers
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleClearFilters = () => {
    setStatus('')
    setSearch('')
    setStartDate(null)
    setEndDate(null)
    setSortValue('startTime-desc')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleViewBooking = (booking: BookingListItem) => {
    setSelectedBooking(booking)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedBooking(null)
  }

  // Status change - show confirmation dialog
  const handleStatusChange = (newStatus: AppointmentStatus) => {
    if (!selectedBooking) return
    setPendingStatusChange({
      bookingId: selectedBooking.id,
      newStatus,
    })
  }

  // Confirm status change
  const confirmStatusChange = async () => {
    if (!pendingStatusChange) return

    setIsStatusChanging(true)
    setStatusChangeError(null)

    try {
      const response = await fetch(
        `/api/dashboard/bookings/${pendingStatusChange.bookingId}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: pendingStatusChange.newStatus }),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update status')
      }

      // Update the booking in local state
      setBookings(prev =>
        prev.map(b =>
          b.id === pendingStatusChange.bookingId
            ? { ...b, status: pendingStatusChange.newStatus }
            : b
        )
      )

      // Update selected booking if open
      if (selectedBooking?.id === pendingStatusChange.bookingId) {
        setSelectedBooking(prev =>
          prev ? { ...prev, status: pendingStatusChange.newStatus } : null
        )
      }

      // Refresh to get updated counts
      fetchBookings()

      // Close dialogs
      setPendingStatusChange(null)
      handleCloseModal()
    } catch (err) {
      setStatusChangeError(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setIsStatusChanging(false)
    }
  }

  // Cancel status change
  const cancelStatusChange = () => {
    setPendingStatusChange(null)
    setStatusChangeError(null)
  }

  const handleReschedule = () => {
    if (selectedBooking) {
      setIsRescheduleOpen(true)
    }
  }

  const handleRescheduleSubmit = async (
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
        body: JSON.stringify({ date, startTime, endTime, reason }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reschedule')
      }

      // Update local state with new times
      setBookings(prev =>
        prev.map(b =>
          b.id === selectedBooking.id
            ? {
                ...b,
                startTime: result.data.startTime,
                endTime: result.data.endTime,
                duration: result.data.duration,
                status: result.data.status,
              }
            : b
        )
      )

      // Refresh data
      fetchBookings()

      // Close modals
      setIsRescheduleOpen(false)
      handleCloseModal()
    } catch (err) {
      throw err // Let the modal handle the error display
    } finally {
      setIsRescheduling(false)
    }
  }

  const handleRescheduleClose = () => {
    setIsRescheduleOpen(false)
  }

  const handleCancel = () => {
    if (selectedBooking) {
      handleStatusChange('CANCELLED')
    }
  }

  const hasActiveFilters = status || search || startDate || endDate

  const getTotalForStatus = (statusValue: string) => {
    if (!statusValue) {
      return Object.values(statusCounts).reduce((sum, count) => sum + count, 0)
    }
    return statusCounts[statusValue] || 0
  }

  // Get config for pending status change dialog
  const statusChangeConfig = pendingStatusChange
    ? STATUS_CHANGE_CONFIG[pendingStatusChange.newStatus]
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-600 mt-1">Manage and track all your appointments</p>
        </div>
        <Button variant="secondary" onClick={fetchBookings} disabled={loading}>
          <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map(option => {
          const count = getTotalForStatus(option.value)
          const isActive = status === option.value

          return (
            <button
              key={option.value}
              onClick={() => {
                setStatus(option.value)
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-onprez-blue text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {option.label}
              <span
                className={cn(
                  'ml-2 px-2 py-0.5 rounded-full text-xs',
                  isActive ? 'bg-white/20' : 'bg-gray-200'
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by customer name, email, or service..."
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value)
                    setPagination(prev => ({ ...prev, page: 1 }))
                  }}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-onprez-blue transition-colors"
                />
              </div>
            </div>

            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {hasActiveFilters && <span className="ml-2 w-2 h-2 bg-onprez-blue rounded-full" />}
            </Button>

            <div
              className={cn(
                'flex flex-col lg:flex-row gap-4',
                showFilters ? 'flex' : 'hidden lg:flex'
              )}
            >
              <DatePicker
                value={startDate}
                onChange={date => {
                  setStartDate(date)
                  setPagination(prev => ({ ...prev, page: 1 }))
                }}
                placeholder="Start date"
                clearable
                className="w-full lg:w-40"
              />

              <DatePicker
                value={endDate}
                onChange={date => {
                  setEndDate(date)
                  setPagination(prev => ({ ...prev, page: 1 }))
                }}
                placeholder="End date"
                clearable
                minDate={startDate || undefined}
                className="w-full lg:w-40"
              />

              <Select
                value={sortValue}
                onChange={e => setSortValue(e.target.value)}
                options={SORT_OPTIONS}
                className="w-full lg:w-48"
              />

              {hasActiveFilters && (
                <Button variant="ghost" onClick={handleClearFilters} className="text-gray-600">
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-700">{error}</p>
            <Button variant="secondary" onClick={fetchBookings} className="mt-2">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-16 h-16 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <Skeleton className="w-24 h-8 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && bookings.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600 mb-4">
              {hasActiveFilters
                ? 'Try adjusting your filters to find more results.'
                : "You don't have any bookings yet."}
            </p>
            {hasActiveFilters && (
              <Button variant="secondary" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bookings List */}
      {!loading && !error && bookings.length > 0 && (
        <div className="space-y-4">
          {bookings.map(booking => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onView={() => handleViewBooking(booking)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{' '}
            bookings
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(page => {
                  const current = pagination.page
                  return (
                    page === 1 || page === pagination.totalPages || Math.abs(page - current) <= 1
                  )
                })
                .map((page, index, array) => (
                  <div key={page} className="flex items-center">
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="px-2 text-gray-400">...</span>
                    )}
                    <button
                      onClick={() => handlePageChange(page)}
                      className={cn(
                        'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                        pagination.page === page ? 'bg-onprez-blue text-white' : 'hover:bg-gray-100'
                      )}
                    >
                      {page}
                    </button>
                  </div>
                ))}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Booking Detail Modal */}
      <BookingDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        booking={selectedBooking}
        onStatusChange={handleStatusChange}
        onReschedule={handleReschedule}
        onCancel={handleCancel}
      />

      {/* Status Change Confirmation Dialog */}
      {statusChangeConfig && (
        <ConfirmDialog
          isOpen={!!pendingStatusChange}
          onClose={cancelStatusChange}
          onConfirm={confirmStatusChange}
          title={statusChangeConfig.title}
          description={statusChangeConfig.description}
          confirmLabel={statusChangeConfig.confirmLabel}
          variant={statusChangeConfig.variant}
          isLoading={isStatusChanging}
        >
          {statusChangeError && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{statusChangeError}</p>
            </div>
          )}
        </ConfirmDialog>
      )}

      {/* Reschedule Modal */}
      <RescheduleModal
        isOpen={isRescheduleOpen}
        onClose={handleRescheduleClose}
        onReschedule={handleRescheduleSubmit}
        businessSlug={businessSlug}
        booking={
          selectedBooking
            ? {
                id: selectedBooking.id,
                confirmationNumber: selectedBooking.confirmationNumber,
                startTime: selectedBooking.startTime,
                endTime: selectedBooking.endTime,
                duration: selectedBooking.duration,
                service: selectedBooking.service,
              }
            : null
        }
        isLoading={isRescheduling}
      />
    </div>
  )
}

// Booking Card Component
interface BookingCardProps {
  booking: BookingListItem
  onView: () => void
}

function BookingCard({ booking, onView }: BookingCardProps) {
  const statusColors = APPOINTMENT_STATUS_COLORS[booking.status]

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onView}>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-shrink-0 w-full sm:w-auto">
            <div className="bg-gray-50 rounded-lg p-3 text-center sm:w-24">
              <div className="text-xs text-gray-500 uppercase">
                {new Date(booking.startTime).toLocaleDateString('en-GB', { weekday: 'short' })}
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {new Date(booking.startTime).getDate()}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(booking.startTime).toLocaleDateString('en-GB', { month: 'short' })}
              </div>
              <div className="mt-2 text-sm font-medium text-onprez-blue">
                {formatTime(booking.startTime)}
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-semibold text-gray-900">{booking.service.name}</h3>
                <p className="text-sm text-gray-500">#{booking.confirmationNumber}</p>
              </div>
              <Badge variant="secondary" className={statusColors}>
                {APPOINTMENT_STATUS_LABELS[booking.status]}
              </Badge>
            </div>

            <div className="space-y-1 mb-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{booking.customerName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span className="truncate">{booking.customerEmail}</span>
              </div>
              {booking.customerPhone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{booking.customerPhone}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-gray-500">
                <Clock className="w-4 h-4" />
                <span>{booking.duration} min</span>
              </div>
              <div className="font-medium text-gray-900">{formatCurrency(booking.totalAmount)}</div>
            </div>
          </div>

          <div className="flex sm:flex-col gap-2" onClick={e => e.stopPropagation()}>
            <Button variant="secondary" size="sm" onClick={onView} className="flex-1 sm:flex-none">
              <Eye className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">View</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
