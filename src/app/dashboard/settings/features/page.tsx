'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { FormError, Input, TextArea } from '@/components/form'
import { Save, Loader2, HelpCircle, Mail, MessageSquare } from 'lucide-react'

interface FeatureSettings {
  faqEnabled: boolean
  inquiryEnabled: boolean
  inquiryNotificationEmail: string
  inquiryAutoReply: string
  bookingNotifications: boolean
  emailReminders: boolean
}

export default function FeatureSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [features, setFeatures] = useState<FeatureSettings>({
    faqEnabled: true,
    inquiryEnabled: true,
    inquiryNotificationEmail: '',
    inquiryAutoReply: '',
    bookingNotifications: true,
    emailReminders: true,
  })

  useEffect(() => {
    fetchFeatureSettings()
  }, [])

  async function fetchFeatureSettings() {
    try {
      const response = await fetch('/api/business/features')
      const data = await response.json()

      if (data.success) {
        setFeatures(data.data.features)
      } else {
        setError('Failed to load feature settings')
      }
    } catch (err) {
      setError('Failed to load feature settings')
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
      const response = await fetch('/api/business/features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(features),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(data.error || 'Failed to save settings')
      }
    } catch (err) {
      setError('Failed to save settings')
    } finally {
      setSaving(false)
    }
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
        <h1 className="text-3xl font-bold text-gray-900">Feature Settings</h1>
        <p className="text-gray-600 mt-2">Configure optional features for your business</p>
      </div>

      {error && <FormError errors={error} dismissible onDismiss={() => setError('')} />}

      {success && (
        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl text-green-700">
          ✓ Feature settings saved successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-onprez-blue" />
              <CardTitle>FAQ Section</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Toggle
              checked={features.faqEnabled}
              onChange={checked => setFeatures({ ...features, faqEnabled: checked })}
              label="Enable FAQ Section"
              description="Display frequently asked questions on your presence page"
            />

            {features.faqEnabled && (
              <div className="ml-16 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> Add and manage your FAQs in the Presence Editor
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inquiry System */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-onprez-blue" />
              <CardTitle>Inquiry System</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Toggle
              checked={features.inquiryEnabled}
              onChange={checked => setFeatures({ ...features, inquiryEnabled: checked })}
              label="Enable Inquiry Form"
              description="Allow visitors to send inquiries from your presence page"
            />

            {features.inquiryEnabled && (
              <div className="space-y-4 ml-0">
                <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                  <Input
                    label="Notification Email"
                    type="email"
                    value={features.inquiryNotificationEmail || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFeatures({ ...features, inquiryNotificationEmail: e.target.value })
                    }
                    placeholder="inquiries@yourbusiness.com"
                    helperText="Where should inquiry notifications be sent? (defaults to business email)"
                    leftIcon={<Mail className="w-5 h-5" />}
                  />

                  <TextArea
                    label="Auto-Reply Message (Optional)"
                    value={features.inquiryAutoReply || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFeatures({ ...features, inquiryAutoReply: e.target.value })
                    }
                    placeholder="Thank you for your inquiry! We'll get back to you within 24 hours."
                    helperText="Automatically sent to customers when they submit an inquiry"
                    rows={3}
                    maxLength={500}
                    showCharCount
                  />
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Inquiries will appear in your Inquiries dashboard where
                    you can manage and respond to them.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booking Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Toggle
              checked={features.bookingNotifications}
              onChange={checked => setFeatures({ ...features, bookingNotifications: checked })}
              label="Booking Notifications"
              description="Receive email notifications for new bookings"
            />

            <Toggle
              checked={features.emailReminders}
              onChange={checked => setFeatures({ ...features, emailReminders: checked })}
              label="Customer Email Reminders"
              description="Send automatic email reminders to customers before appointments"
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="ghost" onClick={fetchFeatureSettings} disabled={saving}>
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
