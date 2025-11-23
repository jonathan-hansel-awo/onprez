'use client'

import { HeroSection } from '@/types/page-sections'
import { Card, ImageUpload } from '@/components/ui'
import { Input, Label, Select, TextArea } from '@/components/form'
import { Toggle } from '@/components/ui/toggle'
import { ColorPicker } from '@/components/ui/color-picker'
import { useState } from 'react'

interface HeroSectionEditorProps {
  section: HeroSection
  onUpdate: (section: HeroSection) => void
}

export function HeroSectionEditor({ section, onUpdate }: HeroSectionEditorProps) {
  function updateData<K extends keyof HeroSection['data']>(
    field: K,
    value: HeroSection['data'][K]
  ) {
    onUpdate({
      ...section,
      data: {
        ...section.data,
        [field]: value,
      },
    })
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hero Content</h3>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="hero-title">Title *</Label>
            <Input
              id="hero-title"
              value={section.data.title}
              onChange={e => updateData('title', e.target.value)}
              placeholder="Enter hero title"
              className="mt-1"
            />
          </div>

          {/* Subtitle */}
          <div>
            <Label htmlFor="hero-subtitle">Subtitle</Label>
            <TextArea
              id="hero-subtitle"
              value={section.data.subtitle || ''}
              onChange={e => updateData('subtitle', e.target.value)}
              placeholder="Enter hero subtitle (optional)"
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Alignment */}
          <div>
            <Label htmlFor="hero-alignment">Text Alignment</Label>
            <Select
              id="hero-alignment"
              value={section.data.alignment || 'center'}
              onChange={e => updateData('alignment', e.target.value as 'left' | 'center' | 'right')}
              className="mt-1"
              options={[
                { value: 'left', label: 'Left' },
                { value: 'center', label: 'Center' },
                { value: 'right', label: 'Right' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Call to Action */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Call to Action</h3>

        <div className="space-y-4">
          {/* CTA Text */}
          <div>
            <Label htmlFor="hero-cta-text">Button Text</Label>
            <Input
              id="hero-cta-text"
              value={section.data.ctaText || ''}
              onChange={e => updateData('ctaText', e.target.value)}
              placeholder="e.g., Get Started"
              className="mt-1"
            />
          </div>

          {/* CTA Link */}
          <div>
            <Label htmlFor="hero-cta-link">Button Link</Label>
            <Input
              id="hero-cta-link"
              value={section.data.ctaLink || ''}
              onChange={e => updateData('ctaLink', e.target.value)}
              placeholder="e.g., #services or /contact"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Use # for page anchors (e.g., #services) or full URLs
            </p>
          </div>
        </div>
      </Card>

      {/* Background Image */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Background</h3>

        <div className="space-y-4">
          {/* Background Image Upload */}
          <div>
            <Label className="mb-2">Background Image</Label>
            <ImageUpload
              value={section.data.backgroundImage}
              onChange={url => updateData('backgroundImage', url)}
              onRemove={() => updateData('backgroundImage', undefined)}
            />
          </div>
        </div>
      </Card>

      {/* Overlay Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Overlay Settings</h3>

        <div className="space-y-4">
          {/* Enable Overlay */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Overlay</Label>
              <p className="text-sm text-gray-500">
                Adds a color overlay to improve text readability
              </p>
            </div>
            <Toggle
              checked={section.data.overlay ?? true}
              onChange={checked => updateData('overlay', checked)}
            />
          </div>

          {section.data.overlay !== false && (
            <>
              {/* Overlay Color */}
              <ColorPicker
                label="Overlay Color"
                value={section.data.overlayColor || '#000000'}
                onChange={color => updateData('overlayColor', color)}
              />

              {/* Overlay Opacity */}
              <div>
                <Label htmlFor="overlay-opacity">
                  Overlay Opacity: {section.data.overlayOpacity ?? 50}%
                </Label>
                <input
                  id="overlay-opacity"
                  type="range"
                  min="0"
                  max="100"
                  value={section.data.overlayOpacity ?? 50}
                  onChange={e => updateData('overlayOpacity', parseInt(e.target.value))}
                  className="w-full mt-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Transparent</span>
                  <span>Opaque</span>
                </div>
              </div>

              {/* Overlay Style */}
              <div>
                <Label htmlFor="overlay-style">Overlay Style</Label>
                <Select
                  id="overlay-style"
                  value={section.data.overlayStyle || 'solid'}
                  onChange={e =>
                    updateData(
                      'overlayStyle',
                      e.target.value as 'solid' | 'gradient-vertical' | 'gradient-diagonal'
                    )
                  }
                  className="mt-1"
                  options={[
                    { value: 'solid', label: 'Solid' },
                    { value: 'gradient-vertical', label: 'Gradient (Top to Bottom)' },
                    { value: 'gradient-diagonal', label: 'Gradient (Diagonal)' },
                  ]}
                />
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Text Styling */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Text Styling</h3>

        <div className="space-y-4">
          {/* Text Color */}
          <div>
            <Label htmlFor="text-color">Text Color</Label>
            <Select
              id="text-color"
              value={section.data.textColor || 'light'}
              onChange={e => updateData('textColor', e.target.value as 'light' | 'dark' | 'custom')}
              className="mt-1"
              options={[
                { value: 'light', label: 'Light (White)' },
                { value: 'dark', label: 'Dark (Gray)' },
                { value: 'custom', label: 'Custom Color' },
              ]}
            />
          </div>

          {/* Custom Text Color */}
          {section.data.textColor === 'custom' && (
            <ColorPicker
              label="Custom Text Color"
              value={section.data.customTextColor || '#FFFFFF'}
              onChange={color => updateData('customTextColor', color)}
            />
          )}

          {/* Text Shadow */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Text Shadow</Label>
              <p className="text-sm text-gray-500">Adds subtle shadow for better readability</p>
            </div>
            <Toggle
              checked={section.data.textShadow ?? true}
              onChange={checked => updateData('textShadow', checked)}
            />
          </div>
        </div>
      </Card>

      {/* Preview Tips */}
      <div className="space-y-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Use the overlay to make text stand out against busy background
            images
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-800">
            🎨 <strong>Pro Tip:</strong> Gradient overlays create a modern, sleek look. Try diagonal
            gradients for extra style!
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            ✨ <strong>Readability:</strong> Use light text on dark overlays, or dark text on light
            overlays
          </p>
        </div>
      </div>
    </div>
  )
}
