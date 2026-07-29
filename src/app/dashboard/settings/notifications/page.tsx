'use client'

import { useEffect, useState } from 'react'
import {
  BellRing,
  CalendarCheck,
  Clock3,
  Loader2,
  LockKeyhole,
  MailCheck,
  Megaphone,
  MessageSquare,
  Save,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Toggle } from '@/components/ui/toggle'
import { FormError } from '@/components/form'

interface NotificationPreferences {
  bookingOwnerEmail: boolean
  inquiryOwnerEmail: boolean
  customerReminders: boolean
  customerInquiryAcknowledgements: boolean
  customerBookingUpdates: true
  marketingEmails: boolean
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  bookingOwnerEmail: true,
  inquiryOwnerEmail: true,
  customerReminders: true,
  customerInquiryAcknowledgements: true,
  customerBookingUpdates: true,
  marketingEmails: false,
}

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function fetchPreferences() {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/business/notifications')
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load notification preferences')
      }

      setPreferences(data.data.preferences)
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : 'Failed to load notification preferences'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchPreferences()
  }, [])

  function updatePreference(
    key: Exclude<keyof NotificationPreferences, 'customerBookingUpdates'>,
    checked: boolean
  ) {
    setPreferences(current => ({ ...current, [key]: checked }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/business/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingOwnerEmail: preferences.bookingOwnerEmail,
          inquiryOwnerEmail: preferences.inquiryOwnerEmail,
          customerReminders: preferences.customerReminders,
          customerInquiryAcknowledgements: preferences.customerInquiryAcknowledgements,
          marketingEmails: preferences.marketingEmails,
        }),
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save notification preferences')
      }

      setPreferences(data.data.preferences)
      setSuccess(true)
      window.setTimeout(() => setSuccess(false), 3000)
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Failed to save notification preferences'
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-onprez-blue" aria-label="Loading" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Notification Preferences</h1>
        <p className="mt-2 text-gray-600">
          Choose which operational alerts you receive and which optional messages OnPrez may send.
        </p>
      </div>

      {error && <FormError errors={error} dismissible onDismiss={() => setError('')} />}

      {success && (
        <div
          role="status"
          className="rounded-xl border-2 border-green-200 bg-green-50 p-4 text-green-700"
        >
          Notification preferences saved successfully.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BellRing className="h-5 w-5 text-onprez-blue" />
              <CardTitle>Business alerts</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Toggle
              checked={preferences.bookingOwnerEmail}
              onChange={checked => updatePreference('bookingOwnerEmail', checked)}
              label="New booking emails"
              description="Email the business when a customer creates a booking or booking request."
            />
            <Toggle
              checked={preferences.inquiryOwnerEmail}
              onChange={checked => updatePreference('inquiryOwnerEmail', checked)}
              label="New inquiry emails"
              description="Email the business when a visitor sends an inquiry from the public presence page."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MailCheck className="h-5 w-5 text-onprez-blue" />
              <CardTitle>Customer service messages</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <Clock3 className="h-5 w-5 text-gray-600" />
                  <h3 className="font-medium text-gray-900">Appointment reminders</h3>
                </div>
                <Toggle
                  checked={preferences.customerReminders}
                  onChange={checked => updatePreference('customerReminders', checked)}
                  label="Automatic reminder emails"
                  description="Send scheduled appointment reminders. A reminder sent manually from the dashboard is unaffected."
                />
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-gray-600" />
                  <h3 className="font-medium text-gray-900">Inquiry acknowledgements</h3>
                </div>
                <Toggle
                  checked={preferences.customerInquiryAcknowledgements}
                  onChange={checked => updatePreference('customerInquiryAcknowledgements', checked)}
                  label="Acknowledge new inquiries"
                  description="Send a service acknowledgement after a visitor submits an inquiry."
                />
              </div>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
                <div>
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4 text-blue-700" />
                    <h3 className="font-semibold text-blue-950">
                      Booking confirmations and status updates stay on
                    </h3>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-blue-800">
                    Customers must receive confirmations, approval decisions, cancellations and
                    reschedule notices for bookings they requested. These are transactional service
                    messages, not marketing emails.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-onprez-blue" />
              <CardTitle>Marketing</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Toggle
              checked={preferences.marketingEmails}
              onChange={checked => updatePreference('marketingEmails', checked)}
              label="Marketing emails"
              description="Keep promotional messages separate from booking, security and customer-service emails. Enabling this preference never replaces the need for each recipient's consent."
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="ghost" onClick={fetchPreferences} disabled={saving}>
            Reset
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save preferences
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
