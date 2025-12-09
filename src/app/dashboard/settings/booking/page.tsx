'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { FormError } from '@/components/form'
import { Select } from '@/components/form'
import {
  Clock,
  Calendar,
  Shield,
  RefreshCw,
  Save,
  Loader2,
  Info,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface BookingSettings {
  bufferTime: number
  slotInterval: number
  advanceBookingDays: number
  sameDayBooking: boolean
  sameDayLeadTime: number
  requireApproval: boolean
  autoConfirm: boolean
  cancellationDeadline: number
  allowRescheduling: boolean
  rescheduleDeadline: number
}

const BUFFER_TIME_OPTIONS = [
  { value: '0', label: 'No buffer' },
  { value: '5', label: '5 minutes' },
  { value: '10', label: '10 minutes' },
  { value: '15', label: '15 minutes' },
  { value: '20', label: '20 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hours' },
  { value: '120', label: '2 hours' },
]

const SLOT_INTERVAL_OPTIONS = [
  { value: '5', label: '5 minutes' },
  { value: '10', label: '10 minutes' },
  { value: '15', label: '15 minutes' },
  { value: '20', label: '20 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '1 hour' },
]

const ADVANCE_BOOKING_OPTIONS = [
  { value: '1', label: '1 day' },
  { value: '7', label: '1 week' },
  { value: '14', label: '2 weeks' },
  { value: '30', label: '1 month' },
  { value: '60', label: '2 months' },
  { value: '90', label: '3 months' },
  { value: '180', label: '6 months' },
  { value: '365', label: '1 year' },
]

const LEAD_TIME_OPTIONS = [
  { value: '0', label: 'No minimum' },
  { value: '30', label: '30 minutes' },
  { value: '60', label: '1 hour' },
  { value: '120', label: '2 hours' },
  { value: '180', label: '3 hours' },
  { value: '240', label: '4 hours' },
  { value: '480', label: '8 hours' },
]

const DEADLINE_OPTIONS = [
  { value: '0', label: 'Anytime' },
  { value: '1', label: '1 hour before' },
  { value: '2', label: '2 hours before' },
  { value: '4', label: '4 hours before' },
  { value: '12', label: '12 hours before' },
  { value: '24', label: '24 hours before' },
  { value: '48', label: '48 hours before' },
  { value: '72', label: '3 days before' },
  { value: '168', label: '1 week before' },
]

const DEFAULT_SETTINGS: BookingSettings = {
  bufferTime: 0,
  slotInterval: 15,
  advanceBookingDays: 30,
  sameDayBooking: true,
  sameDayLeadTime: 60,
  requireApproval: false,
  autoConfirm: true,
  cancellationDeadline: 24,
  allowRescheduling: true,
  rescheduleDeadline: 24,
}

export default function BookingSettingsPage() {
  const [settings, setSettings] = useState<BookingSettings>(DEFAULT_SETTINGS)
  const [originalSettings, setOriginalSettings] = useState<BookingSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      setLoading(true)
      const response = await fetch('/api/business/settings/booking')
      const data = await response.json()

      if (data.success) {
        setSettings(data.data.settings)
        setOriginalSettings(data.data.settings)
      } else {
        setError(data.error || 'Failed to load settings')
      }
    } catch (err) {
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/business/settings/booking', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      const data = await response.json()

      if (data.success) {
        setOriginalSettings(settings)
        setSuccess('Booking settings saved successfully')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to save settings')
      }
    } catch (err) {
      setError('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setSettings(originalSettings)
    setError('')
    setSuccess('')
  }

  function updateSetting<K extends keyof BookingSettings>(key: K, value: BookingSettings[K]) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Booking Settings</h1>
            <p className="text-gray-600 mt-1">Configure how customers book appointments</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-8 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Booking Settings</h1>
          <p className="text-gray-600 mt-1">Configure how customers book appointments</p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <Button variant="ghost" onClick={handleReset}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          )}
          <Button variant="primary" onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Status Messages */}
      {error && <FormError errors={error} dismissible onDismiss={() => setError('')} />}

      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      {/* Buffer & Interval Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Time Slot Configuration
          </CardTitle>
          <CardDescription>Control how time slots are generated and spaced</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Buffer Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buffer Time Between Appointments
              </label>
              <Select
                value={settings.bufferTime.toString()}
                onChange={e => updateSetting('bufferTime', parseInt(e.target.value))}
                options={BUFFER_TIME_OPTIONS}
              />
              <p className="mt-2 text-sm text-gray-500">
                Extra time added between appointments for preparation or cleanup
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Slot Interval</label>
              <Select
                value={settings.slotInterval.toString()}
                onChange={e => updateSetting('slotInterval', parseInt(e.target.value))}
                options={SLOT_INTERVAL_OPTIONS}
              />
              <p className="mt-2 text-sm text-gray-500">
                How often booking slots start (e.g., every 15 minutes)
              </p>
            </div>
          </div>

          {/* Visual Example */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Example Schedule</p>
                <p className="text-sm text-blue-700 mt-1">
                  With a {settings.slotInterval}-minute interval and {settings.bufferTime}-minute
                  buffer:
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {generateExampleSlots(settings.slotInterval, settings.bufferTime).map(
                    (slot, i) => (
                      <span
                        key={i}
                        className={cn(
                          'px-2 py-1 text-xs rounded',
                          slot.type === 'slot'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-700'
                        )}
                      >
                        {slot.time} {slot.type === 'buffer' && '(buffer)'}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advance Booking Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Booking Window
          </CardTitle>
          <CardDescription>Control when customers can book appointments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Advance Booking */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Advance Booking
              </label>
              <Select
                value={settings.advanceBookingDays.toString()}
                onChange={e => updateSetting('advanceBookingDays', parseInt(e.target.value))}
                options={ADVANCE_BOOKING_OPTIONS}
              />
              <p className="mt-2 text-sm text-gray-500">How far in advance customers can book</p>
            </div>

            {/* Same Day Lead Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Same-Day Minimum Notice
              </label>
              <Select
                value={settings.sameDayLeadTime.toString()}
                onChange={e => updateSetting('sameDayLeadTime', parseInt(e.target.value))}
                options={LEAD_TIME_OPTIONS}
                disabled={!settings.sameDayBooking}
              />
              <p className="mt-2 text-sm text-gray-500">
                Minimum notice required for same-day bookings
              </p>
            </div>
          </div>

          {/* Same Day Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Allow Same-Day Booking</p>
              <p className="text-sm text-gray-500">Let customers book appointments for today</p>
            </div>
            <Toggle
              checked={settings.sameDayBooking}
              onChange={checked => updateSetting('sameDayBooking', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Confirmation & Approval */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Confirmation & Approval
          </CardTitle>
          <CardDescription>Control how bookings are confirmed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Require Approval */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Require Manual Approval</p>
              <p className="text-sm text-gray-500">
                Bookings need your confirmation before being confirmed
              </p>
            </div>
            <Toggle
              checked={settings.requireApproval}
              onChange={checked => {
                updateSetting('requireApproval', checked)
                if (checked) updateSetting('autoConfirm', false)
              }}
            />
          </div>

          {/* Auto Confirm */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Auto-Confirm Bookings</p>
              <p className="text-sm text-gray-500">
                Automatically confirm bookings without manual review
              </p>
            </div>
            <Toggle
              checked={settings.autoConfirm}
              onChange={checked => {
                updateSetting('autoConfirm', checked)
                if (checked) updateSetting('requireApproval', false)
              }}
            />
          </div>

          {settings.requireApproval && (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">Manual Approval Enabled</p>
                <p className="text-sm text-yellow-700">
                  All new bookings will be in &quot;Pending&quot; status until you confirm them.
                  Make sure to check your bookings regularly.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancellation & Rescheduling */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Cancellation & Rescheduling
          </CardTitle>
          <CardDescription>Control customer cancellation and rescheduling options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cancellation Deadline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cancellation Deadline
              </label>
              <Select
                value={settings.cancellationDeadline.toString()}
                onChange={e => updateSetting('cancellationDeadline', parseInt(e.target.value))}
                options={DEADLINE_OPTIONS}
              />
              <p className="mt-2 text-sm text-gray-500">
                How late customers can cancel without penalty
              </p>
            </div>

            {/* Reschedule Deadline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rescheduling Deadline
              </label>
              <Select
                value={settings.rescheduleDeadline.toString()}
                onChange={e => updateSetting('rescheduleDeadline', parseInt(e.target.value))}
                options={DEADLINE_OPTIONS}
                disabled={!settings.allowRescheduling}
              />
              <p className="mt-2 text-sm text-gray-500">
                How late customers can reschedule their appointment
              </p>
            </div>
          </div>

          {/* Allow Rescheduling Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Allow Customer Rescheduling</p>
              <p className="text-sm text-gray-500">
                Let customers reschedule their own appointments
              </p>
            </div>
            <Toggle
              checked={settings.allowRescheduling}
              onChange={checked => updateSetting('allowRescheduling', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="bg-gray-50">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Current Configuration Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Buffer Time</p>
              <p className="font-medium">{settings.bufferTime} min</p>
            </div>
            <div>
              <p className="text-gray-500">Slot Interval</p>
              <p className="font-medium">{settings.slotInterval} min</p>
            </div>
            <div>
              <p className="text-gray-500">Advance Booking</p>
              <p className="font-medium">{settings.advanceBookingDays} days</p>
            </div>
            <div>
              <p className="text-gray-500">Same-Day</p>
              <p className="font-medium">
                {settings.sameDayBooking ? `Yes (${settings.sameDayLeadTime}min notice)` : 'No'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Confirmation</p>
              <p className="font-medium">
                {settings.requireApproval ? 'Manual' : settings.autoConfirm ? 'Auto' : 'Manual'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Cancellation</p>
              <p className="font-medium">{settings.cancellationDeadline}h before</p>
            </div>
            <div>
              <p className="text-gray-500">Rescheduling</p>
              <p className="font-medium">
                {settings.allowRescheduling ? `${settings.rescheduleDeadline}h before` : 'Disabled'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper function to generate example slots
function generateExampleSlots(
  interval: number,
  buffer: number
): { time: string; type: 'slot' | 'buffer' }[] {
  const slots: { time: string; type: 'slot' | 'buffer' }[] = []
  let time = 9 * 60 // Start at 9:00 AM

  for (let i = 0; i < 4; i++) {
    // Add booking slot
    const hours = Math.floor(time / 60)
    const mins = time % 60
    slots.push({
      time: `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`,
      type: 'slot',
    })

    // Add buffer if applicable
    if (buffer > 0 && i < 3) {
      time += interval
      const bufferHours = Math.floor(time / 60)
      const bufferMins = time % 60
      slots.push({
        time: `${bufferHours.toString().padStart(2, '0')}:${bufferMins.toString().padStart(2, '0')}`,
        type: 'buffer',
      })
      time += buffer
    } else {
      time += interval
    }
  }

  return slots.slice(0, 6)
}
