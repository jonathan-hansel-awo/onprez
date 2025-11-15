/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/form/label'
import { Select } from '@/components/form/select'
import { Button } from '@/components/ui/button'
import { ColorPicker } from '@/components/ui/color-picker'
import { Palette, Type, Layout, RotateCcw } from 'lucide-react'

interface ThemeSettings {
  primaryColor?: string
  secondaryColor?: string
  fontFamily?: string
  headingFont?: string
  buttonStyle?: 'rounded' | 'square' | 'pill'
  spacing?: 'compact' | 'normal' | 'relaxed'
}

interface ThemeCustomizerProps {
  businessId: string
  onUpdate: (theme: ThemeSettings) => void
  className?: string
}

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter (Modern Sans-Serif)' },
  { value: 'system-ui', label: 'System Default' },
  { value: 'Georgia', label: 'Georgia (Classic Serif)' },
  { value: 'Merriweather', label: 'Merriweather (Elegant Serif)' },
  { value: 'Roboto', label: 'Roboto (Clean Sans-Serif)' },
  { value: 'Open Sans', label: 'Open Sans (Friendly)' },
  { value: 'Playfair Display', label: 'Playfair (Sophisticated)' },
  { value: 'Poppins', label: 'Poppins (Contemporary)' },
  { value: 'Lato', label: 'Lato (Professional)' },
]

const DEFAULT_THEME: ThemeSettings = {
  primaryColor: '#3B82F6',
  secondaryColor: '#8B5CF6',
  fontFamily: 'Inter',
  headingFont: 'Inter',
  buttonStyle: 'rounded',
  spacing: 'normal',
}

export function ThemeCustomizer({ businessId, onUpdate, className }: ThemeCustomizerProps) {
  const [theme, setTheme] = useState<ThemeSettings>(DEFAULT_THEME)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchTheme()
  }, [businessId])

  async function fetchTheme() {
    try {
      const response = await fetch(`/api/business/${businessId}`)
      const data = await response.json()

      if (data.success) {
        const settings = data.data.business.settings as any
        if (settings?.theme) {
          setTheme({ ...DEFAULT_THEME, ...settings.theme })
        }
      }
    } catch (error) {
      console.error('Failed to fetch theme:', error)
    } finally {
      setLoading(false)
    }
  }

  function updateTheme<K extends keyof ThemeSettings>(field: K, value: ThemeSettings[K]) {
    const newTheme = { ...theme, [field]: value }
    setTheme(newTheme)
    onUpdate(newTheme)
  }

  async function saveTheme() {
    setSaving(true)
    try {
      const response = await fetch(`/api/business/${businessId}/theme`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme }),
      })

      const data = await response.json()

      if (data.success) {
        // Theme saved successfully
      } else {
        alert(data.error || 'Failed to save theme')
      }
    } catch (error) {
      console.error('Failed to save theme:', error)
      alert('Failed to save theme')
    } finally {
      setSaving(false)
    }
  }

  function resetToDefault() {
    if (confirm('Reset theme to default settings?')) {
      setTheme(DEFAULT_THEME)
      onUpdate(DEFAULT_THEME)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-onprez-blue" />
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Colors */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Brand Colors</h3>
        </div>

        <div className="space-y-4">
          {/* Primary Color */}
          <div>
            <Label>Primary Color</Label>
            <p className="text-xs text-gray-500 mb-2">Used for buttons, links, and accents</p>
            <ColorPicker
              value={theme.primaryColor || DEFAULT_THEME.primaryColor!}
              onChange={color => updateTheme('primaryColor', color)}
            />
          </div>

          {/* Secondary Color */}
          <div>
            <Label>Secondary Color</Label>
            <p className="text-xs text-gray-500 mb-2">Used for gradients and secondary elements</p>
            <ColorPicker
              value={theme.secondaryColor || DEFAULT_THEME.secondaryColor!}
              onChange={color => updateTheme('secondaryColor', color)}
            />
          </div>

          {/* Color Preview */}
          <div className="pt-4 border-t border-gray-200">
            <Label className="mb-3 block">Preview</Label>
            <div className="grid grid-cols-2 gap-3">
              {/* Solid Color */}
              <div
                className="h-16 rounded-lg flex items-center justify-center text-white font-medium text-sm"
                style={{ backgroundColor: theme.primaryColor }}
              >
                Primary
              </div>

              {/* Gradient */}
              <div
                className="h-16 rounded-lg flex items-center justify-center text-white font-medium text-sm"
                style={{
                  background: `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 100%)`,
                }}
              >
                Gradient
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Typography */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Type className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Typography</h3>
        </div>

        <div className="space-y-4">
          {/* Body Font */}
          <div>
            <Label htmlFor="theme-font">Body Font</Label>
            <Select
              id="theme-font"
              value={theme.fontFamily || DEFAULT_THEME.fontFamily!}
              onChange={e => updateTheme('fontFamily', e.target.value)}
              className="mt-1"
              style={{ fontFamily: theme.fontFamily }}
              options={FONT_OPTIONS}
            />
          </div>

          {/* Heading Font */}
          <div>
            <Label htmlFor="theme-heading-font">Heading Font</Label>
            <Select
              id="theme-heading-font"
              value={theme.headingFont || DEFAULT_THEME.headingFont!}
              onChange={e => updateTheme('headingFont', e.target.value)}
              className="mt-1"
              style={{ fontFamily: theme.headingFont }}
              options={FONT_OPTIONS}
            />
          </div>

          {/* Typography Preview */}
          <div className="pt-4 border-t border-gray-200">
            <Label className="mb-3 block">Preview</Label>
            <div className="space-y-2">
              <h3
                className="text-2xl font-bold text-gray-900"
                style={{ fontFamily: theme.headingFont }}
              >
                This is a Heading
              </h3>
              <p className="text-base text-gray-700" style={{ fontFamily: theme.fontFamily }}>
                This is body text. Your content will use this font throughout your presence page.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Layout Options */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Layout className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Layout Options</h3>
        </div>

        <div className="space-y-4">
          {/* Button Style */}
          <div>
            <Label htmlFor="theme-button-style">Button Style</Label>
            <Select
              id="theme-button-style"
              value={theme.buttonStyle || DEFAULT_THEME.buttonStyle!}
              onChange={e => updateTheme('buttonStyle', e.target.value as any)}
              className="mt-1"
              options={[
                { value: 'rounded', label: 'Rounded (Smooth corners)' },
                { value: 'square', label: 'Square (Sharp corners)' },
                { value: 'pill', label: 'Pill (Fully rounded)' },
              ]}
            />

            {/* Button Preview */}
            <div className="mt-3 flex gap-2">
              <button
                className="px-4 py-2 text-white font-medium text-sm"
                style={{
                  backgroundColor: theme.primaryColor,
                  borderRadius:
                    theme.buttonStyle === 'rounded'
                      ? '0.5rem'
                      : theme.buttonStyle === 'pill'
                        ? '9999px'
                        : '0',
                }}
              >
                Preview Button
              </button>
            </div>
          </div>

          {/* Spacing */}
          <div>
            <Label htmlFor="theme-spacing">Section Spacing</Label>
            <Select
              id="theme-spacing"
              value={theme.spacing || DEFAULT_THEME.spacing!}
              onChange={e => updateTheme('spacing', e.target.value as any)}
              className="mt-1"
              options={[
                { value: 'compact', label: 'Compact (Less space)' },
                { value: 'normal', label: 'Normal (Balanced)' },
                { value: 'relaxed', label: 'Relaxed (More space)' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 pt-4">
        <Button variant="ghost" onClick={resetToDefault}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Default
        </Button>

        <Button variant="primary" onClick={saveTheme} disabled={saving}>
          {saving ? 'Saving...' : 'Save Theme'}
        </Button>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> Theme changes are applied in real-time to the preview. Save to
          make them permanent.
        </p>
      </div>
    </div>
  )
}
