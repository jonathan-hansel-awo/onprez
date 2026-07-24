'use client'

import type { OwnerSection } from '@/types/page-sections'
import { Card } from '@/components/ui/card'
import { ImageUpload } from '@/components/ui/image-upload'
import { Input } from '@/components/form/input'
import { Label } from '@/components/form/label'
import { Select } from '@/components/form/select'
import { TextArea } from '@/components/form/text-area'
import { SectionAppearanceEditor } from '../SectionAppearanceEditor'

interface OwnerSectionEditorProps {
  section: OwnerSection
  onUpdate: (section: OwnerSection) => void
  businessId: string | null
}

export function OwnerSectionEditor({ section, onUpdate, businessId }: OwnerSectionEditorProps) {
  function updateData<K extends keyof OwnerSection['data']>(
    field: K,
    value: OwnerSection['data'][K]
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
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Owner Composition</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="owner-layout">Layout Preset</Label>
            <Select
              id="owner-layout"
              value={section.data.layout || 'portrait'}
              onChange={event =>
                updateData(
                  'layout',
                  event.target.value as 'portrait' | 'profile-card' | 'editorial'
                )
              }
              className="mt-1"
              options={[
                { value: 'portrait', label: 'Portrait — image and biography' },
                { value: 'profile-card', label: 'Profile card — contained and focused' },
                { value: 'editorial', label: 'Editorial — large portrait and story' },
              ]}
            />
          </div>

          <div>
            <Label htmlFor="owner-eyebrow">Eyebrow / Section Label</Label>
            <Input
              id="owner-eyebrow"
              value={section.data.eyebrow || ''}
              onChange={event => updateData('eyebrow', event.target.value)}
              placeholder="e.g., Meet your therapist"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="owner-name">Name *</Label>
            <Input
              id="owner-name"
              value={section.data.name}
              onChange={event => updateData('name', event.target.value)}
              placeholder="e.g., Dr Sarah Bennett"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="owner-role">Role / Professional Title</Label>
            <Input
              id="owner-role"
              value={section.data.role || ''}
              onChange={event => updateData('role', event.target.value)}
              placeholder="e.g., Integrative therapist · MBACP"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="owner-biography">Biography *</Label>
            <TextArea
              id="owner-biography"
              value={section.data.biography}
              onChange={event => updateData('biography', event.target.value)}
              placeholder="Share the person’s experience, approach, and what clients can expect. Simple HTML is supported."
              rows={10}
              className="mt-1 font-mono text-sm"
            />
          </div>

          <div>
            <Label htmlFor="owner-credentials">Credentials / Trust Signals</Label>
            <TextArea
              id="owner-credentials"
              value={(section.data.credentials || []).join('\n')}
              onChange={event =>
                updateData(
                  'credentials',
                  event.target.value
                    .split('\n')
                    .map(item => item.trim())
                    .filter(Boolean)
                )
              }
              placeholder={
                'BACP registered\nTrauma-informed practice\nOnline and in-person sessions'
              }
              rows={5}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-gray-500">
              Add one credential or reassurance per line.
            </p>
          </div>

          <div>
            <Label htmlFor="owner-quote">Personal Quote</Label>
            <TextArea
              id="owner-quote"
              value={section.data.quote || ''}
              onChange={event => updateData('quote', event.target.value)}
              placeholder="A short statement that captures the owner’s approach."
              rows={3}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="owner-signature">Signature Text</Label>
            <Input
              id="owner-signature"
              value={section.data.signature || ''}
              onChange={event => updateData('signature', event.target.value)}
              placeholder="e.g., Sarah"
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Owner Portrait</h3>
        <div className="space-y-4">
          <ImageUpload
            businessId={businessId}
            purpose="gallery"
            value={section.data.image}
            onChange={url => updateData('image', url)}
            onRemove={() => updateData('image', undefined)}
          />

          <div>
            <Label htmlFor="owner-image-position">Image Position</Label>
            <Select
              id="owner-image-position"
              value={section.data.imagePosition || 'left'}
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
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Owner Call to Action</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="owner-cta-text">Button Text</Label>
            <Input
              id="owner-cta-text"
              value={section.data.ctaText || ''}
              onChange={event => updateData('ctaText', event.target.value)}
              placeholder="e.g., Book an initial consultation"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="owner-cta-link">Button Link</Label>
            <Input
              id="owner-cta-link"
              value={section.data.ctaLink || ''}
              onChange={event => updateData('ctaLink', event.target.value)}
              placeholder="e.g., #book or #services"
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      <SectionAppearanceEditor
        appearance={section.appearance}
        onChange={appearance => onUpdate({ ...section, appearance })}
      />
    </div>
  )
}
