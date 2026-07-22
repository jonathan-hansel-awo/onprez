'use client'

import type { TestimonialsSection } from '@/types/page-sections'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ImageUpload } from '@/components/ui/image-upload'
import { Toggle } from '@/components/ui/toggle'
import { Input } from '@/components/form/input'
import { Label } from '@/components/form/label'
import { Select } from '@/components/form/select'
import { TextArea } from '@/components/form/text-area'
import { Plus, Trash2, Quote } from 'lucide-react'
import { SectionAppearanceEditor } from '../SectionAppearanceEditor'

interface TestimonialsSectionEditorProps {
  section: TestimonialsSection
  onUpdate: (section: TestimonialsSection) => void
  businessId: string | null
}

type Testimonial = TestimonialsSection['data']['testimonials'][number]

function createTestimonial(): Testimonial {
  return {
    id: `testimonial-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    role: '',
    content: '',
    rating: 5,
  }
}

export function TestimonialsSectionEditor({
  section,
  onUpdate,
  businessId,
}: TestimonialsSectionEditorProps) {
  function updateData<K extends keyof TestimonialsSection['data']>(
    field: K,
    value: TestimonialsSection['data'][K]
  ) {
    onUpdate({
      ...section,
      data: {
        ...section.data,
        [field]: value,
      },
    })
  }

  function updateTestimonial<K extends keyof Testimonial>(
    id: string,
    field: K,
    value: Testimonial[K]
  ) {
    updateData(
      'testimonials',
      section.data.testimonials.map(testimonial =>
        testimonial.id === id ? { ...testimonial, [field]: value } : testimonial
      )
    )
  }

  function removeTestimonial(id: string) {
    updateData(
      'testimonials',
      section.data.testimonials.filter(testimonial => testimonial.id !== id)
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Testimonials Composition</h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="testimonials-eyebrow">Eyebrow / Section Label</Label>
            <Input
              id="testimonials-eyebrow"
              value={section.data.eyebrow || ''}
              onChange={event => updateData('eyebrow', event.target.value)}
              placeholder="e.g., Client notes"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="testimonials-title">Section Title *</Label>
            <Input
              id="testimonials-title"
              value={section.data.title}
              onChange={event => updateData('title', event.target.value)}
              placeholder="e.g., Stories from the chair"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="testimonials-layout">Layout Preset</Label>
            <Select
              id="testimonials-layout"
              value={section.data.layout || 'carousel'}
              onChange={event =>
                updateData('layout', event.target.value as 'carousel' | 'grid' | 'editorial')
              }
              className="mt-1"
              options={[
                { value: 'carousel', label: 'Carousel — one story at a time' },
                { value: 'grid', label: 'Grid — several reviews' },
                { value: 'editorial', label: 'Editorial — oversized quote' },
              ]}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label>Show Ratings</Label>
              <p className="text-sm text-gray-500">Hide stars when the words should lead.</p>
            </div>
            <Toggle
              checked={section.data.showRatings ?? true}
              onChange={checked => updateData('showRatings', checked)}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Client Testimonials</h3>
            <p className="text-sm text-gray-500">Use real, permissioned client feedback.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => updateData('testimonials', [...section.data.testimonials, createTestimonial()])}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>

        {section.data.testimonials.length === 0 ? (
          <div className="rounded-lg bg-gray-50 px-4 py-10 text-center">
            <Quote className="mx-auto mb-3 h-10 w-10 text-gray-400" />
            <p className="font-medium text-gray-700">No testimonials yet</p>
            <p className="mt-1 text-sm text-gray-500">Add one to unlock this section in the preview.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {section.data.testimonials.map((testimonial, index) => (
              <div key={testimonial.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-gray-700">Testimonial {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeTestimonial(testimonial.id)}
                    className="flex min-h-10 min-w-10 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
                    aria-label={`Remove testimonial ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`testimonial-content-${testimonial.id}`}>Quote *</Label>
                    <TextArea
                      id={`testimonial-content-${testimonial.id}`}
                      value={testimonial.content}
                      onChange={event =>
                        updateTestimonial(testimonial.id, 'content', event.target.value)
                      }
                      placeholder="What did the client value about the experience?"
                      rows={4}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor={`testimonial-name-${testimonial.id}`}>Client Name *</Label>
                      <Input
                        id={`testimonial-name-${testimonial.id}`}
                        value={testimonial.name}
                        onChange={event =>
                          updateTestimonial(testimonial.id, 'name', event.target.value)
                        }
                        placeholder="e.g., Amara K."
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`testimonial-role-${testimonial.id}`}>Context</Label>
                      <Input
                        id={`testimonial-role-${testimonial.id}`}
                        value={testimonial.role || ''}
                        onChange={event =>
                          updateTestimonial(testimonial.id, 'role', event.target.value)
                        }
                        placeholder="e.g., Bridal client"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {section.data.showRatings !== false && (
                    <div>
                      <Label htmlFor={`testimonial-rating-${testimonial.id}`}>Rating</Label>
                      <Select
                        id={`testimonial-rating-${testimonial.id}`}
                        value={(testimonial.rating || 5).toString()}
                        onChange={event =>
                          updateTestimonial(testimonial.id, 'rating', Number(event.target.value))
                        }
                        className="mt-1"
                        options={[5, 4, 3, 2, 1].map(rating => ({
                          value: rating.toString(),
                          label: `${rating} star${rating === 1 ? '' : 's'}`,
                        }))}
                      />
                    </div>
                  )}

                  <div>
                    <Label className="mb-2">Client Photo (optional)</Label>
                    <ImageUpload
                      businessId={businessId}
                      purpose="gallery"
                      value={testimonial.image}
                      onChange={url => updateTestimonial(testimonial.id, 'image', url)}
                      onRemove={() => updateTestimonial(testimonial.id, 'image', undefined)}
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
