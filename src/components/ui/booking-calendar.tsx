'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Calendar, CalendarEvent } from './calendar'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Button } from './button'
import { Skeleton } from './skeleton'
import {
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  List,
  LayoutGrid,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Appointment {
  id: string
  startTime: string
  endTime: string
  duration: number
  status: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  service: {
    id: string
    name: string
    price: number | string
  }
}

export interface BookingCalendarProps {
  appointments: Appointment[]
  loading?: boolean
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  onAppointmentClick?: (appointment: Appointment) => void
  onViewChange?: (view: 'month' | 'week' | 'day') => void
  view?: 'month' | 'week' | 'day'
  minDate?: Date
  maxDate?: Date
  timezone?: string
  className?: string
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  CONFIRMED: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  COMPLETED: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
  NO_SHOW: { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500' },
  RESCHEDULED: { bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-500' },
}

function formatTime(dateString: string, timezone: string = 'Europe/London'): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  }).format(date)
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function getDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function BookingCalendar({
  appointments,
  loading = false,
  selectedDate,
  onDateSelect,
  onAppointmentClick,
  onViewChange,
  view = 'month',
  minDate,
  maxDate,
  timezone = 'Europe/London',
  className,
}: BookingCalendarProps) {
  const [internalView, setInternalView] = useState(view)

  useEffect(() => {
    setInternalView(view)
  }, [view])

  // Group appointments by date for calendar events
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {}

    appointments.forEach(apt => {
      const dateString = new Date(apt.startTime).toISOString().split('T')[0]
      if (!grouped[dateString]) {
        grouped[dateString] = []
      }
      grouped[dateString].push({
        id: apt.id,
        title: apt.service.name,
        startTime: formatTime(apt.startTime, timezone),
        endTime: formatTime(apt.endTime, timezone),
        status: apt.status,
        color: STATUS_COLORS[apt.status]?.dot || 'bg-gray-500',
      })
    })

    return grouped
  }, [appointments, timezone])

  // Get appointments for selected date
  const selectedDateAppointments = useMemo(() => {
    if (!selectedDate) return []

    const dateString = getDateString(selectedDate)
    return appointments
      .filter(apt => {
        const aptDate = new Date(apt.startTime).toISOString().split('T')[0]
        return aptDate === dateString
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  }, [appointments, selectedDate])

  function handleViewChange(newView: 'month' | 'week' | 'day') {
    setInternalView(newView)
    onViewChange?.(newView)
  }

  if (loading) {
    return (
      <div className={cn('grid grid-cols-1 lg:grid-cols-3 gap-6', className)}>
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-3 gap-6', className)}>
      {/* Calendar */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Calendar
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant={internalView === 'month' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('month')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={internalView === 'day' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('day')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {internalView === 'month' && (
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={onDateSelect}
              events={eventsByDate}
              minDate={minDate}
              maxDate={maxDate}
            />
          )}
          {internalView === 'day' && selectedDate && (
            <DayView
              date={selectedDate}
              appointments={selectedDateAppointments}
              onAppointmentClick={onAppointmentClick}
              onDateChange={onDateSelect}
              timezone={timezone}
            />
          )}
        </CardContent>
      </Card>

      {/* Selected Date Appointments */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">
            {selectedDate ? formatDate(selectedDate) : 'Select a date'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedDate ? (
            <p className="text-gray-500 text-sm">Click on a date to see appointments</p>
          ) : selectedDateAppointments.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No appointments</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {selectedDateAppointments.map(apt => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  onClick={() => onAppointmentClick?.(apt)}
                  timezone={timezone}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface AppointmentCardProps {
  appointment: Appointment
  onClick?: () => void
  timezone: string
}

function AppointmentCard({ appointment, onClick, timezone }: AppointmentCardProps) {
  const statusStyle = STATUS_COLORS[appointment.status] || STATUS_COLORS.PENDING

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full p-3 rounded-lg border-2 text-left transition-all',
        'hover:shadow-md hover:border-onprez-blue/30',
        'focus:outline-none focus:ring-2 focus:ring-onprez-blue focus:ring-offset-1'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-medium text-gray-900 line-clamp-1">{appointment.service.name}</span>
        <Badge variant="secondary" size="sm" className={cn(statusStyle.bg, statusStyle.text)}>
          {appointment.status}
        </Badge>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
        <Clock className="w-3.5 h-3.5" />
        <span>
          {formatTime(appointment.startTime, timezone)} -{' '}
          {formatTime(appointment.endTime, timezone)}
        </span>
        <span className="text-gray-400">({appointment.duration} min)</span>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <User className="w-3.5 h-3.5" />
        <span className="line-clamp-1">{appointment.customerName}</span>
      </div>
    </button>
  )
}

interface DayViewProps {
  date: Date
  appointments: Appointment[]
  onAppointmentClick?: (appointment: Appointment) => void
  onDateChange: (date: Date) => void
  timezone: string
}

function DayView({ date, appointments, onAppointmentClick, onDateChange, timezone }: DayViewProps) {
  const hours = Array.from({ length: 14 }, (_, i) => i + 7) // 7:00 to 20:00

  function goToPreviousDay() {
    const newDate = new Date(date)
    newDate.setDate(newDate.getDate() - 1)
    onDateChange(newDate)
  }

  function goToNextDay() {
    const newDate = new Date(date)
    newDate.setDate(newDate.getDate() + 1)
    onDateChange(newDate)
  }

  function getAppointmentsForHour(hour: number): Appointment[] {
    return appointments.filter(apt => {
      const aptHour = new Date(apt.startTime).getHours()
      return aptHour === hour
    })
  }

  return (
    <div>
      {/* Day navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={goToPreviousDay}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        <h3 className="font-semibold">{formatDate(date)}</h3>
        <Button variant="ghost" size="sm" onClick={goToNextDay}>
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Time grid */}
      <div className="border rounded-lg overflow-hidden">
        {hours.map(hour => {
          const hourAppointments = getAppointmentsForHour(hour)
          const timeLabel = `${String(hour).padStart(2, '0')}:00`

          return (
            <div
              key={hour}
              className={cn(
                'flex border-b last:border-b-0 min-h-[60px]',
                hour % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              )}
            >
              <div className="w-16 flex-shrink-0 p-2 text-sm text-gray-500 border-r bg-gray-50">
                {timeLabel}
              </div>
              <div className="flex-1 p-1">
                {hourAppointments.map(apt => {
                  const statusStyle = STATUS_COLORS[apt.status] || STATUS_COLORS.PENDING
                  return (
                    <button
                      key={apt.id}
                      type="button"
                      onClick={() => onAppointmentClick?.(apt)}
                      className={cn(
                        'w-full p-2 rounded text-left text-sm mb-1 last:mb-0',
                        'hover:opacity-80 transition-opacity',
                        statusStyle.bg,
                        statusStyle.text
                      )}
                    >
                      <div className="font-medium line-clamp-1">{apt.service.name}</div>
                      <div className="text-xs opacity-80">
                        {formatTime(apt.startTime, timezone)} - {apt.customerName}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

BookingCalendar.displayName = 'BookingCalendar'
