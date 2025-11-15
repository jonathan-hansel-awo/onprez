'use client'

import { HeroSection } from '@/types/page-sections'
import { Card, ImageUpload } from '@/components/ui'
import { Input, Label, Select, TextArea } from '@/components/form'
import { Toggle } from '@/components/ui/toggle'

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

          {/* Overlay Toggle */}
          {section.data.backgroundImage && (
            <div className="flex items-center justify-between">
              <div>
                <Label>Dark Overlay</Label>
                <p className="text-sm text-gray-500">
                  Adds a dark overlay to improve text readability
                </p>
              </div>
              <Toggle
                checked={section.data.overlay || false}
                onChange={checked => updateData('overlay', checked)}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Preview Tip */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> Check the preview on the right to see how your hero section looks
          on different devices
        </p>
      </div>
    </div>
  )
}
