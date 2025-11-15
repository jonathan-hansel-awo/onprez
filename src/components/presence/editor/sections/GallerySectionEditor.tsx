'use client'

import { GallerySection } from '@/types/page-sections'
import { Input } from '@/components/form/input'
import { Select } from '@/components/form/select'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/form/label'
import { ImageUpload } from '@/components/ui/image-upload'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { Plus, X, GripVertical, ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface GallerySectionEditorProps {
  section: GallerySection
  onUpdate: (section: GallerySection) => void
}

export function GallerySectionEditor({ section, onUpdate }: GallerySectionEditorProps) {
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
    const newImage = {
      url,
      alt: '',
      caption: '',
    }

    updateData('images', [...section.data.images, newImage])
  }

  function removeImage(index: number) {
    const newImages = section.data.images.filter((_, i) => i !== index)
    updateData('images', newImages)
    if (editingImageIndex === index) {
      setEditingImageIndex(null)
    }
  }

  function updateImage(index: number, field: 'alt' | 'caption', value: string) {
    const newImages = section.data.images.map((img, i) =>
      i === index ? { ...img, [field]: value } : img
    )
    updateData('images', newImages)
  }

  function handleDragStart(index: number) {
    setDraggedIndex(index)
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()

    if (draggedIndex === null || draggedIndex === index) return

    const newImages = [...section.data.images]
    const draggedImage = newImages[draggedIndex]

    newImages.splice(draggedIndex, 1)
    newImages.splice(index, 0, draggedImage)

    updateData('images', newImages)
    setDraggedIndex(index)
  }

  function handleDragEnd() {
    setDraggedIndex(null)
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Gallery Settings</h3>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="gallery-title">Section Title</Label>
            <Input
              id="gallery-title"
              value={section.data.title || ''}
              onChange={e => updateData('title', e.target.value)}
              placeholder="e.g., Gallery, Our Work, Portfolio"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty to hide the title</p>
          </div>

          {/* Layout */}
          <div>
            <Label htmlFor="gallery-layout">Layout Style</Label>
            <Select
              id="gallery-layout"
              value={section.data.layout || 'grid'}
              onChange={e =>
                updateData('layout', e.target.value as 'grid' | 'masonry' | 'carousel')
              }
              className="mt-1"
              options={[
                { value: 'grid', label: 'Grid' },
                { value: 'masonry', label: 'Masonry' },
                { value: 'carousel', label: 'Carousel' },
              ]}
            />
          </div>

          {/* Columns (only for grid/masonry) */}
          {(section.data.layout === 'grid' || section.data.layout === 'masonry') && (
            <div>
              <Label htmlFor="gallery-columns">Columns</Label>
              <Select
                id="gallery-columns"
                value={section.data.columns?.toString() || '3'}
                onChange={e => updateData('columns', parseInt(e.target.value) as 2 | 3 | 4)}
                className="mt-1"
                options={[
                  { value: '2', label: '2' },
                  { value: '3', label: '3' },
                  { value: '4', label: '4' },
                ]}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Add New Image */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Images</h3>

        <ImageUpload
          value=""
          onChange={url => addImage(url)}
          onRemove={() => {}}
          showRemoveButton={false}
        />

        <p className="text-xs text-gray-500 mt-2">
          Click to upload images one at a time, or drag and drop
        </p>
      </Card>

      {/* Image List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Gallery Images</h3>
          <div className="text-sm text-gray-600">{section.data.images.length} images</div>
        </div>

        {section.data.images.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">No images yet</p>
            <p className="text-sm text-gray-500">Upload images to create your gallery</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-600 mb-3">💡 Drag images to reorder them</p>

            {section.data.images.map((image, index) => (
              <div
                key={index}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={e => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  group relative bg-gray-50 rounded-lg overflow-hidden transition-all
                  ${draggedIndex === index ? 'opacity-50' : 'opacity-100'}
                  ${editingImageIndex === index ? 'ring-2 ring-onprez-blue' : 'border border-gray-200'}
                `}
              >
                <div className="flex items-start gap-4 p-3">
                  {/* Drag Handle */}
                  <div className="cursor-move pt-2">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                  </div>

                  {/* Image Preview */}
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                    <Image
                      src={image.url}
                      alt={image.alt || `Gallery image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Image Details */}
                  <div className="flex-1 min-w-0">
                    {editingImageIndex === index ? (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor={`image-alt-${index}`} className="text-xs">
                            Alt Text (for accessibility)
                          </Label>
                          <Input
                            id={`image-alt-${index}`}
                            value={image.alt}
                            onChange={e => updateImage(index, 'alt', e.target.value)}
                            placeholder="Describe the image"
                            className="mt-1 text-sm"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`image-caption-${index}`} className="text-xs">
                            Caption (optional)
                          </Label>
                          <Input
                            id={`image-caption-${index}`}
                            value={image.caption || ''}
                            onChange={e => updateImage(index, 'caption', e.target.value)}
                            placeholder="Add a caption"
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
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-medium text-sm text-gray-900">Image {index + 1}</p>
                          <button
                            type="button"
                            onClick={() => setEditingImageIndex(index)}
                            className="text-xs text-onprez-blue hover:underline"
                          >
                            Edit Details
                          </button>
                        </div>

                        {image.alt && (
                          <p className="text-xs text-gray-600 mb-1">
                            <span className="font-medium">Alt:</span> {image.alt}
                          </p>
                        )}

                        {image.caption && (
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">Caption:</span> {image.caption}
                          </p>
                        )}

                        {!image.alt && !image.caption && (
                          <p className="text-xs text-gray-500 italic">No details added</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    title="Remove image"
                  >
                    <X className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Info Boxes */}
      <div className="space-y-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Add alt text to your images for better accessibility and SEO
          </p>
        </div>

        {section.data.layout === 'masonry' && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-800">
              ✨ <strong>Masonry layout</strong> creates a Pinterest-style grid where images of
              different heights fit together beautifully
            </p>
          </div>
        )}

        {section.data.layout === 'carousel' && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-800">
              ✨ <strong>Carousel layout</strong> displays images in a slideshow that visitors can
              navigate through
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
