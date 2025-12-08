'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { BookingCalendar, Appointment } from '@/components/ui/booking-calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FormError } from '@/components/form'
import {
  Plus,
  Loader2,
  X,
  Clock,
  User,
  Mail,
  Phone,
  FileText,
  CheckCircle,
  XCircle,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_ACTIONS: Record<
  string,
  { label: string; nextStatus: string; icon: React.ReactNode }[]
> = {
  PENDING: [
    { label: 'Confirm', nextStatus: 'CONFIRMED', icon: <CheckCircle className="w-4 h-4" /> },
    { label: 'Cancel', nextStatus: 'CANCELLED', icon: <XCircle className="w-4 h-4" /> },
  ],
  CONFIRMED: [
    { label: 'Complete', nextStatus: 'COMPLETED', icon: <CheckCircle className="w-4 h-4" /> },
    { label: 'No Show', nextStatus: 'NO_SHOW', icon: <XCircle className="w-4 h-4" /> },
    { label: 'Cancel', nextStatus: 'CANCELLED', icon: <XCircle className="w-4 h-4" /> },
  ],
}

export default function BookingsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/appointments?limit=100')
      const data = await response.json()

      if (data.success) {
        setAppointments(data.data.appointments)
      } else {
        setError('Failed to load appointments')
      }
    } catch (err) {
      setError('Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  async function handleStatusUpdate(appointmentId: string, newStatus: string) {
    setUpdatingStatus(true)
    setError('')

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (data.success) {
        await fetchAppointments()
        setSelectedAppointment(null)
      } else {
        setError(data.error || 'Failed to update status')
      }
    } catch (err) {
      setError('Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  function formatDateTime(dateString: string): string {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  function formatPrice(price: number | string): string {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(numPrice)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-600 mt-1">Manage your appointments</p>
        </div>
        <Button variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          New Booking
        </Button>
      </div>

      {error && <FormError errors={error} dismissible onDismiss={() => setError('')} />}

      <BookingCalendar
        appointments={appointments}
        loading={loading}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        onAppointmentClick={setSelectedAppointment}
      />

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-lg">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>{selectedAppointment.service.name}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {formatDateTime(selectedAppointment.startTime)}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedAppointment(null)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <Badge
                  variant={
                    selectedAppointment.status === 'CONFIRMED'
                      ? 'success'
                      : selectedAppointment.status === 'PENDING'
                        ? 'warning'
                        : selectedAppointment.status === 'CANCELLED'
                          ? 'destructive'
                          : 'secondary'
                  }
                >
                  {selectedAppointment.status}
                </Badge>
              </div>

              {/* Time */}
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>
                  {new Date(selectedAppointment.startTime).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  -{' '}
                  {new Date(selectedAppointment.endTime).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="text-gray-400">({selectedAppointment.duration} min)</span>
              </div>

              {/* Customer Info */}
              <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{selectedAppointment.customerName}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{selectedAppointment.customerEmail}</span>
                </div>
                {selectedAppointment.customerPhone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{selectedAppointment.customerPhone}</span>
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="font-medium">Total</span>
                <span className="text-lg font-bold">
                  {formatPrice(selectedAppointment.service.price)}
                </span>
              </div>

              {/* Actions */}
              {STATUS_ACTIONS[selectedAppointment.status] && (
                <div className="flex gap-2 pt-2">
                  {STATUS_ACTIONS[selectedAppointment.status].map(action => (
                    <Button
                      key={action.nextStatus}
                      variant={action.nextStatus === 'CANCELLED' ? 'destructive' : 'secondary'}
                      size="sm"
                      onClick={() => handleStatusUpdate(selectedAppointment.id, action.nextStatus)}
                      disabled={updatingStatus}
                      className="flex-1"
                    >
                      {updatingStatus ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          {action.icon}
                          <span className="ml-2">{action.label}</span>
                        </>
                      )}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
