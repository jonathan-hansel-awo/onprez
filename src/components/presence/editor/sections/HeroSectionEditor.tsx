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
              The layout controls structure. Visual style and image treatment below control the art
              direction.
            </p>
          </div>

          <div>
            <Label htmlFor="hero-eyebrow">Eyebrow / Category Label</Label>
            <Input
              id="hero-eyebrow"
              value={section.data.eyebrow || ''}
              onChange={event => updateData('eyebrow', event.target.value)}
              placeholder="e.g., Integrative therapy · Ely"
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
                updateData('minHeight', event.target.value as 'compact' | 'standard' | 'viewport')
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
        <h3 className="mb-1 text-lg font-semibold text-gray-900">Premium Art Direction</h3>
        <p className="mb-4 text-sm text-gray-500">
          Choose a visual language without replacing the section or losing responsive behaviour.
        </p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="hero-variant">Visual Style</Label>
            <Select
              id="hero-variant"
              value={section.data.variant || 'classic'}
              onChange={event =>
                updateData(
                  'variant',
                  event.target.value as
                    | 'classic'
                    | 'luxury'
                    | 'editorial'
                    | 'bold'
                    | 'professional'
                    | 'creative'
                    | 'education'
                )
              }
              className="mt-1"
              options={[
                { value: 'classic', label: 'Classic — balanced and versatile' },
                { value: 'luxury', label: 'Luxury — refined and spacious' },
                { value: 'editorial', label: 'Editorial — expressive magazine type' },
                { value: 'bold', label: 'Bold — high-impact statement' },
                { value: 'professional', label: 'Professional — calm and trust-led' },
                { value: 'creative', label: 'Creative — art-directed and distinctive' },
                { value: 'education', label: 'Education — warm and approachable' },
              ]}
            />
          </div>

          <div>
            <Label htmlFor="hero-image-treatment">Image Treatment</Label>
            <Select
              id="hero-image-treatment"
              value={section.data.imageTreatment || 'full'}
              onChange={event =>
                updateData(
                  'imageTreatment',
                  event.target.value as 'full' | 'frame' | 'arch' | 'offset' | 'collage'
                )
              }
              className="mt-1"
              options={[
                { value: 'full', label: 'Full bleed' },
                { value: 'frame', label: 'Framed' },
                { value: 'arch', label: 'Arch' },
                { value: 'offset', label: 'Offset border' },
                { value: 'collage', label: 'Editorial collage' },
              ]}
            />
          </div>

          <div>
            <Label htmlFor="hero-meta">Trust Labels</Label>
            <TextArea
              id="hero-meta"
              value={(section.data.meta || []).join('\n')}
              onChange={event =>
                updateData(
                  'meta',
                  event.target.value
                    .split('\n')
                    .map(item => item.trim())
                    .filter(Boolean)
                )
              }
              placeholder={'Confidential\nOnline and in-person\nBACP registered'}
              rows={4}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-gray-500">Add one concise reassurance per line.</p>
          </div>

          <div>
            <Label htmlFor="hero-decorative-text">Decorative Background Word</Label>
            <Input
              id="hero-decorative-text"
              value={section.data.decorativeText || ''}
              onChange={event => updateData('decorativeText', event.target.value)}
              placeholder="e.g., BREATHE"
              className="mt-1"
            />
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-gray-200 pt-4">
            <div>
              <Label>Floating Story Card</Label>
              <p className="text-sm text-gray-500">Adds a supporting message on larger screens.</p>
            </div>
            <Toggle
              checked={Boolean(section.data.floatingCard)}
              onChange={checked =>
                updateData(
                  'floatingCard',
                  checked
                    ? {
                        eyebrow: 'A note for you',
                        title: 'A calmer first step',
                        description:
                          'Choose a time that feels manageable and begin at your own pace.',
                      }
                    : undefined
                )
              }
            />
          </div>

          {section.data.floatingCard && (
            <div className="space-y-3 rounded-xl bg-gray-50 p-4">
              <div>
                <Label htmlFor="hero-floating-eyebrow">Card Eyebrow</Label>
                <Input
                  id="hero-floating-eyebrow"
                  value={section.data.floatingCard.eyebrow}
                  onChange={event =>
                    updateData('floatingCard', {
                      ...section.data.floatingCard!,
                      eyebrow: event.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="hero-floating-title">Card Title</Label>
                <Input
                  id="hero-floating-title"
                  value={section.data.floatingCard.title}
                  onChange={event =>
                    updateData('floatingCard', {
                      ...section.data.floatingCard!,
                      title: event.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="hero-floating-description">Card Description</Label>
                <TextArea
                  id="hero-floating-description"
                  value={section.data.floatingCard.description || ''}
                  onChange={event =>
                    updateData('floatingCard', {
                      ...section.data.floatingCard!,
                      description: event.target.value,
                    })
                  }
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 border-t border-gray-200 pt-4">
            <div>
              <Label>Scroll Cue</Label>
              <p className="text-sm text-gray-500">Shows a subtle prompt on large screens.</p>
            </div>
            <Toggle
              checked={section.data.showScrollCue ?? false}
              onChange={checked => updateData('showScrollCue', checked)}
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
              placeholder="e.g., Meet your therapist"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="hero-secondary-cta-link">Secondary Button Link</Label>
            <Input
              id="hero-secondary-cta-link"
              value={section.data.secondaryCtaLink || ''}
              onChange={event => updateData('secondaryCtaLink', event.target.value)}
              placeholder="e.g., #owner"
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
                        event.target.value as 'solid' | 'gradient-vertical' | 'gradient-diagonal'
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
          <strong>Art-direction tip:</strong> Start with the business story, then combine a layout,
          visual style, image treatment, and section colours. The editor now preserves those choices
          across preview and published pages.
        </p>
      </div>
    </div>
  )
}
