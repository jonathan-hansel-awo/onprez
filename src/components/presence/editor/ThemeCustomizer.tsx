/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/form/label'
import { Select } from '@/components/form/select'
import { Button } from '@/components/ui/button'
import { ColorPicker } from '@/components/ui/color-picker'
import { Palette, Type, Layout, RotateCcw, Sparkles, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ThemeSettings {
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  backgroundColor?: string
  textColor?: string
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
  { value: 'Montserrat', label: 'Montserrat (Bold & Modern)' },
]

const DEFAULT_THEME: ThemeSettings = {
  primaryColor: '#3B82F6',
  secondaryColor: '#8B5CF6',
  accentColor: '#10B981',
  backgroundColor: '#FFFFFF',
  textColor: '#111827',
  fontFamily: 'Inter',
  headingFont: 'Inter',
  buttonStyle: 'rounded',
  spacing: 'normal',
}

// Pre-made color palettes
const COLOR_PALETTES = [
  {
    name: 'OnPrez Default',
    colors: {
      primaryColor: '#3B82F6',
      secondaryColor: '#8B5CF6',
      accentColor: '#10B981',
    },
  },
  {
    name: 'Ocean Breeze',
    colors: {
      primaryColor: '#06B6D4',
      secondaryColor: '#0891B2',
      accentColor: '#14B8A6',
    },
  },
  {
    name: 'Sunset Glow',
    colors: {
      primaryColor: '#F97316',
      secondaryColor: '#FB923C',
      accentColor: '#FBBF24',
    },
  },
  {
    name: 'Forest Green',
    colors: {
      primaryColor: '#10B981',
      secondaryColor: '#059669',
      accentColor: '#34D399',
    },
  },
  {
    name: 'Royal Purple',
    colors: {
      primaryColor: '#8B5CF6',
      secondaryColor: '#A78BFA',
      accentColor: '#C084FC',
    },
  },
  {
    name: 'Rose Garden',
    colors: {
      primaryColor: '#EC4899',
      secondaryColor: '#F472B6',
      accentColor: '#FB7185',
    },
  },
]

export function ThemeCustomizer({ businessId, onUpdate, className }: ThemeCustomizerProps) {
  const [theme, setTheme] = useState<ThemeSettings>(DEFAULT_THEME)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [selectedPalette, setSelectedPalette] = useState<string | null>(null)

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
    setSelectedPalette(null) // Clear palette selection when manually editing
  }

  function applyPalette(palette: (typeof COLOR_PALETTES)[0]) {
    const newTheme = { ...theme, ...palette.colors }
    setTheme(newTheme)
    onUpdate(newTheme)
    setSelectedPalette(palette.name)
  }

  async function saveTheme() {
    setSaving(true)
    setSaveMessage(null)

    try {
      const response = await fetch(`/api/business/${businessId}/theme`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme }),
      })

      const data = await response.json()

      if (data.success) {
        setSaveMessage('Theme saved successfully!')
        setTimeout(() => setSaveMessage(null), 3000)
      } else {
        setSaveMessage(data.error || 'Failed to save theme')
      }
    } catch (error) {
      console.error('Failed to save theme:', error)
      setSaveMessage('Failed to save theme')
    } finally {
      setSaving(false)
    }
  }

  function resetToDefault() {
    if (confirm('Reset theme to default settings?')) {
      setTheme(DEFAULT_THEME)
      onUpdate(DEFAULT_THEME)
      setSelectedPalette('OnPrez Default')
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
      {/* Quick Color Palettes */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-onprez-purple" />
          <h3 className="text-lg font-semibold text-gray-900">Quick Color Palettes</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {COLOR_PALETTES.map(palette => (
            <button
              key={palette.name}
              onClick={() => applyPalette(palette)}
              className={`relative p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                selectedPalette === palette.name
                  ? 'border-onprez-blue shadow-lg'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Checkmark for selected palette */}
              {selectedPalette === palette.name && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-onprez-blue rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Palette name */}
              <div className="text-sm font-medium text-gray-900 mb-2">{palette.name}</div>

              {/* Color swatches */}
              <div className="flex gap-2">
                <div
                  className="flex-1 h-8 rounded-md"
                  style={{ backgroundColor: palette.colors.primaryColor }}
                />
                <div
                  className="flex-1 h-8 rounded-md"
                  style={{ backgroundColor: palette.colors.secondaryColor }}
                />
                <div
                  className="flex-1 h-8 rounded-md"
                  style={{ backgroundColor: palette.colors.accentColor }}
                />
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Advanced Colors */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Custom Colors</h3>
        </div>

        <div className="space-y-4">
          {/* Primary Color */}
          <div>
            <Label>Primary Color</Label>
            <p className="text-xs text-gray-500 mb-2">
              Main brand color for buttons, links, and key elements
            </p>
            <ColorPicker
              value={theme.primaryColor || DEFAULT_THEME.primaryColor!}
              onChange={color => updateTheme('primaryColor', color)}
            />
          </div>

          {/* Secondary Color */}
          <div>
            <Label>Secondary Color</Label>
            <p className="text-xs text-gray-500 mb-2">Used for gradients and accents</p>
            <ColorPicker
              value={theme.secondaryColor || DEFAULT_THEME.secondaryColor!}
              onChange={color => updateTheme('secondaryColor', color)}
            />
          </div>

          {/* Accent Color */}
          <div>
            <Label>Accent Color</Label>
            <p className="text-xs text-gray-500 mb-2">For highlights and success states</p>
            <ColorPicker
              value={theme.accentColor || DEFAULT_THEME.accentColor!}
              onChange={color => updateTheme('accentColor', color)}
            />
          </div>

          {/* Background Color */}
          <div>
            <Label>Background Color</Label>
            <p className="text-xs text-gray-500 mb-2">Main page background</p>
            <ColorPicker
              value={theme.backgroundColor || DEFAULT_THEME.backgroundColor!}
              onChange={color => updateTheme('backgroundColor', color)}
            />
          </div>

          {/* Text Color */}
          <div>
            <Label>Text Color</Label>
            <p className="text-xs text-gray-500 mb-2">Primary text color</p>
            <ColorPicker
              value={theme.textColor || DEFAULT_THEME.textColor!}
              onChange={color => updateTheme('textColor', color)}
            />
          </div>

          {/* Color Preview */}
          <div className="pt-4 border-t border-gray-200">
            <Label className="mb-3 block">Live Preview</Label>
            <div className="space-y-3">
              {/* Solid & Gradient Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <div
                  className="h-16 rounded-lg flex items-center justify-center text-white font-medium text-sm shadow-md"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  Primary
                </div>
                <div
                  className="h-16 rounded-lg flex items-center justify-center text-white font-medium text-sm shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 100%)`,
                  }}
                >
                  Gradient
                </div>
              </div>

              {/* Accent badge */}
              <div className="flex items-center gap-2">
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: theme.accentColor }}
                >
                  Accent Badge
                </span>
                <span className="text-sm text-gray-600">Example accent element</span>
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
            <p className="text-xs text-gray-500 mb-2">Used for paragraphs and body text</p>
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
            <p className="text-xs text-gray-500 mb-2">Used for titles and headings</p>
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
            <Label className="mb-3 block">Live Preview</Label>
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <h3
                className="text-2xl font-bold"
                style={{
                  fontFamily: theme.headingFont,
                  color: theme.textColor,
                }}
              >
                Professional Heading
              </h3>
              <p
                className="text-base leading-relaxed"
                style={{
                  fontFamily: theme.fontFamily,
                  color: theme.textColor,
                }}
              >
                This is how your body text will appear on your presence page. It should be easy to
                read and match your brand personality.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Layout Options */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Layout className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Layout & Spacing</h3>
        </div>

        <div className="space-y-4">
          {/* Button Style */}
          <div>
            <Label htmlFor="theme-button-style">Button Style</Label>
            <p className="text-xs text-gray-500 mb-2">Corner radius for buttons and cards</p>
            <Select
              id="theme-button-style"
              value={theme.buttonStyle || DEFAULT_THEME.buttonStyle!}
              onChange={e => updateTheme('buttonStyle', e.target.value as any)}
              className="mt-1"
              options={[
                { value: 'rounded', label: 'Rounded (Modern, 8px corners)' },
                { value: 'square', label: 'Square (Sharp, 0px corners)' },
                { value: 'pill', label: 'Pill (Fully rounded, 999px)' },
              ]}
            />

            {/* Button Preview */}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="px-5 py-2.5 text-white font-medium text-sm shadow-md hover:shadow-lg transition-shadow"
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
                Primary Button
              </button>
              <button
                className="px-5 py-2.5 font-medium text-sm border-2 hover:bg-gray-50 transition-colors"
                style={{
                  color: theme.primaryColor,
                  borderColor: theme.primaryColor,
                  borderRadius:
                    theme.buttonStyle === 'rounded'
                      ? '0.5rem'
                      : theme.buttonStyle === 'pill'
                        ? '9999px'
                        : '0',
                }}
              >
                Outline Button
              </button>
            </div>
          </div>

          {/* Spacing */}
          <div>
            <Label htmlFor="theme-spacing">Section Spacing</Label>
            <p className="text-xs text-gray-500 mb-2">Vertical spacing between page sections</p>
            <Select
              id="theme-spacing"
              value={theme.spacing || DEFAULT_THEME.spacing!}
              onChange={e => updateTheme('spacing', e.target.value as any)}
              className="mt-1"
              options={[
                { value: 'compact', label: 'Compact (Less whitespace, more content)' },
                { value: 'normal', label: 'Normal (Balanced spacing)' },
                { value: 'relaxed', label: 'Relaxed (Generous whitespace)' },
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

      {/* Save Message */}
      <AnimatePresence>
        {saveMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`text-sm text-center font-medium ${
              saveMessage.includes('success') ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {saveMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-4">
        <p className="text-sm text-gray-800">
          <strong>💡 Pro Tip:</strong> Theme changes appear instantly in the preview. Remember to
          save when you're happy with your design!
        </p>
      </div>
    </div>
  )
}
