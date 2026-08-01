/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Save, Loader2, ExternalLink, Globe, MapPin, Mail, Phone } from 'lucide-react'
import { BUSINESS_CATEGORY_LABELS, getTimezonesByRegion } from '@/types/business'
import { Checkbox, Input, FormError, Select, TextArea } from '@/components/form'
import Loading from '@/app/[handle]/loading'

export default function ProfileSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [canManageIndexing, setCanManageIndexing] = useState(false)
  const [seoKeywordsInput, setSeoKeywordsInput] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: '',
    tagline: '',
    description: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'GB',
    timezone: 'Europe/London',
    seoTitle: '',
    seoDescription: '',
    allowSearchEngineIndexing: true,
  })

  useEffect(() => {
    fetchBusinessData()
  }, [])

  async function fetchBusinessData() {
    try {
      const response = await fetch('/api/business/settings?section=profile')
      const data = await response.json()

      if (data.success) {
        const { access, seoKeywords, ...profileData } = data.data
        setFormData(current => ({
          ...current,
          ...profileData,
          seoTitle: data.data.seoTitle || '',
          seoDescription: data.data.seoDescription || '',
          allowSearchEngineIndexing: data.data.allowSearchEngineIndexing !== false,
        }))
        setSeoKeywordsInput(Array.isArray(seoKeywords) ? seoKeywords.join(', ') : '')
        setCanManageIndexing(Boolean(access?.isOwner))
      } else {
        setError('Failed to load business data')
      }
    } catch (err) {
      setError('Failed to load business data')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)
    setErrors({})

    try {
      const { allowSearchEngineIndexing, ...sharedProfileFields } = formData
      const seoKeywords = seoKeywordsInput
        .split(',')
        .map(keyword => keyword.trim())
        .filter(Boolean)
        .slice(0, 20)
      const profile = canManageIndexing
        ? { ...sharedProfileFields, seoKeywords, allowSearchEngineIndexing }
        : { ...sharedProfileFields, seoKeywords }
      const response = await fetch('/api/business/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        if (data.details) {
          const fieldErrors: Record<string, string> = {}
          data.details.forEach((err: any) => {
            fieldErrors[err.path[0]] = err.message
          })
          setErrors(fieldErrors)
        } else {
          setError(data.error || 'Failed to save settings')
        }
      }
    } catch (err) {
      setError('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Loading />
  }

  const timezonesByRegion = getTimezonesByRegion()
  const timezoneOptions = Object.entries(timezonesByRegion).flatMap(([region, tzs]) =>
    tzs.map(tz => ({ value: tz.value, label: `${region} - ${tz.label}` }))
  )

  const categoryOptions = Object.entries(BUSINESS_CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label,
  }))

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Profile</h1>
          <p className="text-gray-600 mt-2">Manage your business information and settings</p>
        </div>
        {formData.slug && (
          <a
            href={`/${formData.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-onprez-blue hover:underline"
          >
            View Public Page
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {error && <FormError errors={error} dismissible onDismiss={() => setError('')} />}

      {success && (
        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl text-green-700">
          ✓ Settings saved successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Business Name *"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
              placeholder="Enter your business name"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Handle
                <Badge variant="default" size="sm" className="ml-2">
                  onprez.com/{formData.slug}
                </Badge>
              </label>
              <Input value={formData.slug} disabled className="bg-gray-50" />
              <p className="text-xs text-gray-500 mt-1">
                Your handle cannot be changed after creation
              </p>
            </div>

            <Select
              label="Category *"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              error={errors.category}
              options={[{ value: '', label: 'Select a category' }, ...categoryOptions]}
            />

            <Input
              label="Tagline"
              value={formData.tagline || ''}
              onChange={e => setFormData({ ...formData, tagline: e.target.value })}
              error={errors.tagline}
              placeholder="A short, catchy description"
              maxLength={200}
              helperText={`${formData.tagline?.length || 0}/200 characters`}
            />

            <TextArea
              label="Description"
              value={formData.description || ''}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              error={errors.description}
              placeholder="Tell people about your business"
              rows={4}
              maxLength={2000}
              showCharCount
            />
          </CardContent>
        </Card>

        {/* Search appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Search Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Input
              label="Search title"
              value={formData.seoTitle}
              onChange={e => setFormData({ ...formData, seoTitle: e.target.value })}
              error={errors.seoTitle}
              placeholder={`${formData.name || 'Your business'} - OnPrez`}
              maxLength={60}
              helperText={`${formData.seoTitle.length}/60 characters. Leave blank to use your business name.`}
            />

            <TextArea
              label="Search description"
              value={formData.seoDescription}
              onChange={e => setFormData({ ...formData, seoDescription: e.target.value })}
              error={errors.seoDescription}
              placeholder="A concise description of your services and location"
              rows={3}
              maxLength={160}
              showCharCount
            />

            <Input
              label="Search keywords"
              value={seoKeywordsInput}
              onChange={e => setSeoKeywordsInput(e.target.value)}
              error={errors.seoKeywords}
              placeholder="massage, Cambridge, wellness"
              helperText="Optional. Separate up to 20 phrases with commas."
            />

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <Checkbox
                checked={formData.allowSearchEngineIndexing}
                disabled={!canManageIndexing}
                onChange={e =>
                  setFormData({ ...formData, allowSearchEngineIndexing: e.target.checked })
                }
                label="Allow search engines to index this presence page"
                description="When enabled and published, the page can appear in OnPrez's sitemap and search results. Turning this off adds noindex and removes it from the sitemap."
              />
              {!canManageIndexing && (
                <p className="mt-3 text-xs text-amber-700">
                  Only the business owner can change search-engine visibility.
                </p>
              )}
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
                Search preview
              </p>
              <p className="mt-2 text-lg text-blue-800">
                {formData.seoTitle || `${formData.name} - OnPrez`}
              </p>
              <p className="text-sm text-green-700">onprez.com/{formData.slug}</p>
              <p className="mt-1 line-clamp-2 text-sm text-gray-700">
                {formData.seoDescription ||
                  formData.description ||
                  `Visit ${formData.name} on OnPrez to explore services and book.`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={formData.email || ''}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
              placeholder="contact@yourbusiness.com"
              leftIcon={<Mail className="w-5 h-5" />}
            />

            <Input
              label="Phone"
              type="tel"
              value={formData.phone || ''}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              error={errors.phone}
              placeholder="+44 20 1234 5678"
              leftIcon={<Phone className="w-5 h-5" />}
            />

            <Input
              label="Website"
              type="url"
              value={formData.website || ''}
              onChange={e => setFormData({ ...formData, website: e.target.value })}
              error={errors.website}
              placeholder="https://yourbusiness.com"
              leftIcon={<Globe className="w-5 h-5" />}
            />
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Address"
              value={formData.address || ''}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              error={errors.address}
              placeholder="123 High Street"
              leftIcon={<MapPin className="w-5 h-5" />}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="City"
                value={formData.city || ''}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                error={errors.city}
                placeholder="London"
              />

              <Input
                label="Postcode"
                value={formData.zipCode || ''}
                onChange={e => setFormData({ ...formData, zipCode: e.target.value })}
                error={errors.zipCode}
                placeholder="SW1A 1AA"
              />
            </div>

            <Select
              label="Timezone *"
              value={formData.timezone}
              onChange={e => setFormData({ ...formData, timezone: e.target.value })}
              error={errors.timezone}
              options={timezoneOptions}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => fetchBusinessData()}
            disabled={saving}
          >
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
