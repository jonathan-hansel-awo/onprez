'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ColorPicker } from '@/components/ui/color-picker'
import { ImageUpload } from '@/components/ui/image-upload'
import { Save, Loader2, Eye } from 'lucide-react'
import { FormError, Select } from '@/components/form'

const FONT_OPTIONS = [
  { value: 'inter', label: 'Inter (Modern)' },
  { value: 'playfair', label: 'Playfair Display (Elegant)' },
  { value: 'roboto', label: 'Roboto (Clean)' },
  { value: 'montserrat', label: 'Montserrat (Bold)' },
  { value: 'lato', label: 'Lato (Friendly)' },
]

export default function BrandingSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [branding, setBranding] = useState({
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    accentColor: '#8B5CF6',
    fontFamily: 'inter',
    logoUrl: '',
    coverImageUrl: '',
  })

  useEffect(() => {
    fetchBrandingData()
  }, [])

  async function fetchBrandingData() {
    try {
      const response = await fetch('/api/business/settings?section=branding')
      const data = await response.json()

      if (data.success) {
        setBranding({ ...branding, ...data.data.branding })
      }
    } catch (err) {
      setError('Failed to load branding data')
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
      const response = await fetch('/api/business/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branding }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(data.error || 'Failed to save branding')
      }
    } catch (err) {
      setError('Failed to save branding')
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Branding</h1>
          <p className="text-gray-600 mt-2">Customize your brand colors and assets</p>
        </div>
        <Button variant="ghost" size="sm">
          <Eye className="w-4 h-4 mr-2" />
          Preview
        </Button>
      </div>

      {error && <FormError errors={error} dismissible onDismiss={() => setError('')} />}

      {success && (
        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl text-green-700">
          ✓ Branding saved successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Brand Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Colors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ColorPicker
              label="Primary Color"
              value={branding.primaryColor}
              onChange={color => setBranding({ ...branding, primaryColor: color })}
            />
            <ColorPicker
              label="Secondary Color"
              value={branding.secondaryColor}
              onChange={color => setBranding({ ...branding, secondaryColor: color })}
            />
            <ColorPicker
              label="Accent Color"
              value={branding.accentColor}
              onChange={color => setBranding({ ...branding, accentColor: color })}
            />
          </CardContent>
        </Card>

        {/* Typography */}
        <Card>
          <CardHeader>
            <CardTitle>Typography</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              label="Font Family"
              value={branding.fontFamily}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setBranding({ ...branding, fontFamily: e.target.value })
              }
              options={FONT_OPTIONS}
            />
          </CardContent>
        </Card>

        {/* Logo & Images */}
        <Card>
          <CardHeader>
            <CardTitle>Logo & Cover Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ImageUpload
              label="Logo"
              value={branding.logoUrl}
              onChange={url => setBranding({ ...branding, logoUrl: url })}
              onRemove={() => setBranding({ ...branding, logoUrl: '' })}
              aspect="square"
              maxSize={2}
            />
            <ImageUpload
              label="Cover Image"
              value={branding.coverImageUrl}
              onChange={url => setBranding({ ...branding, coverImageUrl: url })}
              onRemove={() => setBranding({ ...branding, coverImageUrl: '' })}
              aspect="landscape"
              maxSize={5}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="ghost" onClick={fetchBrandingData} disabled={saving}>
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
