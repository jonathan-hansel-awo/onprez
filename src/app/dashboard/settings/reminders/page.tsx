'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, Mail, MessageSquare, Save, Loader2, Plus, X, Clock } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ReminderSettings {
  enabled: boolean
  emailEnabled: boolean
  smsEnabled: boolean
  reminderTimes: number[]
  defaultMessage: string
}

const PRESET_TIMES = [
  { value: 1, label: '1 hour before' },
  { value: 2, label: '2 hours before' },
  { value: 4, label: '4 hours before' },
  { value: 12, label: '12 hours before' },
  { value: 24, label: '1 day before' },
  { value: 48, label: '2 days before' },
  { value: 72, label: '3 days before' },
  { value: 168, label: '1 week before' },
]

export default function ReminderSettingsPage() {
  const [settings, setSettings] = useState<ReminderSettings>({
    enabled: true,
    emailEnabled: true,
    smsEnabled: false,
    reminderTimes: [24, 2],
    defaultMessage: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/dashboard/settings/reminders')
      const result = await response.json()

      if (result.success) {
        setSettings(result.data)
      }
    } catch (err) {
      setError('Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/dashboard/settings/reminders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save settings')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const addReminderTime = (hours: number) => {
    if (!settings.reminderTimes.includes(hours)) {
      setSettings({
        ...settings,
        reminderTimes: [...settings.reminderTimes, hours].sort((a, b) => b - a),
      })
    }
  }

  const removeReminderTime = (hours: number) => {
    setSettings({
      ...settings,
      reminderTimes: settings.reminderTimes.filter(t => t !== hours),
    })
  }

  const formatTime = (hours: number): string => {
    if (hours >= 24) {
      const days = Math.round(hours / 24)
      return `${days} day${days > 1 ? 's' : ''} before`
    }
    return `${hours} hour${hours > 1 ? 's' : ''} before`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Bell className="w-7 h-7 text-blue-500" />
          Reminder Settings
        </h1>
        <p className="text-gray-600 mt-2">Configure automated reminders for your customers</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700">Settings saved successfully!</p>
        </div>
      )}

      <div className="space-y-8">
        {/* Enable Reminders */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Enable Reminders</h2>
              <p className="text-sm text-gray-600 mt-1">
                Automatically send reminders to customers before their appointments
              </p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                settings.enabled ? 'bg-blue-600' : 'bg-gray-200'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  settings.enabled ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        </div>

        {settings.enabled && (
          <>
            {/* Notification Channels */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Channels</h2>

              <div className="space-y-4">
                {/* Email */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">Email</p>
                      <p className="text-sm text-gray-500">Send reminders via email</p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setSettings({ ...settings, emailEnabled: !settings.emailEnabled })
                    }
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      settings.emailEnabled ? 'bg-blue-600' : 'bg-gray-200'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        settings.emailEnabled ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                {/* SMS - Coming Soon */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg opacity-60">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        SMS
                        <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                          Coming Soon
                        </span>
                      </p>
                      <p className="text-sm text-gray-500">Send reminders via SMS</p>
                    </div>
                  </div>
                  <button
                    disabled
                    className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 cursor-not-allowed"
                  >
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
                  </button>
                </div>
              </div>
            </div>

            {/* Reminder Times */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Reminder Times</h2>
              <p className="text-sm text-gray-600 mb-4">
                Choose when to send reminders before appointments
              </p>

              {/* Selected Times */}
              <div className="flex flex-wrap gap-2 mb-4">
                {settings.reminderTimes.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No reminders scheduled</p>
                ) : (
                  settings.reminderTimes.map(hours => (
                    <div
                      key={hours}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {formatTime(hours)}
                      <button
                        onClick={() => removeReminderTime(hours)}
                        className="hover:text-blue-900"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add Time Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add reminder time
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_TIMES.filter(t => !settings.reminderTimes.includes(t.value)).map(time => (
                    <button
                      key={time.value}
                      onClick={() => addReminderTime(time.value)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {time.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Custom Message */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Custom Message</h2>
              <p className="text-sm text-gray-600 mb-4">
                Add a personal note to include in reminder emails (optional)
              </p>
              <textarea
                value={settings.defaultMessage}
                onChange={e => setSettings({ ...settings, defaultMessage: e.target.value })}
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors resize-none"
                placeholder="e.g., Please arrive 10 minutes early. If you need to cancel, please let us know at least 24 hours in advance."
              />
              <p className="text-xs text-gray-500 mt-1 text-right">
                {settings.defaultMessage.length}/500
              </p>
            </div>
          </>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
