'use client'

import { HeroSection } from '@/types/page-sections'
import { Card, ImageUpload } from '@/components/ui'
import { Input, Label, Select, TextArea } from '@/components/form'
import { Toggle } from '@/components/ui/toggle'
import { ColorPicker } from '@/components/ui/color-picker'
import { SectionAppearanceEditor } from '../SectionAppearanceEditor'

interface HeroSectionEditorProps {
  section: HeroSection
  onUpdate: (section: HeroSection) => void
  businessId: string | null
}

export function HeroSectionEditor({ section, onUpdate, businessId }: HeroSectionEditorProps) {
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

  const layout = section.data.layout || 'cover'

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Hero Composition</h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="hero-layout">Layout Preset</Label>
            <Select
              id="hero-layout"
              value={layout}
              onChange={event =>
                updateData('layout', event.target.value as 'cover' | 'split' | 'editorial')
              }
              className="mt-1"
              options={[
                { value: 'cover', label: 'Cover — text over image' },
                { value: 'split', label: 'Split — content beside image' },
                { value: 'editorial', label: 'Editorial — premium magazine style' },
              ]}
            />
            <p className="mt-1 text-xs text-gray-500">
              Editorial and split layouts use the uploaded image as a dedicated image panel.
            </p>
          </div>

          <div>
            <Label htmlFor="hero-eyebrow">Eyebrow / Category Label</Label>
            <Input
              id="hero-eyebrow"
              value={section.data.eyebrow || ''}
              onChange={event => updateData('eyebrow', event.target.value)}
              placeholder="e.g., Hair artistry · Ely"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="hero-title">Title *</Label>
            <Input
              id="hero-title"
              value={section.data.title}
              onChange={event => updateData('title', event.target.value)}
              placeholder="Enter hero title"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="hero-subtitle">Subtitle</Label>
            <TextArea
              id="hero-subtitle"
              value={section.data.subtitle || ''}
              onChange={event => updateData('subtitle', event.target.value)}
              placeholder="A concise promise or positioning statement"
              rows={3}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="hero-alignment">Text Alignment</Label>
            <Select
              id="hero-alignment"
              value={section.data.alignment || (layout === 'cover' ? 'center' : 'left')}
              onChange={event =>
                updateData('alignment', event.target.value as 'left' | 'center' | 'right')
              }
              className="mt-1"
              options={[
                { value: 'left', label: 'Left' },
                { value: 'center', label: 'Centre' },
                { value: 'right', label: 'Right' },
              ]}
            />
          </div>

          <div>
            <Label htmlFor="hero-height">Hero Height</Label>
            <Select
              id="hero-height"
              value={section.data.minHeight || 'standard'}
              onChange={event =>
                updateData(
                  'minHeight',
                  event.target.value as 'compact' | 'standard' | 'viewport'
                )
              }
              className="mt-1"
              options={[
                { value: 'compact', label: 'Compact' },
                { value: 'standard', label: 'Standard' },
                { value: 'viewport', label: 'Full screen impact' },
              ]}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Call to Action</h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="hero-cta-text">Primary Button Text</Label>
            <Input
              id="hero-cta-text"
              value={section.data.ctaText || ''}
              onChange={event => updateData('ctaText', event.target.value)}
              placeholder="e.g., Book an appointment"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="hero-cta-link">Primary Button Link</Label>
            <Input
              id="hero-cta-link"
              value={section.data.ctaLink || ''}
              onChange={event => updateData('ctaLink', event.target.value)}
              placeholder="e.g., #services or #book"
              className="mt-1"
            />
          </div>

          <div className="border-t border-gray-200 pt-4">
            <Label htmlFor="hero-secondary-cta-text">Secondary Button Text</Label>
            <Input
              id="hero-secondary-cta-text"
              value={section.data.secondaryCtaText || ''}
              onChange={event => updateData('secondaryCtaText', event.target.value)}
              placeholder="e.g., Explore our work"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="hero-secondary-cta-link">Secondary Button Link</Label>
            <Input
              id="hero-secondary-cta-link"
              value={section.data.secondaryCtaLink || ''}
              onChange={event => updateData('secondaryCtaLink', event.target.value)}
              placeholder="e.g., #gallery"
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Hero Image</h3>

        <div className="space-y-4">
          <div>
            <Label className="mb-2">Image</Label>
            <ImageUpload
              businessId={businessId}
              purpose="business-cover"
              value={section.data.backgroundImage}
              onChange={url => updateData('backgroundImage', url)}
              onRemove={() => updateData('backgroundImage', undefined)}
            />
          </div>

          {layout !== 'cover' && (
            <div>
              <Label htmlFor="hero-image-position">Image Position</Label>
              <Select
                id="hero-image-position"
                value={section.data.imagePosition || 'right'}
                onChange={event =>
                  updateData('imagePosition', event.target.value as 'left' | 'right')
                }
                className="mt-1"
                options={[
                  { value: 'left', label: 'Left' },
                  { value: 'right', label: 'Right' },
                ]}
              />
            </div>
          )}

          <div>
            <Label htmlFor="hero-image-focal-point">Image Focal Point</Label>
            <Select
              id="hero-image-focal-point"
              value={section.data.imageFocalPoint || 'center'}
              onChange={event =>
                updateData('imageFocalPoint', event.target.value as 'center' | 'top' | 'bottom')
              }
              className="mt-1"
              options={[
                { value: 'top', label: 'Top / face' },
                { value: 'center', label: 'Centre' },
                { value: 'bottom', label: 'Bottom' },
              ]}
            />
          </div>
        </div>
      </Card>

      {layout === 'cover' && (
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Image Overlay</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label>Enable Overlay</Label>
                <p className="text-sm text-gray-500">Improves readability over photography.</p>
              </div>
              <Toggle
                checked={section.data.overlay ?? true}
                onChange={checked => updateData('overlay', checked)}
              />
            </div>

            {section.data.overlay !== false && (
              <>
                <ColorPicker
                  label="Overlay Color"
                  value={section.data.overlayColor || '#000000'}
                  onChange={color => updateData('overlayColor', color)}
                />

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
                    onChange={event => updateData('overlayOpacity', Number(event.target.value))}
                    className="mt-2 w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="overlay-style">Overlay Style</Label>
                  <Select
                    id="overlay-style"
                    value={section.data.overlayStyle || 'solid'}
                    onChange={event =>
                      updateData(
                        'overlayStyle',
                        event.target.value as
                          | 'solid'
                          | 'gradient-vertical'
                          | 'gradient-diagonal'
                      )
                    }
                    className="mt-1"
                    options={[
                      { value: 'solid', label: 'Solid' },
                      { value: 'gradient-vertical', label: 'Vertical gradient' },
                      { value: 'gradient-diagonal', label: 'Diagonal gradient' },
                    ]}
                  />
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Text Styling</h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="hero-text-color">Text Colour</Label>
            <Select
              id="hero-text-color"
              value={section.data.textColor || (layout === 'cover' ? 'light' : 'dark')}
              onChange={event =>
                updateData('textColor', event.target.value as 'light' | 'dark' | 'custom')
              }
              className="mt-1"
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'custom', label: 'Custom' },
              ]}
            />
          </div>

          {section.data.textColor === 'custom' && (
            <ColorPicker
              label="Custom Text Colour"
              value={section.data.customTextColor || '#FFFFFF'}
              onChange={color => updateData('customTextColor', color)}
            />
          )}

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label>Text Shadow</Label>
              <p className="text-sm text-gray-500">Useful for cover layouts only.</p>
            </div>
            <Toggle
              checked={section.data.textShadow ?? layout === 'cover'}
              onChange={checked => updateData('textShadow', checked)}
            />
          </div>
        </div>
      </Card>

      <SectionAppearanceEditor
        appearance={section.appearance}
        onChange={appearance => onUpdate({ ...section, appearance })}
      />

      <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
        <p className="text-sm text-purple-800">
          <strong>Premium recipe:</strong> Choose Editorial, upload a portrait image, use a serif
          heading font in Theme, add an eyebrow, and pair a booking CTA with a gallery CTA.
        </p>
      </div>
    </div>
  )
}
