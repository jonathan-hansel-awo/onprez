'use client'

import { useState } from 'react'
import { Input } from '@/components/form/input'
import { TextArea } from '@/components/form/text-area'
import { Select } from '@/components/form/select'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/form/label'
import { CheckCircle, AlertCircle, Mail, Phone, User, MessageSquare } from 'lucide-react'

interface InquiryFormProps {
  businessId: string
  businessName: string
  className?: string
}

export function InquiryForm({ businessId, businessName, className }: InquiryFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    preferredContact: 'email',
  })

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateField(field: keyof typeof formData, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/public/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          subject: formData.subject,
          message: formData.message,
          preferredContact: formData.preferredContact,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSubmitted(true)
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
          preferredContact: 'email',
        })
      } else {
        setError(data.error || 'Failed to send inquiry. Please try again.')
      }
    } catch (err) {
      setError('Something went wrong. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Card className={`p-8 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Inquiry Sent!</h3>
          <p className="text-gray-600 mb-6">
            Thank you for reaching out. We&apos;ll get back to you as soon as possible.
          </p>
          <Button variant="ghost" onClick={() => setSubmitted(false)}>
            Send Another Inquiry
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`p-6 md:p-8 ${className}`}>
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Get in Touch</h3>
        <p className="text-gray-600">
          Have a question? Send us a message and we&apos;ll respond promptly.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Name */}
        <div>
          <Label htmlFor="inquiry-name">Your Name *</Label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              id="inquiry-name"
              type="text"
              value={formData.name}
              onChange={e => updateField('name', e.target.value)}
              placeholder="John Doe"
              required
              className="pl-10"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="inquiry-email">Email Address *</Label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              id="inquiry-email"
              type="email"
              value={formData.email}
              onChange={e => updateField('email', e.target.value)}
              placeholder="john@example.com"
              required
              className="pl-10"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <Label htmlFor="inquiry-phone">Phone Number</Label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              id="inquiry-phone"
              type="tel"
              value={formData.phone}
              onChange={e => updateField('phone', e.target.value)}
              placeholder="+44 20 1234 5678"
              className="pl-10"
            />
          </div>
        </div>

        {/* Preferred Contact Method */}
        <div>
          <Label htmlFor="inquiry-preferred-contact">Preferred Contact Method</Label>
          <Select
            id="inquiry-preferred-contact"
            value={formData.preferredContact}
            onChange={e => updateField('preferredContact', e.target.value)}
            className="mt-1"
            options={[
              { value: 'email', label: 'Email' },
              { value: 'phone', label: 'Phone' },
              { value: 'either', label: 'Either' },
            ]}
          />
        </div>

        {/* Subject */}
        <div>
          <Label htmlFor="inquiry-subject">Subject *</Label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MessageSquare className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              id="inquiry-subject"
              type="text"
              value={formData.subject}
              onChange={e => updateField('subject', e.target.value)}
              placeholder="What can we help you with?"
              required
              className="pl-10"
            />
          </div>
        </div>

        {/* Message */}
        <div>
          <Label htmlFor="inquiry-message">Message *</Label>
          <TextArea
            id="inquiry-message"
            value={formData.message}
            onChange={e => updateField('message', e.target.value)}
            placeholder="Tell us more about your inquiry..."
            rows={5}
            required
            className="mt-1"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <div className="flex flex-row items-center justify-center">
                <Mail className="w-5 h-5 mr-2" />
                Send Inquiry
              </div>
            )}
          </Button>
        </div>

        {/* Privacy Notice */}
        <p className="text-xs text-gray-500 text-center">
          By submitting this form, you agree to be contacted by {businessName} regarding your
          inquiry.
        </p>
      </form>
    </Card>
  )
}
