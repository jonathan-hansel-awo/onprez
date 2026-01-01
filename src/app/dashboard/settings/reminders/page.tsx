'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, Mail, Save, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ReminderSettings {
  enabled: boolean
  emailEnabled: boolean
  defaultMessage: string
}

export default function ReminderSettingsPage() {
  const [settings, setSettings] = useState<ReminderSettings>({
    enabled: true,
    emailEnabled: true,
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
        setSettings({
          enabled: result.data.enabled ?? true,
          emailEnabled: result.data.emailEnabled ?? true,
          defaultMessage: result.data.defaultMessage ?? '',
        })
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
        <p className="text-gray-600 mt-2">
          Configure reminder emails for your customers
        </p>
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
                Allow sending manual reminders to customers
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
            {/* Email Toggle */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Email Reminders</p>
                    <p className="text-sm text-gray-500">Send reminders via email</p>
                  </div>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, emailEnabled: !settings.emailEnabled })}
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
            </div>

            {/* How to Send Reminders */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
              <h3 className="font-semibold text-blue-900 mb-2">How to send reminders</h3>
              <p className="text-sm text-blue-800">
                Open any booking from your calendar or bookings list, then click the 
                <span className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 bg-blue-100 rounded text-blue-700 font-medium">
                  <Bell className="w-3 h-3" /> Send Reminder
                </span>
                button to send a reminder email to the customer.
              </p>
            </div>

            {/* Custom Message */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Custom Message
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Add a personal note to include in reminder emails (optional)
              </p>
              <textarea
                value={settings.defaultMessage}
                onChange={(e) => setSettings({ ...settings, defaultMessage: e.target.value })}
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
