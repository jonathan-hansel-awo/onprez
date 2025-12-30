'use client'

import { useState, useEffect, useCallback } from 'react'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Calendar,
  Clock,
  User,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Service {
  id: string
  name: string
  price: number
  duration: number
  category: string | null
}

interface Customer {
  id: string
  name: string
  email: string
  phone: string | null
  totalBookings: number
}

interface TimeSlot {
  startTime: string
  endTime: string
  available: boolean
}

interface QuickCreateBookingModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  businessSlug: string
  initialTime?: string // HH:MM format
}

type Step = 'service' | 'customer' | 'datetime' | 'confirm'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatDisplayDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount)
}

function formatTime(time: string): string {
  return time.slice(0, 5)
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

export function QuickCreateBookingModal({
  isOpen,
  onClose,
  onSuccess,
  businessSlug,
}: QuickCreateBookingModalProps) {
  const [step, setStep] = useState<Step>('service')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Services state
  const [services, setServices] = useState<Service[]>([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  // Customer state
  const [customerMode, setCustomerMode] = useState<'search' | 'new'>('search')
  const [customerSearch, setCustomerSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Customer[]>([])
  const [searchingCustomers, setSearchingCustomers] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
  })

  // Date/Time state
  const today = new Date()
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)

  // Options
  const [customerNotes, setCustomerNotes] = useState('')
  const [businessNotes, setBusinessNotes] = useState('')
  const [sendConfirmation, setSendConfirmation] = useState(true)
  const [skipConflictCheck, setSkipConflictCheck] = useState(false)

  // Fetch services on mount
  useEffect(() => {
    if (isOpen) {
      fetchServices()
      resetForm()
    }
  }, [isOpen])

  const resetForm = () => {
    setStep('service')
    setError(null)
    setSelectedService(null)
    setCustomerMode('search')
    setCustomerSearch('')
    setSearchResults([])
    setSelectedCustomer(null)
    setNewCustomer({ name: '', email: '', phone: '' })
    setSelectedDate(null)
    setSelectedSlot(null)
    setCustomerNotes('')
    setBusinessNotes('')
    setSendConfirmation(true)
    setSkipConflictCheck(false)
    setViewMonth(today.getMonth())
    setViewYear(today.getFullYear())
  }

  const fetchServices = async () => {
    setLoadingServices(true)
    try {
      const response = await fetch('/api/dashboard/services?activeOnly=true')
      const result = await response.json()
      if (result.success) {
        setServices(result.data.services)
      }
    } catch (err) {
      setError('Failed to load services')
    } finally {
      setLoadingServices(false)
    }
  }

  // Customer search with debounce
  useEffect(() => {
    if (customerSearch.length < 2) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setSearchingCustomers(true)
      try {
        const response = await fetch(
          `/api/dashboard/customers/search?q=${encodeURIComponent(customerSearch)}`
        )
        const result = await response.json()
        if (result.success) {
          setSearchResults(result.data.customers)
        }
      } catch (err) {
        console.error('Customer search error:', err)
      } finally {
        setSearchingCustomers(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [customerSearch])

  // Fetch time slots when date is selected
  const fetchTimeSlots = useCallback(
    async (date: Date) => {
      if (!selectedService || !businessSlug) return

      setLoadingSlots(true)
      setError(null)

      try {
        const dateStr = formatDate(date)
        const response = await fetch(
          `/api/availability?slug=${encodeURIComponent(businessSlug)}&date=${dateStr}&serviceId=${selectedService.id}&includeSlots=true`
        )

        if (!response.ok) throw new Error('Failed to fetch available times')

        const result = await response.json()
        const dayAvailability = result.data?.availability?.[0]

        if (dayAvailability?.slots) {
          setTimeSlots(dayAvailability.slots)
        } else {
          setTimeSlots([])
        }
      } catch (err) {
        setError('Failed to load available times')
        setTimeSlots([])
      } finally {
        setLoadingSlots(false)
      }
    },
    [selectedService, businessSlug]
  )

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setSelectedSlot(null)
    fetchTimeSlots(date)
  }

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedSlot) return
    if (customerMode === 'search' && !selectedCustomer) return
    if (customerMode === 'new' && (!newCustomer.name || !newCustomer.email)) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/dashboard/bookings/quick-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService.id,
          date: formatDate(selectedDate),
          startTime: selectedSlot.startTime,
          customerId: selectedCustomer?.id,
          customerName: customerMode === 'new' ? newCustomer.name : undefined,
          customerEmail: customerMode === 'new' ? newCustomer.email : undefined,
          customerPhone: customerMode === 'new' ? newCustomer.phone : undefined,
          customerNotes: customerNotes || undefined,
          businessNotes: businessNotes || undefined,
          sendConfirmation,
          skipConflictCheck,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create booking')
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calendar navigation
  const goToPreviousMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth)
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
    const days: (Date | null)[] = []

    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(viewYear, viewMonth, i))
    }

    return days
  }

  const isDateSelectable = (date: Date): boolean => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return date >= now
  }

  // Step indicators
  const steps: { key: Step; label: string }[] = [
    { key: 'service', label: 'Service' },
    { key: 'customer', label: 'Customer' },
    { key: 'datetime', label: 'Date & Time' },
    { key: 'confirm', label: 'Confirm' },
  ]

  const currentStepIndex = steps.findIndex(s => s.key === step)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Booking"
      description="Manually create a new appointment"
      size="lg"
    >
      <ModalBody className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between">
          {steps.map((s, index) => (
            <div key={s.key} className="flex items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  index <= currentStepIndex ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                )}
              >
                {index < currentStepIndex ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-12 h-1 mx-2',
                    index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Step 1: Service Selection */}
        {step === 'service' && (
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Select a service</h3>

            {loadingServices ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : services.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No services available</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {services.map(service => (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className={cn(
                      'w-full p-4 rounded-lg border-2 text-left transition-all',
                      selectedService?.id === service.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{service.name}</p>
                        <p className="text-sm text-gray-500">{service.duration} min</p>
                      </div>
                      <p className="font-semibold text-gray-900">{formatCurrency(service.price)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Customer Selection */}
        {step === 'customer' && (
          <div>
            <div className="flex gap-2 mb-4">
              <Button
                variant={customerMode === 'search' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setCustomerMode('search')}
              >
                <Search className="w-4 h-4 mr-2" />
                Find Customer
              </Button>
              <Button
                variant={customerMode === 'new' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setCustomerMode('new')}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Customer
              </Button>
            </div>

            {customerMode === 'search' ? (
              <div>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                    placeholder="Search by name, email, or phone..."
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                {searchingCustomers ? (
                  <div className="space-y-2">
                    {[1, 2].map(i => (
                      <Skeleton key={i} className="h-16 rounded-lg" />
                    ))}
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {searchResults.map(customer => (
                      <button
                        key={customer.id}
                        onClick={() => setSelectedCustomer(customer)}
                        className={cn(
                          'w-full p-4 rounded-lg border-2 text-left transition-all',
                          selectedCustomer?.id === customer.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        )}
                      >
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        <p className="text-sm text-gray-500">{customer.email}</p>
                        {customer.phone && (
                          <p className="text-sm text-gray-500">{customer.phone}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {customer.totalBookings} previous booking
                          {customer.totalBookings !== 1 ? 's' : ''}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : customerSearch.length >= 2 ? (
                  <p className="text-gray-500 text-center py-8">No customers found</p>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Type at least 2 characters to search
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCustomer.name}
                    onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Customer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="customer@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone (optional)
                  </label>
                  <input
                    type="tel"
                    value={newCustomer.phone}
                    onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="+44 7700 900000"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Date & Time */}
        {step === 'datetime' && (
          <div>
            {!selectedSlot ? (
              <>
                <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {selectedDate ? 'Select time' : 'Select date'}
                </h3>

                {!selectedDate ? (
                  <>
                    {/* Calendar */}
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={goToPreviousMonth}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        disabled={
                          viewYear === today.getFullYear() && viewMonth === today.getMonth()
                        }
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="font-semibold">
                        {MONTHS[viewMonth]} {viewYear}
                      </span>
                      <button onClick={goToNextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {WEEKDAYS.map(day => (
                        <div
                          key={day}
                          className="text-center text-xs font-medium text-gray-500 py-2"
                        >
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {generateCalendarDays().map((date, index) => {
                        if (!date) {
                          return <div key={`empty-${index}`} className="aspect-square" />
                        }

                        const isSelectable = isDateSelectable(date)
                        const isToday = formatDate(date) === formatDate(today)

                        return (
                          <button
                            key={date.toISOString()}
                            onClick={() => isSelectable && handleDateSelect(date)}
                            disabled={!isSelectable}
                            className={cn(
                              'aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all',
                              isSelectable
                                ? 'hover:bg-blue-50 hover:text-blue-600'
                                : 'text-gray-300 cursor-not-allowed',
                              isToday && 'ring-2 ring-blue-200'
                            )}
                          >
                            {date.getDate()}
                          </button>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Time slots */}
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-600">{formatDisplayDate(selectedDate)}</p>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)}>
                        Change date
                      </Button>
                    </div>

                    {loadingSlots ? (
                      <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                          <Skeleton key={i} className="h-12 rounded-lg" />
                        ))}
                      </div>
                    ) : timeSlots.filter(s => s.available).length === 0 ? (
                      <div className="text-center py-8">
                        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600">No available times</p>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedDate(null)}
                          className="mt-4"
                        >
                          Choose another date
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                        {timeSlots
                          .filter(slot => slot.available)
                          .map(slot => (
                            <button
                              key={slot.startTime}
                              onClick={() => {
                                setSelectedSlot(slot)
                                setStep('confirm')
                              }}
                              className="p-3 rounded-lg text-sm font-medium border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                            >
                              {formatTime(slot.startTime)}
                            </button>
                          ))}
                      </div>
                    )}
                  </>
                )}
              </>
            ) : null}
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 'confirm' && selectedService && selectedDate && selectedSlot && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Review booking details</h3>

            {/* Summary */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
              <div>
                <p className="text-sm text-blue-700">Service</p>
                <p className="font-semibold text-blue-900">{selectedService.name}</p>
                <p className="text-sm text-blue-800">
                  {selectedService.duration} min • {formatCurrency(selectedService.price)}
                </p>
              </div>
              <div className="border-t border-blue-200 pt-3">
                <p className="text-sm text-blue-700">Customer</p>
                <p className="font-semibold text-blue-900">
                  {selectedCustomer?.name || newCustomer.name}
                </p>
                <p className="text-sm text-blue-800">
                  {selectedCustomer?.email || newCustomer.email}
                </p>
              </div>
              <div className="border-t border-blue-200 pt-3">
                <p className="text-sm text-blue-700">Date & Time</p>
                <p className="font-semibold text-blue-900">{formatDisplayDate(selectedDate)}</p>
                <p className="text-sm text-blue-800">
                  {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                </p>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer notes (optional)
              </label>
              <textarea
                value={customerNotes}
                onChange={e => setCustomerNotes(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                placeholder="Any notes from the customer..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Internal notes (optional)
              </label>
              <textarea
                value={businessNotes}
                onChange={e => setBusinessNotes(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                placeholder="Notes visible only to staff..."
              />
            </div>

            {/* Options */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendConfirmation}
                  onChange={e => setSendConfirmation(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Send confirmation email to customer</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={skipConflictCheck}
                  onChange={e => setSkipConflictCheck(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Allow double-booking (override conflicts)
                </span>
              </label>
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        {step === 'service' && (
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => setStep('customer')} disabled={!selectedService}>
              Continue
            </Button>
          </>
        )}

        {step === 'customer' && (
          <>
            <Button variant="secondary" onClick={() => setStep('service')}>
              Back
            </Button>
            <Button
              onClick={() => setStep('datetime')}
              disabled={
                customerMode === 'search'
                  ? !selectedCustomer
                  : !newCustomer.name || !newCustomer.email
              }
            >
              Continue
            </Button>
          </>
        )}

        {step === 'datetime' && (
          <>
            <Button variant="secondary" onClick={() => setStep('customer')}>
              Back
            </Button>
          </>
        )}

        {step === 'confirm' && (
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedSlot(null)
                setStep('datetime')
              }}
              disabled={isSubmitting}
            >
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Booking'
              )}
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  )
}
