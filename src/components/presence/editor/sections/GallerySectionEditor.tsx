'use client'

import { GallerySection } from '@/types/page-sections'
import { Input } from '@/components/form/input'
import { Select } from '@/components/form/select'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/form/label'
import { ImageUpload } from '@/components/ui/image-upload'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { X, GripVertical, ImageIcon, Star } from 'lucide-react'
import Image from 'next/image'
import { SectionAppearanceEditor } from '../SectionAppearanceEditor'

interface GallerySectionEditorProps {
  section: GallerySection
  onUpdate: (section: GallerySection) => void
  businessId: string | null
}

export function GallerySectionEditor({ section, onUpdate, businessId }: GallerySectionEditorProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null)

  function updateData<K extends keyof GallerySection['data']>(
    field: K,
    value: GallerySection['data'][K]
  ) {
    onUpdate({
      ...section,
      data: {
        ...section.data,
        [field]: value,
      },
    })
  }

  function addImage(url: string) {
    updateData('images', [...section.data.images, { url, alt: '', caption: '' }])
  }

  function removeImage(index: number) {
    const images = section.data.images.filter((_, imageIndex) => imageIndex !== index)
    const currentFeaturedIndex = section.data.featuredImageIndex || 0
    let featuredImageIndex = currentFeaturedIndex

    if (index === currentFeaturedIndex) featuredImageIndex = 0
    if (index < currentFeaturedIndex) featuredImageIndex = currentFeaturedIndex - 1

    onUpdate({
      ...section,
      data: {
        ...section.data,
        images,
        featuredImageIndex: images.length ? Math.min(featuredImageIndex, images.length - 1) : 0,
      },
    })

    if (editingImageIndex === index) setEditingImageIndex(null)
  }

  function updateImage(index: number, field: 'alt' | 'caption', value: string) {
    updateData(
      'images',
      section.data.images.map((image, imageIndex) =>
        imageIndex === index ? { ...image, [field]: value } : image
      )
    )
  }

  function handleDragOver(event: React.DragEvent, index: number) {
    event.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const featuredImage = section.data.images[section.data.featuredImageIndex || 0]
    const images = [...section.data.images]
    const [draggedImage] = images.splice(draggedIndex, 1)
    images.splice(index, 0, draggedImage)

    onUpdate({
      ...section,
      data: {
        ...section.data,
        images,
        featuredImageIndex: featuredImage ? images.indexOf(featuredImage) : 0,
      },
    })
    setDraggedIndex(index)
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Gallery Composition</h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="gallery-eyebrow">Eyebrow / Section Label</Label>
            <Input
              id="gallery-eyebrow"
              value={section.data.eyebrow || ''}
              onChange={event => updateData('eyebrow', event.target.value)}
              placeholder="e.g., Selected work"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="gallery-title">Section Title</Label>
            <Input
              id="gallery-title"
              value={section.data.title || ''}
              onChange={event => updateData('title', event.target.value)}
              placeholder="e.g., The Crown & Canvas edit"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="gallery-layout">Layout Preset</Label>
            <Select
              id="gallery-layout"
              value={section.data.layout || 'grid'}
              onChange={event =>
                updateData(
                  'layout',
                  event.target.value as 'grid' | 'masonry' | 'carousel' | 'editorial'
                )
              }
              className="mt-1"
              options={[
                { value: 'grid', label: 'Grid' },
                { value: 'masonry', label: 'Masonry' },
                { value: 'carousel', label: 'Carousel' },
                { value: 'editorial', label: 'Editorial — featured image mosaic' },
              ]}
            />
          </div>

          {(section.data.layout === 'grid' || section.data.layout === 'masonry') && (
            <div>
              <Label htmlFor="gallery-columns">Columns</Label>
              <Select
                id="gallery-columns"
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
            <Label htmlFor="gallery-gap">Image Spacing</Label>
            <Select
              id="gallery-gap"
              value={section.data.gap || 'normal'}
              onChange={event =>
                updateData('gap', event.target.value as 'tight' | 'normal' | 'wide')
              }
              className="mt-1"
              options={[
                { value: 'tight', label: 'Tight' },
                { value: 'normal', label: 'Normal' },
                { value: 'wide', label: 'Wide' },
              ]}
            />
          </div>

          <div>
            <Label htmlFor="gallery-radius">Image Corners</Label>
            <Select
              id="gallery-radius"
              value={section.data.imageRadius || 'soft'}
              onChange={event =>
                updateData('imageRadius', event.target.value as 'none' | 'soft' | 'rounded')
              }
              className="mt-1"
              options={[
                { value: 'none', label: 'Square — editorial' },
                { value: 'soft', label: 'Soft' },
                { value: 'rounded', label: 'Rounded' },
              ]}
            />
          </div>

          {section.data.layout === 'editorial' && section.data.images.length > 0 && (
            <div>
              <Label htmlFor="gallery-featured-image">Featured Image</Label>
              <Select
                id="gallery-featured-image"
                value={(section.data.featuredImageIndex || 0).toString()}
                onChange={event => updateData('featuredImageIndex', Number(event.target.value))}
                className="mt-1"
                options={section.data.images.map((image, index) => ({
                  value: index.toString(),
                  label: image.alt || image.caption || `Image ${index + 1}`,
                }))}
              />
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Add Images</h3>
        <ImageUpload
          businessId={businessId}
          purpose="gallery"
          value=""
          onChange={url => addImage(url)}
          onRemove={() => {}}
          showRemoveButton={false}
        />
        <p className="mt-2 text-xs text-gray-500">
          Upload images one at a time, then drag to reorder.
        </p>
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Gallery Images</h3>
          <span className="text-sm text-gray-600">{section.data.images.length} images</span>
        </div>

        {section.data.images.length === 0 ? (
          <div className="rounded-lg bg-gray-50 py-12 text-center">
            <ImageIcon className="mx-auto mb-3 h-12 w-12 text-gray-400" />
            <p className="mb-2 text-gray-600">No images yet</p>
            <p className="text-sm text-gray-500">
              Add at least three for a strong editorial mosaic.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {section.data.images.map((image, index) => {
              const isFeatured = (section.data.featuredImageIndex || 0) === index

              return (
                <div
                  key={`${image.url}-${index}`}
                  draggable
                  onDragStart={() => setDraggedIndex(index)}
                  onDragOver={event => handleDragOver(event, index)}
                  onDragEnd={() => setDraggedIndex(null)}
                  className={`group relative overflow-hidden rounded-lg bg-gray-50 transition-all ${
                    draggedIndex === index ? 'opacity-50' : 'opacity-100'
                  } ${editingImageIndex === index ? 'ring-2 ring-onprez-blue' : 'border border-gray-200'}`}
                >
                  <div className="flex items-start gap-4 p-3">
                    <div className="cursor-move pt-2">
                      <GripVertical className="h-5 w-5 text-gray-400" />
                    </div>

                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-200">
                      <Image
                        src={image.url}
                        alt={image.alt || `Gallery image ${index + 1}`}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                      {isFeatured && (
                        <div
                          className="absolute left-1 top-1 rounded-full bg-white p-1 shadow"
                          title="Featured image"
                        >
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      {editingImageIndex === index ? (
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor={`image-alt-${index}`} className="text-xs">
                              Alt Text
                            </Label>
                            <Input
                              id={`image-alt-${index}`}
                              value={image.alt}
                              onChange={event => updateImage(index, 'alt', event.target.value)}
                              placeholder="Describe the image"
                              className="mt-1 text-sm"
                            />
                          </div>

                          <div>
                            <Label htmlFor={`image-caption-${index}`} className="text-xs">
                              Caption
                            </Label>
                            <Input
                              id={`image-caption-${index}`}
                              value={image.caption || ''}
                              onChange={event => updateImage(index, 'caption', event.target.value)}
                              placeholder="Add an optional caption"
                              className="mt-1 text-sm"
                            />
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingImageIndex(null)}
                          >
                            Done
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <div className="mb-1 flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900">Image {index + 1}</p>
                            <button
                              type="button"
                              onClick={() => setEditingImageIndex(index)}
                              className="text-xs text-onprez-blue hover:underline"
                            >
                              Edit details
                            </button>
                          </div>
                          <p className="line-clamp-2 text-xs text-gray-600">
                            {image.alt || image.caption || 'No details added'}
                          </p>
                          {section.data.layout === 'editorial' && !isFeatured && (
                            <button
                              type="button"
                              onClick={() => updateData('featuredImageIndex', index)}
                              className="mt-2 text-xs font-medium text-amber-700 hover:underline"
                            >
                              Make featured
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="shrink-0 rounded-lg p-2 transition-colors hover:bg-red-50"
                      aria-label={`Remove image ${index + 1}`}
                    >
                      <X className="h-5 w-5 text-red-600" />
                    </button>
                  </div>
                </div>
              )
            })}
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
