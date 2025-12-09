'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/form'
import { Calendar, Plus, Trash2, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MultiDayBookingFormProps {
  businessId: string
  services: Array<{
    id: string
    name: string
    duration: number
    price: string
  }>
  onSuccess?: (appointments: Array<{ id: string; date: string }>) => void
  onCancel?: () => void
}

type PatternType = 'consecutive' | 'weekly' | 'custom'

const WEEKDAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

export function MultiDayBookingForm({
  businessId,
  services,
  onSuccess,
  onCancel,
}: MultiDayBookingFormProps) {
  const [formData, setFormData] = useState({
    serviceId: services[0]?.id || '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    startDate: '',
    startTime: '09:00',
    patternType: 'consecutive' as PatternType,
    consecutiveDays: 2,
    weeklyDays: [] as number[],
    weekCount: 1,
    customDates: [] as string[],
    customerNotes: '',
  })

  const [preview, setPreview] = useState<{
    dates: string[]
    slots: Array<{ date: string; startTime: string; endTime: string }>
    availability?: {
      available: boolean
      conflicts: Array<{ date: string; reason: string }>
    }
  } | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [error, setError] = useState('')

  // Fetch preview when pattern changes
  useEffect(() => {
    if (formData.startDate && formData.serviceId) {
      fetchPreview()
    }
  }, [
    formData.startDate,
    formData.startTime,
    formData.serviceId,
    formData.patternType,
    formData.consecutiveDays,
    formData.weeklyDays,
    formData.weekCount,
    formData.customDates,
  ])

  async function fetchPreview() {
    if (!formData.startDate) return

    setIsPreviewing(true)
    try {
      const params = new URLSearchParams({
        businessId,
        serviceId: formData.serviceId,
        startDate: formData.startDate,
        startTime: formData.startTime,
        patternType: formData.patternType,
        checkAvailability: 'true',
      })

      if (formData.patternType === 'consecutive') {
        params.set('consecutiveDays', formData.consecutiveDays.toString())
      } else if (formData.patternType === 'weekly') {
        params.set('weeklyDays', formData.weeklyDays.join(','))
        params.set('weekCount', formData.weekCount.toString())
      } else if (formData.patternType === 'custom') {
        params.set('customDates', formData.customDates.join(','))
      }

      const response = await fetch(`/api/appointments/multi-day?${params}`)
      const result = await response.json()

      if (result.success) {
        setPreview(result.data)
      }
    } catch (err) {
      console.error('Preview error:', err)
    } finally {
      setIsPreviewing(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/appointments/multi-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          serviceId: formData.serviceId,
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          customerPhone: formData.customerPhone || undefined,
          startDate: formData.startDate,
          startTime: formData.startTime,
          pattern: {
            type: formData.patternType,
            consecutiveDays:
              formData.patternType === 'consecutive' ? formData.consecutiveDays : undefined,
            weeklyDays: formData.patternType === 'weekly' ? formData.weeklyDays : undefined,
            weekCount: formData.patternType === 'weekly' ? formData.weekCount : undefined,
            customDates: formData.patternType === 'custom' ? formData.customDates : undefined,
          },
          customerNotes: formData.customerNotes || undefined,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Failed to create appointments')
        return
      }

      onSuccess?.(result.data.appointments)
    } catch (error) {
      setError(`An error occurred. Please try again. ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  function toggleWeekday(day: number) {
    setFormData(prev => ({
      ...prev,
      weeklyDays: prev.weeklyDays.includes(day)
        ? prev.weeklyDays.filter(d => d !== day)
        : [...prev.weeklyDays, day].sort((a, b) => a - b),
    }))
  }

  function addCustomDate(date: string) {
    if (date && !formData.customDates.includes(date)) {
      setFormData(prev => ({
        ...prev,
        customDates: [...prev.customDates, date].sort(),
      }))
    }
  }

  function removeCustomDate(date: string) {
    setFormData(prev => ({
      ...prev,
      customDates: prev.customDates.filter(d => d !== date),
    }))
  }

  const selectedService = services.find(s => s.id === formData.serviceId)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Service Selection */}
      <div>
        <Select
          label="Service"
          value={formData.serviceId}
          onChange={e => setFormData(prev => ({ ...prev, serviceId: e.target.value }))}
          options={services.map(s => ({
            value: s.id,
            label: `${s.name} (${s.duration} min - £${s.price})`,
          }))}
        />
      </div>

      {/* Customer Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Customer Name"
          value={formData.customerName}
          onChange={e => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
          required
        />
        <Input
          label="Customer Email"
          type="email"
          value={formData.customerEmail}
          onChange={e => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
          required
        />
        <Input
          label="Phone (optional)"
          type="tel"
          value={formData.customerPhone}
          onChange={e => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
        />
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Start Date"
          type="date"
          value={formData.startDate}
          onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
          min={new Date().toISOString().split('T')[0]}
          required
        />
        <Input
          label="Start Time"
          type="time"
          value={formData.startTime}
          onChange={e => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
          required
        />
      </div>

      {/* Pattern Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Booking Pattern</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'consecutive', label: 'Consecutive Days' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'custom', label: 'Custom Dates' },
          ].map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                setFormData(prev => ({ ...prev, patternType: option.value as PatternType }))
              }
              className={cn(
                'p-3 border rounded-lg text-sm font-medium transition-colors',
                formData.patternType === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pattern Configuration */}
      {formData.patternType === 'consecutive' && (
        <div>
          <Select
            label="Number of Days"
            value={formData.consecutiveDays.toString()}
            onChange={e =>
              setFormData(prev => ({ ...prev, consecutiveDays: parseInt(e.target.value) }))
            }
            options={Array.from({ length: 13 }, (_, i) => ({
              value: (i + 2).toString(),
              label: `${i + 2} days`,
            }))}
          />
        </div>
      )}

      {formData.patternType === 'weekly' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Days of Week</label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map(day => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleWeekday(day.value)}
                  className={cn(
                    'px-3 py-1.5 border rounded-lg text-sm transition-colors',
                    formData.weeklyDays.includes(day.value)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  {day.label.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
          <Select
            label="Number of Weeks"
            value={formData.weekCount.toString()}
            onChange={e => setFormData(prev => ({ ...prev, weekCount: parseInt(e.target.value) }))}
            options={Array.from({ length: 12 }, (_, i) => ({
              value: (i + 1).toString(),
              label: `${i + 1} week${i > 0 ? 's' : ''}`,
            }))}
          />
        </div>
      )}

      {formData.patternType === 'custom' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              onChange={e => {
                if (e.target.value) {
                  addCustomDate(e.target.value)
                  e.target.value = ''
                }
              }}
              placeholder="Add date"
            />
          </div>
          {formData.customDates.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.customDates.map(date => (
                <div
                  key={date}
                  className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-lg text-sm"
                >
                  <Calendar className="w-3 h-3" />
                  {new Date(date).toLocaleDateString('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                  <button
                    type="button"
                    onClick={() => removeCustomDate(date)}
                    className="ml-1 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
        <textarea
          value={formData.customerNotes}
          onChange={e => setFormData(prev => ({ ...prev, customerNotes: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Any special requirements..."
        />
      </div>

      {/* Preview */}
      {preview && (
        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Preview: {preview.slots.length} sessions</h4>
            {isPreviewing && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {preview.slots.map((slot, i) => {
              const conflict = preview.availability?.conflicts.find(c => c.date === slot.date)
              return (
                <div
                  key={i}
                  className={cn(
                    'p-2 rounded border text-sm',
                    conflict ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
                  )}
                >
                  <div className="flex items-center gap-1">
                    {conflict ? (
                      <AlertCircle className="w-3 h-3 text-red-500" />
                    ) : (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    )}
                    <span className="font-medium">
                      {new Date(slot.date).toLocaleDateString('en-GB', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                  <div className="text-gray-600">
                    {slot.startTime} - {slot.endTime}
                  </div>
                  {conflict && <div className="text-xs text-red-600 mt-1">{conflict.reason}</div>}
                </div>
              )
            })}
          </div>

          {selectedService && (
            <div className="pt-3 border-t border-gray-200 text-sm text-gray-600">
              Total: {preview.slots.length} × £{selectedService.price} = £
              {(parseFloat(selectedService.price) * preview.slots.length).toFixed(2)}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={
            isLoading || !preview || (preview.availability && !preview.availability.available)
          }
          className="flex-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Create {preview?.slots.length || 0} Appointments
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
