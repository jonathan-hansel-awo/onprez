/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/form/label'
import { Select } from '@/components/form/select'
import { Button } from '@/components/ui/button'
import { ColorPicker } from '@/components/ui/color-picker'
import { Palette, Type, Layout, RotateCcw, Sparkles, Check, Layers } from 'lucide-react'
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
  // Background options
  backgroundType?: 'solid' | 'gradient' | 'pattern'
  backgroundGradient?: {
    type: 'linear' | 'radial'
    angle?: number
    colors: string[]
  }
  backgroundPattern?: {
    type: 'dots' | 'grid' | 'diagonal' | 'waves' | 'none'
    color?: string
    opacity?: number
    size?: 'small' | 'medium' | 'large'
  }
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
  backgroundType: 'solid',
  backgroundGradient: {
    type: 'linear',
    angle: 180,
    colors: ['#FFFFFF', '#F3F4F6'],
  },
  backgroundPattern: {
    type: 'none',
    color: '#000000',
    opacity: 10,
    size: 'medium',
  },
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
        onUpdate(theme)
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

      {/* Page Background */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Page Background</h3>
        </div>

        <div className="space-y-4">
          {/* Background Type */}
          <div>
            <Label htmlFor="background-type">Background Type</Label>
            <p className="text-xs text-gray-500 mb-2">Choose how the page background appears</p>
            <Select
              id="background-type"
              value={theme.backgroundType || 'solid'}
              onChange={e =>
                updateTheme('backgroundType', e.target.value as 'solid' | 'gradient' | 'pattern')
              }
              className="mt-1"
              options={[
                { value: 'solid', label: 'Solid Color' },
                { value: 'gradient', label: 'Gradient' },
                { value: 'pattern', label: 'Pattern' },
              ]}
            />
          </div>

          {/* Solid Color Options */}
          {theme.backgroundType === 'solid' && (
            <div>
              <Label>Background Color</Label>
              <p className="text-xs text-gray-500 mb-2">Main page background color</p>
              <ColorPicker
                value={theme.backgroundColor || DEFAULT_THEME.backgroundColor!}
                onChange={color => updateTheme('backgroundColor', color)}
              />
            </div>
          )}

          {/* Gradient Options */}
          {theme.backgroundType === 'gradient' && (
            <div className="space-y-4">
              {/* Gradient Type */}
              <div>
                <Label htmlFor="gradient-type">Gradient Type</Label>
                <Select
                  id="gradient-type"
                  value={theme.backgroundGradient?.type || 'linear'}
                  onChange={e =>
                    updateTheme('backgroundGradient', {
                      ...theme.backgroundGradient,
                      type: e.target.value as 'linear' | 'radial',
                      colors: theme.backgroundGradient?.colors || ['#FFFFFF', '#F3F4F6'],
                    })
                  }
                  className="mt-1"
                  options={[
                    { value: 'linear', label: 'Linear (Directional)' },
                    { value: 'radial', label: 'Radial (Circular)' },
                  ]}
                />
              </div>

              {/* Gradient Angle (only for linear) */}
              {theme.backgroundGradient?.type === 'linear' && (
                <div>
                  <Label htmlFor="gradient-angle">
                    Gradient Angle: {theme.backgroundGradient?.angle ?? 180}°
                  </Label>
                  <input
                    id="gradient-angle"
                    type="range"
                    min="0"
                    max="360"
                    value={theme.backgroundGradient?.angle ?? 180}
                    onChange={e =>
                      updateTheme('backgroundGradient', {
                        ...theme.backgroundGradient,
                        type: theme.backgroundGradient?.type || 'linear',
                        angle: parseInt(e.target.value),
                        colors: theme.backgroundGradient?.colors || ['#FFFFFF', '#F3F4F6'],
                      })
                    }
                    className="w-full mt-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0° (Top)</span>
                    <span>90° (Right)</span>
                    <span>180° (Bottom)</span>
                    <span>270° (Left)</span>
                  </div>
                </div>
              )}

              {/* Gradient Colors */}
              <div>
                <Label>Start Color</Label>
                <ColorPicker
                  value={theme.backgroundGradient?.colors?.[0] || '#FFFFFF'}
                  onChange={color =>
                    updateTheme('backgroundGradient', {
                      ...theme.backgroundGradient,
                      type: theme.backgroundGradient?.type || 'linear',
                      colors: [color, theme.backgroundGradient?.colors?.[1] || '#F3F4F6'],
                    })
                  }
                />
              </div>

              <div>
                <Label>End Color</Label>
                <ColorPicker
                  value={theme.backgroundGradient?.colors?.[1] || '#F3F4F6'}
                  onChange={color =>
                    updateTheme('backgroundGradient', {
                      ...theme.backgroundGradient,
                      type: theme.backgroundGradient?.type || 'linear',
                      colors: [theme.backgroundGradient?.colors?.[0] || '#FFFFFF', color],
                    })
                  }
                />
              </div>

              {/* Gradient Preview */}
              <div className="pt-2">
                <Label className="mb-2 block">Gradient Preview</Label>
                <div
                  className="h-24 rounded-lg border border-gray-200"
                  style={{
                    background:
                      theme.backgroundGradient?.type === 'radial'
                        ? `radial-gradient(circle, ${theme.backgroundGradient?.colors?.[0] || '#FFFFFF'}, ${theme.backgroundGradient?.colors?.[1] || '#F3F4F6'})`
                        : `linear-gradient(${theme.backgroundGradient?.angle ?? 180}deg, ${theme.backgroundGradient?.colors?.[0] || '#FFFFFF'}, ${theme.backgroundGradient?.colors?.[1] || '#F3F4F6'})`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Pattern Options */}
          {theme.backgroundType === 'pattern' && (
            <div className="space-y-4">
              {/* Base Color */}
              <div>
                <Label>Base Background Color</Label>
                <p className="text-xs text-gray-500 mb-2">The solid color behind the pattern</p>
                <ColorPicker
                  value={theme.backgroundColor || DEFAULT_THEME.backgroundColor!}
                  onChange={color => updateTheme('backgroundColor', color)}
                />
              </div>

              {/* Pattern Type */}
              <div>
                <Label htmlFor="pattern-type">Pattern Style</Label>
                <Select
                  id="pattern-type"
                  value={theme.backgroundPattern?.type || 'none'}
                  onChange={e =>
                    updateTheme('backgroundPattern', {
                      ...theme.backgroundPattern,
                      type: e.target.value as 'dots' | 'grid' | 'diagonal' | 'waves' | 'none',
                      color: theme.backgroundPattern?.color || '#000000',
                      opacity: theme.backgroundPattern?.opacity ?? 10,
                      size: theme.backgroundPattern?.size || 'medium',
                    })
                  }
                  className="mt-1"
                  options={[
                    { value: 'none', label: 'No Pattern' },
                    { value: 'dots', label: 'Dots' },
                    { value: 'grid', label: 'Grid Lines' },
                    { value: 'diagonal', label: 'Diagonal Lines' },
                    { value: 'waves', label: 'Waves' },
                  ]}
                />
              </div>

              {theme.backgroundPattern?.type && theme.backgroundPattern.type !== 'none' && (
                <>
                  {/* Pattern Color */}
                  <div>
                    <Label>Pattern Color</Label>
                    <ColorPicker
                      value={theme.backgroundPattern?.color || '#000000'}
                      onChange={color =>
                        updateTheme('backgroundPattern', {
                          ...theme.backgroundPattern,
                          type: theme.backgroundPattern?.type || 'dots',
                          color,
                          opacity: theme.backgroundPattern?.opacity ?? 10,
                          size: theme.backgroundPattern?.size || 'medium',
                        })
                      }
                    />
                  </div>

                  {/* Pattern Opacity */}
                  <div>
                    <Label htmlFor="pattern-opacity">
                      Pattern Opacity: {theme.backgroundPattern?.opacity ?? 10}%
                    </Label>
                    <input
                      id="pattern-opacity"
                      type="range"
                      min="5"
                      max="50"
                      value={theme.backgroundPattern?.opacity ?? 10}
                      onChange={e =>
                        updateTheme('backgroundPattern', {
                          ...theme.backgroundPattern,
                          type: theme.backgroundPattern?.type || 'dots',
                          color: theme.backgroundPattern?.color || '#000000',
                          opacity: parseInt(e.target.value),
                          size: theme.backgroundPattern?.size || 'medium',
                        })
                      }
                      className="w-full mt-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Subtle</span>
                      <span>Visible</span>
                    </div>
                  </div>

                  {/* Pattern Size */}
                  <div>
                    <Label htmlFor="pattern-size">Pattern Size</Label>
                    <Select
                      id="pattern-size"
                      value={theme.backgroundPattern?.size || 'medium'}
                      onChange={e =>
                        updateTheme('backgroundPattern', {
                          ...theme.backgroundPattern,
                          type: theme.backgroundPattern?.type || 'dots',
                          color: theme.backgroundPattern?.color || '#000000',
                          opacity: theme.backgroundPattern?.opacity ?? 10,
                          size: e.target.value as 'small' | 'medium' | 'large',
                        })
                      }
                      className="mt-1"
                      options={[
                        { value: 'small', label: 'Small' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'large', label: 'Large' },
                      ]}
                    />
                  </div>

                  {/* Pattern Preview */}
                  <div className="pt-2">
                    <Label className="mb-2 block">Pattern Preview</Label>
                    <BackgroundPreview
                      backgroundColor={theme.backgroundColor || '#FFFFFF'}
                      pattern={theme.backgroundPattern}
                    />
                  </div>
                </>
              )}
            </div>
          )}
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

// Background Preview Component
function BackgroundPreview({
  backgroundColor,
  pattern,
}: {
  backgroundColor: string
  pattern?: ThemeSettings['backgroundPattern']
}) {
  const getPatternStyle = (): React.CSSProperties => {
    if (!pattern || pattern.type === 'none') {
      return { backgroundColor }
    }

    const patternColor = pattern.color || '#000000'
    const opacity = (pattern.opacity ?? 10) / 100
    const patternColorWithOpacity = `${patternColor}${Math.round(opacity * 255)
      .toString(16)
      .padStart(2, '0')}`

    const sizeMap = {
      small: { dots: '20px 20px', grid: '20px 20px', diagonal: '10px 10px', waves: '40px 20px' },
      medium: { dots: '40px 40px', grid: '40px 40px', diagonal: '20px 20px', waves: '80px 40px' },
      large: { dots: '60px 60px', grid: '60px 60px', diagonal: '30px 30px', waves: '120px 60px' },
    }

    const size = sizeMap[pattern.size || 'medium'][pattern.type]

    switch (pattern.type) {
      case 'dots':
        return {
          background: `radial-gradient(circle, ${patternColorWithOpacity} 1px, transparent 1px), ${backgroundColor}`,
          backgroundSize: size,
        }
      case 'grid':
        return {
          background: `linear-gradient(${patternColorWithOpacity} 1px, transparent 1px), linear-gradient(90deg, ${patternColorWithOpacity} 1px, transparent 1px), ${backgroundColor}`,
          backgroundSize: size,
        }
      case 'diagonal':
        return {
          background: `repeating-linear-gradient(45deg, transparent, transparent 10px, ${patternColorWithOpacity} 10px, ${patternColorWithOpacity} 11px), ${backgroundColor}`,
        }
      case 'waves':
        return {
          background: `radial-gradient(ellipse 100% 100% at 50% 0%, transparent 50%, ${patternColorWithOpacity} 50%, ${patternColorWithOpacity} 51%, transparent 51%), ${backgroundColor}`,
          backgroundSize: size,
        }
      default:
        return { backgroundColor }
    }
  }

  return <div className="h-24 rounded-lg border border-gray-200" style={getPatternStyle()} />
}
