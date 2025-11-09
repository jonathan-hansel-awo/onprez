'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TimePicker } from '@/components/ui/time-picker'
import { Checkbox, FormError } from '@/components/form'
import { Badge } from '@/components/ui/badge'
import { Save, Loader2, Copy, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface BusinessHour {
  dayOfWeek: number
  openTime: string
  closeTime: string
  isClosed: boolean
  notes: string
}

export default function BusinessHoursPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [timezone, setTimezone] = useState('')

  const [hours, setHours] = useState<BusinessHour[]>(
    Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      openTime: '09:00',
      closeTime: '17:00',
      isClosed: i === 0 || i === 6, // Closed on weekends by default
      notes: '',
    }))
  )

  useEffect(() => {
    fetchBusinessHours()
  }, [])

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
        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hours.map((day, index) => (
              <div
                key={day.dayOfWeek}
                className={cn(
                  'p-4 rounded-lg border-2 transition-colors',
                  day.isClosed ? 'bg-gray-50 border-gray-200' : 'border-gray-200'
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
                  <div className="grid grid-cols-2 gap-4">
                    <TimePicker
                      label="Opening Time"
                      value={day.openTime}
                      onChange={time => updateDay(index, { openTime: time })}
                    />
                    <TimePicker
                      label="Closing Time"
                      value={day.closeTime}
                      onChange={time => updateDay(index, { closeTime: time })}
                    />
                  </div>
                )}

                {day.isClosed && <p className="text-sm text-gray-500 mt-2">Closed</p>}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="ghost" onClick={fetchBusinessHours} disabled={saving}>
            Reset
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
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
