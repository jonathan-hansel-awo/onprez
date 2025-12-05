'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TimePicker } from '@/components/ui/time-picker'
import { Checkbox, FormError } from '@/components/form'
import { Badge } from '@/components/ui/badge'
import { Save, Loader2, Copy, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const HOUR_PRESETS = [
  { label: 'Standard (9AM - 5PM)', open: '09:00', close: '17:00' },
  { label: 'Extended (8AM - 8PM)', open: '08:00', close: '20:00' },
  { label: 'Morning (6AM - 2PM)', open: '06:00', close: '14:00' },
  { label: 'Afternoon (12PM - 8PM)', open: '12:00', close: '20:00' },
  { label: 'Evening (4PM - 10PM)', open: '16:00', close: '22:00' },
]

interface BusinessHour {
  dayOfWeek: number
  openTime: string
  closeTime: string
  isClosed: boolean
  notes: string
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function validateTimeRange(openTime: string, closeTime: string): string | null {
  const openMinutes = timeToMinutes(openTime)
  const closeMinutes = timeToMinutes(closeTime)

  if (closeMinutes <= openMinutes) {
    return 'Closing time must be after opening time'
  }

  if (closeMinutes - openMinutes < 30) {
    return 'Business must be open for at least 30 minutes'
  }

  return null
}

export default function BusinessHoursPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [timezone, setTimezone] = useState('')
  const [dayErrors, setDayErrors] = useState<Record<number, string>>({})

  const [hours, setHours] = useState<BusinessHour[]>(
    Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      openTime: '09:00',
      closeTime: '17:00',
      isClosed: i === 0 || i === 6,
      notes: '',
    }))
  )

  useEffect(() => {
    fetchBusinessHours()
  }, [])

  useEffect(() => {
    // Validate all days whenever hours change
    const errors: Record<number, string> = {}
    hours.forEach((day, index) => {
      if (!day.isClosed) {
        const validationError = validateTimeRange(day.openTime, day.closeTime)
        if (validationError) {
          errors[index] = validationError
        }
      }
    })
    setDayErrors(errors)
  }, [hours])

  async function fetchBusinessHours() {
    try {
      const response = await fetch('/api/business/hours')
      const data = await response.json()

      if (data.success) {
        if (data.data.businessHours.length > 0) {
          setHours(data.data.businessHours)
        }
        setTimezone(data.data.timezone)
      } else {
        setError('Failed to load business hours')
      }
    } catch (err) {
      setError('Failed to load business hours')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Check for validation errors before submitting
    if (Object.keys(dayErrors).length > 0) {
      setError('Please fix the time errors before saving')
      return
    }

    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/business/hours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(data.error || 'Failed to save hours')
      }
    } catch (err) {
      setError('Failed to save hours')
    } finally {
      setSaving(false)
    }
  }

  function updateDay(dayIndex: number, updates: Partial<BusinessHour>) {
    setHours(prev => prev.map((day, i) => (i === dayIndex ? { ...day, ...updates } : day)))
  }

  function copyToAllDays(dayIndex: number) {
    const sourceDayHours = hours[dayIndex]
    setHours(prev =>
      prev.map(day => ({
        ...day,
        openTime: sourceDayHours.openTime,
        closeTime: sourceDayHours.closeTime,
      }))
    )
  }

  function applyPreset(preset: { open: string; close: string }) {
    setHours(prev =>
      prev.map(day => ({
        ...day,
        openTime: preset.open,
        closeTime: preset.close,
      }))
    )
  }

  function setWeekdaysOnly() {
    setHours(prev =>
      prev.map((day, index) => ({
        ...day,
        isClosed: index === 0 || index === 6, // Sunday = 0, Saturday = 6
      }))
    )
  }

  function setAllDaysOpen() {
    setHours(prev =>
      prev.map(day => ({
        ...day,
        isClosed: false,
      }))
    )
  }

  function calculateTotalHours(): string {
    let totalMinutes = 0
    hours.forEach(day => {
      if (!day.isClosed) {
        const openMinutes = timeToMinutes(day.openTime)
        const closeMinutes = timeToMinutes(day.closeTime)
        if (closeMinutes > openMinutes) {
          totalMinutes += closeMinutes - openMinutes
        }
      }
    })
    const totalHours = Math.floor(totalMinutes / 60)
    const remainingMinutes = totalMinutes % 60
    return remainingMinutes > 0 ? `${totalHours}h ${remainingMinutes}m` : `${totalHours}h`
  }

  const hasErrors = Object.keys(dayErrors).length > 0
  const openDaysCount = hours.filter(d => !d.isClosed).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-onprez-blue" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Business Hours</h1>
        <p className="text-gray-600 mt-2">
          Set your weekly schedule
          {timezone && (
            <Badge variant="default" size="sm" className="ml-2">
              <Clock className="w-3 h-3 mr-1" />
              {timezone}
            </Badge>
          )}
        </p>
      </div>

      {error && <FormError errors={error} dismissible onDismiss={() => setError('')} />}

      {success && (
        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl text-green-700">
          ✓ Business hours saved successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quick Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Presets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apply Hours Preset
              </label>
              <div className="flex flex-wrap gap-2">
                {HOUR_PRESETS.map(preset => (
                  <Button
                    key={preset.label}
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => applyPreset(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Day Toggles */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Day Selection
              </label>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={setWeekdaysOnly}>
                  Weekdays Only
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={setAllDaysOpen}>
                  All Days Open
                </Button>
              </div>
            </div>

            {/* Summary */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  Open {openDaysCount} day{openDaysCount !== 1 ? 's' : ''} per week
                </span>
                <span className="font-medium text-gray-900">
                  Total: {calculateTotalHours()} per week
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hours.map((day, index) => {
              const dayError = dayErrors[index]
              return (
                <div
                  key={day.dayOfWeek}
                  className={cn(
                    'p-4 rounded-lg border-2 transition-colors',
                    day.isClosed
                      ? 'bg-gray-50 border-gray-200'
                      : dayError
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200'
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={!day.isClosed}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateDay(index, { isClosed: !e.target.checked })
                        }
                        label={DAYS_OF_WEEK[day.dayOfWeek]}
                      />
                    </div>
                    {!day.isClosed && (
                      <button
                        type="button"
                        onClick={() => copyToAllDays(index)}
                        className="text-sm text-onprez-blue hover:underline flex items-center gap-1"
                      >
                        <Copy className="w-4 h-4" />
                        Copy to all
                      </button>
                    )}
                  </div>

                  {!day.isClosed && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <TimePicker
                          label="Opening Time"
                          value={day.openTime}
                          onChange={time => updateDay(index, { openTime: time })}
                          error={dayError ? ' ' : undefined}
                        />
                        <TimePicker
                          label="Closing Time"
                          value={day.closeTime}
                          onChange={time => updateDay(index, { closeTime: time })}
                          error={dayError ? ' ' : undefined}
                        />
                      </div>
                      {dayError && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                          <AlertCircle className="w-4 h-4" />
                          {dayError}
                        </div>
                      )}
                    </>
                  )}

                  {day.isClosed && <p className="text-sm text-gray-500 mt-2">Closed</p>}
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="ghost" onClick={fetchBusinessHours} disabled={saving}>
            Reset
          </Button>
          <Button type="submit" variant="primary" disabled={saving || hasErrors}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
