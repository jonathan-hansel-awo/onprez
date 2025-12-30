'use client'

import { useState } from 'react'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  FileText,
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  Edit,
  XCircle,
  CheckCircle,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  canBeCancelled,
  canBeRescheduled,
  canBeCompleted,
  canBeMarkedNoShow,
} from '@/types/appointment'
import { AppointmentStatus, PaymentStatus } from '@prisma/client'
import { BookingNotesDisplay } from './booking-notes-display'

interface BookingDetails {
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

interface BookingDetailModalProps {
  isOpen: boolean
  onClose: () => void
  booking: BookingDetails | null
  loading?: boolean
  onStatusChange?: (status: AppointmentStatus) => void
  onReschedule?: () => void
  onCancel?: () => void
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
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

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  if (diffMs < 0) {
    const absDays = Math.abs(diffDays)
    if (absDays === 0) return 'Today'
    if (absDays === 1) return 'Yesterday'
    return `${absDays} days ago`
  }

  if (diffDays === 0) {
    if (diffHours <= 1) return 'In less than an hour'
    return `In ${diffHours} hours`
  }
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays < 7) return `In ${diffDays} days`
  if (diffDays < 30) return `In ${Math.floor(diffDays / 7)} weeks`
  return `In ${Math.floor(diffDays / 30)} months`
}

export function BookingDetailModal({
  isOpen,
  onClose,
  booking,
  loading = false,
  onStatusChange,
  onReschedule,
  onCancel,
}: BookingDetailModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyConfirmation = () => {
    if (booking) {
      navigator.clipboard.writeText(booking.confirmationNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Helper to check appointment capabilities
  const appointmentForChecks = booking
    ? {
        status: booking.status,
        startTime: new Date(booking.startTime),
        endTime: new Date(booking.endTime),
      }
    : null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Booking Details" size="lg">
      {loading ? (
        <ModalBody>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Skeleton className="w-20 h-20 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </ModalBody>
      ) : booking ? (
        <>
          <ModalBody className="space-y-6">
            {/* Status Banner */}
            <div
              className={cn(
                'flex items-center justify-between p-4 rounded-lg',
                APPOINTMENT_STATUS_COLORS[booking.status]
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {booking.status === 'CONFIRMED' && <CheckCircle className="w-6 h-6" />}
                  {booking.status === 'PENDING' && <Clock className="w-6 h-6" />}
                  {booking.status === 'COMPLETED' && <Check className="w-6 h-6" />}
                  {booking.status === 'CANCELLED' && <XCircle className="w-6 h-6" />}
                  {booking.status === 'NO_SHOW' && <AlertCircle className="w-6 h-6" />}
                  {booking.status === 'RESCHEDULED' && <RefreshCw className="w-6 h-6" />}
                </div>
                <div>
                  <p className="font-semibold">{APPOINTMENT_STATUS_LABELS[booking.status]}</p>
                  <p className="text-sm opacity-80">{formatRelativeTime(booking.startTime)}</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-white/20 border-white/30">
                {PAYMENT_STATUS_LABELS[booking.paymentStatus]}
              </Badge>
            </div>

            {/* Confirmation Number */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Confirmation Number</p>
                <p className="text-lg font-mono font-semibold text-gray-900">
                  #{booking.confirmationNumber}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCopyConfirmation}>
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Date & Time */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">Date</span>
                </div>
                <p className="font-semibold text-gray-900">{formatDate(booking.startTime)}</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Time</span>
                </div>
                <p className="font-semibold text-gray-900">
                  {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                </p>
                <p className="text-sm text-gray-500">{booking.duration} minutes</p>
              </div>
            </div>

            {/* Service Details */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Service</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{booking.service.name}</p>
                  <p className="text-sm text-gray-500">{booking.service.duration} min</p>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(booking.totalAmount)}
                </p>
              </div>
            </div>

            {/* Customer Information */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Customer</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-onprez-blue"
                  onClick={() => {
                    // TODO: Navigate to customer profile
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View Profile
                </Button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900">{booking.customerName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <a
                    href={`mailto:${booking.customerEmail}`}
                    className="text-onprez-blue hover:underline"
                  >
                    {booking.customerEmail}
                  </a>
                </div>
                {booking.customerPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <a
                      href={`tel:${booking.customerPhone}`}
                      className="text-onprez-blue hover:underline"
                    >
                      {booking.customerPhone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Notes Section */}
            <div className="border-t border-gray-200 pt-4">
              <BookingNotesDisplay
                bookingId={booking.id}
                businessNotes={booking.businessNotes}
                customerNotes={booking.customerNotes}
                onUpdate={updatedNotes => {
                  // Optionally update local state or trigger refresh
                  console.log('Notes updated:', updatedNotes)
                }}
              />
            </div>

            {/* Payment Info */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 text-gray-500 mb-3">
                <CreditCard className="w-4 h-4" />
                <span className="text-sm font-medium">Payment</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(booking.totalAmount)}
                  </p>
                </div>
                <Badge
                  variant={
                    booking.paymentStatus === 'PAID'
                      ? 'success'
                      : booking.paymentStatus === 'UNPAID'
                        ? 'warning'
                        : 'default'
                  }
                >
                  {PAYMENT_STATUS_LABELS[booking.paymentStatus]}
                </Badge>
              </div>
            </div>

            {/* Created At */}
            <p className="text-sm text-gray-500 text-center">
              Booked on {formatDateTime(booking.createdAt)}
            </p>
          </ModalBody>

          <ModalFooter className="flex-wrap gap-2">
            {/* Quick Status Actions */}
            {appointmentForChecks && canBeCompleted(appointmentForChecks) && (
              <Button
                variant="secondary"
                onClick={() => onStatusChange?.('COMPLETED')}
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Complete
              </Button>
            )}

            {appointmentForChecks && canBeMarkedNoShow(appointmentForChecks) && (
              <Button
                variant="secondary"
                onClick={() => onStatusChange?.('NO_SHOW')}
                className="text-amber-600 border-amber-200 hover:bg-amber-50"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                No Show
              </Button>
            )}

            {appointmentForChecks && canBeRescheduled(appointmentForChecks) && (
              <Button variant="secondary" onClick={onReschedule}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reschedule
              </Button>
            )}

            {appointmentForChecks && canBeCancelled(appointmentForChecks) && (
              <Button
                variant="secondary"
                onClick={onCancel}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}

            <div className="flex-1" />

            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </>
      ) : (
        <ModalBody>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Booking not found</p>
          </div>
        </ModalBody>
      )}
    </Modal>
  )
}
