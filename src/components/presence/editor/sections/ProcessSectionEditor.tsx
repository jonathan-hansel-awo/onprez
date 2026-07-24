'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { ProcessSection } from '@/types/page-sections'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/form/input'
import { Label } from '@/components/form/label'
import { Select } from '@/components/form/select'
import { TextArea } from '@/components/form/text-area'
import { SectionAppearanceEditor } from '../SectionAppearanceEditor'

interface ProcessSectionEditorProps {
  section: ProcessSection
  onUpdate: (section: ProcessSection) => void
}

export function ProcessSectionEditor({ section, onUpdate }: ProcessSectionEditorProps) {
  function updateData<K extends keyof ProcessSection['data']>(
    field: K,
    value: ProcessSection['data'][K]
  ) {
    onUpdate({
      ...section,
      data: {
        ...section.data,
        [field]: value,
      },
    })
  }

  function updateStep(index: number, field: 'title' | 'description', value: string) {
    updateData(
      'steps',
      section.data.steps.map((step, stepIndex) =>
        stepIndex === index ? { ...step, [field]: value } : step
      )
    )
  }

  function addStep() {
    updateData('steps', [
      ...section.data.steps,
      {
        id: `step-${Date.now()}-${section.data.steps.length + 1}`,
        title: 'New step',
        description: 'Explain what happens at this stage.',
      },
    ])
  }

  function removeStep(index: number) {
    updateData(
      'steps',
      section.data.steps.filter((_, stepIndex) => stepIndex !== index)
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Process Composition</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="process-layout">Layout Preset</Label>
            <Select
              id="process-layout"
              value={section.data.layout || 'steps'}
              onChange={event =>
                updateData('layout', event.target.value as 'steps' | 'timeline' | 'cards')
              }
              className="mt-1"
              options={[
                { value: 'steps', label: 'Steps — clean numbered sequence' },
                { value: 'timeline', label: 'Timeline — guided vertical journey' },
                { value: 'cards', label: 'Cards — prominent and modular' },
              ]}
            />
          </div>

          {section.data.layout !== 'timeline' && (
            <div>
              <Label htmlFor="process-columns">Columns</Label>
              <Select
                id="process-columns"
                value={(section.data.columns || 3).toString()}
                onChange={event => updateData('columns', Number(event.target.value) as 2 | 3 | 4)}
                className="mt-1"
                options={[
                  { value: '2', label: '2 columns' },
                  { value: '3', label: '3 columns' },
                  { value: '4', label: '4 columns' },
                ]}
              />
            </div>
          )}

          <div>
            <Label htmlFor="process-eyebrow">Eyebrow / Section Label</Label>
            <Input
              id="process-eyebrow"
              value={section.data.eyebrow || ''}
              onChange={event => updateData('eyebrow', event.target.value)}
              placeholder="e.g., What happens next"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="process-title">Section Title *</Label>
            <Input
              id="process-title"
              value={section.data.title}
              onChange={event => updateData('title', event.target.value)}
              placeholder="e.g., Starting therapy should feel clear"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="process-description">Description</Label>
            <TextArea
              id="process-description"
              value={section.data.description || ''}
              onChange={event => updateData('description', event.target.value)}
              placeholder="Add a short introduction to the process."
              rows={3}
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Process Steps</h3>
            <p className="mt-1 text-sm text-gray-500">Keep each step concise and reassuring.</p>
          </div>
          <Button variant="primary" size="sm" onClick={addStep} className="min-h-11 shrink-0">
            <Plus className="mr-1 h-4 w-4" />
            Add step
          </Button>
        </div>

        {section.data.steps.length === 0 ? (
          <div className="rounded-lg bg-gray-50 p-8 text-center text-sm text-gray-500">
            Add the first step to explain how customers begin.
          </div>
        ) : (
          <div className="space-y-4">
            {section.data.steps.map((step, index) => (
              <div key={step.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                    Step {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-red-50"
                    aria-label={`Remove step ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor={`process-step-title-${index}`}>Title</Label>
                    <Input
                      id={`process-step-title-${index}`}
                      value={step.title}
                      onChange={event => updateStep(index, 'title', event.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`process-step-description-${index}`}>Description</Label>
                    <TextArea
                      id={`process-step-description-${index}`}
                      value={step.description}
                      onChange={event => updateStep(index, 'description', event.target.value)}
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <SectionAppearanceEditor
        appearance={section.appearance}
        onChange={appearance => onUpdate({ ...section, appearance })}
      />
    </div>
  )
}
