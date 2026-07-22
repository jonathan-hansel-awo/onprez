'use client'

import type { SectionAppearance } from '@/types/page-sections'
import { Card } from '@/components/ui/card'
import { ColorPicker } from '@/components/ui/color-picker'
import { Label } from '@/components/form/label'
import { Select } from '@/components/form/select'
import { Paintbrush } from 'lucide-react'

interface SectionAppearanceEditorProps {
  appearance?: SectionAppearance
  onChange: (appearance: SectionAppearance) => void
}

export function SectionAppearanceEditor({ appearance, onChange }: SectionAppearanceEditorProps) {
  function updateAppearance<K extends keyof SectionAppearance>(
    field: K,
    value: SectionAppearance[K]
  ) {
    onChange({
      contentWidth: 'standard',
      spacing: 'normal',
      ...appearance,
      [field]: value,
    })
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <Paintbrush className="h-5 w-5 text-gray-600" aria-hidden="true" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Section Appearance</h3>
          <p className="text-sm text-gray-500">Fine-tune this section without changing the whole page.</p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <Label htmlFor="section-content-width">Content Width</Label>
          <Select
            id="section-content-width"
            value={appearance?.contentWidth || 'standard'}
            onChange={event =>
              updateAppearance(
                'contentWidth',
                event.target.value as NonNullable<SectionAppearance['contentWidth']>
              )
            }
            className="mt-1"
            options={[
              { value: 'narrow', label: 'Narrow — editorial reading width' },
              { value: 'standard', label: 'Standard — balanced' },
              { value: 'wide', label: 'Wide — image-led' },
              { value: 'full', label: 'Full width' },
            ]}
          />
        </div>

        <div>
          <Label htmlFor="section-spacing">Vertical Spacing</Label>
          <Select
            id="section-spacing"
            value={appearance?.spacing || 'normal'}
            onChange={event =>
              updateAppearance(
                'spacing',
                event.target.value as NonNullable<SectionAppearance['spacing']>
              )
            }
            className="mt-1"
            options={[
              { value: 'compact', label: 'Compact' },
              { value: 'normal', label: 'Comfortable' },
              { value: 'spacious', label: 'Spacious / premium' },
            ]}
          />
        </div>

        <ColorPicker
          label="Section Background"
          value={appearance?.backgroundColor || '#FFFFFF'}
          onChange={color => updateAppearance('backgroundColor', color)}
        />

        <ColorPicker
          label="Section Text"
          value={appearance?.textColor || '#111827'}
          onChange={color => updateAppearance('textColor', color)}
        />

        <ColorPicker
          label="Section Accent"
          value={appearance?.accentColor || '#3B82F6'}
          onChange={color => updateAppearance('accentColor', color)}
        />
      </div>
    </Card>
  )
}
