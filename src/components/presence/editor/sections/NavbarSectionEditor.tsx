'use client'

import { NavbarSection } from '@/types/page-sections'
import { Input } from '@/components/form/input'
import { Select } from '@/components/form/select'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/form/label'
import { ImageUpload } from '@/components/ui/image-upload'
import { Toggle } from '@/components/ui/toggle'
import { ColorPicker } from '@/components/ui/color-picker'
import { Button } from '@/components/ui/button'
import { Plus, X, GripVertical, ExternalLink } from 'lucide-react'
import { useState } from 'react'

interface NavbarSectionEditorProps {
  section: NavbarSection
  onUpdate: (section: NavbarSection) => void
}

export function NavbarSectionEditor({ section, onUpdate }: NavbarSectionEditorProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  function updateData<K extends keyof NavbarSection['data']>(
    field: K,
    value: NavbarSection['data'][K]
  ) {
    onUpdate({
      ...section,
      data: {
        ...section.data,
        [field]: value,
      },
    })
  }

  function addLink() {
    const newLink = {
      id: `link-${Date.now()}`,
      label: 'New Link',
      href: '#',
      isExternal: false,
    }
    updateData('links', [...(section.data.links || []), newLink])
  }

  function removeLink(index: number) {
    const newLinks = section.data.links.filter((_, i) => i !== index)
    updateData('links', newLinks)
  }

  function updateLink(
    index: number,
    field: 'label' | 'href' | 'isExternal',
    value: string | boolean
  ) {
    const newLinks = section.data.links.map((link, i) =>
      i === index ? { ...link, [field]: value } : link
    )
    updateData('links', newLinks)
  }

  function handleDragStart(index: number) {
    setDraggedIndex(index)
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newLinks = [...section.data.links]
    const draggedLink = newLinks[draggedIndex]
    newLinks.splice(draggedIndex, 1)
    newLinks.splice(index, 0, draggedLink)

    updateData('links', newLinks)
    setDraggedIndex(index)
  }

  function handleDragEnd() {
    setDraggedIndex(null)
  }

  return (
    <div className="space-y-6">
      {/* Logo Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Logo & Branding</h3>

        <div className="space-y-4">
          {/* Show Logo Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Show Logo Image</Label>
              <p className="text-sm text-gray-500">Display your business logo</p>
            </div>
            <Toggle
              checked={section.data.showLogo ?? true}
              onChange={checked => updateData('showLogo', checked)}
            />
          </div>

          {/* Logo Upload */}
          {section.data.showLogo !== false && (
            <div>
              <Label className="mb-2">Logo Image</Label>
              <ImageUpload
                value={section.data.logo}
                onChange={url => updateData('logo', url)}
                onRemove={() => updateData('logo', undefined)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Recommended: Square image, at least 200x200px
              </p>
            </div>
          )}

          {/* Show Logo Text Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Show Business Name</Label>
              <p className="text-sm text-gray-500">Display text next to logo</p>
            </div>
            <Toggle
              checked={section.data.showLogoText ?? true}
              onChange={checked => updateData('showLogoText', checked)}
            />
          </div>

          {/* Logo Text */}
          {section.data.showLogoText !== false && (
            <div>
              <Label htmlFor="logo-text">Business Name</Label>
              <Input
                id="logo-text"
                value={section.data.logoText || ''}
                onChange={e => updateData('logoText', e.target.value)}
                placeholder="Your Business Name"
                className="mt-1"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Navigation Links */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Navigation Links</h3>
          <Button variant="ghost" size="sm" onClick={addLink}>
            <Plus className="w-4 h-4 mr-1" />
            Add Link
          </Button>
        </div>

        {section.data.links.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-2">No navigation links yet</p>
            <Button variant="ghost" size="sm" onClick={addLink}>
              <Plus className="w-4 h-4 mr-1" />
              Add your first link
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-600">Drag to reorder links</p>

            {section.data.links.map((link, index) => (
              <div
                key={link.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={e => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  group relative bg-gray-50 rounded-lg p-4 border border-gray-200
                  ${draggedIndex === index ? 'opacity-50' : 'opacity-100'}
                `}
              >
                <div className="flex items-start gap-3">
                  {/* Drag Handle */}
                  <div className="cursor-move pt-2">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                  </div>

                  {/* Link Fields */}
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`link-label-${index}`} className="text-xs">
                        Label
                      </Label>
                      <Input
                        id={`link-label-${index}`}
                        value={link.label}
                        onChange={e => updateLink(index, 'label', e.target.value)}
                        placeholder="Link text"
                        className="mt-1 text-sm"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`link-href-${index}`} className="text-xs">
                        URL / Anchor
                      </Label>
                      <Input
                        id={`link-href-${index}`}
                        value={link.href}
                        onChange={e => updateLink(index, 'href', e.target.value)}
                        placeholder="#section or https://..."
                        className="mt-1 text-sm"
                      />
                    </div>
                  </div>

                  {/* External Link Toggle */}
                  <div className="flex items-center gap-2 pt-6">
                    <button
                      type="button"
                      onClick={() => updateLink(index, 'isExternal', !link.isExternal)}
                      className={`p-2 rounded-lg transition-colors ${
                        link.isExternal
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                      title={link.isExternal ? 'External link' : 'Internal link'}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => removeLink(index)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove link"
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Use <code className="bg-blue-100 px-1 rounded">#about</code>{' '}
            for page sections, or full URLs for external links
          </p>
        </div>
      </Card>

      {/* Call to Action */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Call to Action Button</h3>

        <div className="space-y-4">
          {/* Show CTA Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Show CTA Button</Label>
              <p className="text-sm text-gray-500">Display a prominent action button</p>
            </div>
            <Toggle
              checked={section.data.showCta ?? true}
              onChange={checked => updateData('showCta', checked)}
            />
          </div>

          {section.data.showCta !== false && (
            <>
              <div>
                <Label htmlFor="cta-text">Button Text</Label>
                <Input
                  id="cta-text"
                  value={section.data.ctaText || ''}
                  onChange={e => updateData('ctaText', e.target.value)}
                  placeholder="e.g., Book Now"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="cta-link">Button Link</Label>
                <Input
                  id="cta-link"
                  value={section.data.ctaLink || ''}
                  onChange={e => updateData('ctaLink', e.target.value)}
                  placeholder="e.g., #contact or /booking"
                  className="mt-1"
                />
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Style Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Navbar Style</h3>

        <div className="space-y-4">
          {/* Style */}
          <div>
            <Label htmlFor="navbar-style">Background Style</Label>
            <Select
              id="navbar-style"
              value={section.data.style || 'solid'}
              onChange={e =>
                updateData('style', e.target.value as 'transparent' | 'solid' | 'gradient')
              }
              className="mt-1"
              options={[
                { value: 'solid', label: 'Solid' },
                { value: 'transparent', label: 'Transparent (becomes solid on scroll)' },
                { value: 'gradient', label: 'Gradient' },
              ]}
            />
          </div>

          {/* Background Color (for solid style) */}
          {section.data.style === 'solid' && (
            <ColorPicker
              label="Background Color"
              value={section.data.backgroundColor || '#ffffff'}
              onChange={color => updateData('backgroundColor', color)}
            />
          )}

          {/* Position */}
          <div>
            <Label htmlFor="navbar-position">Position</Label>
            <Select
              id="navbar-position"
              value={section.data.position || 'sticky'}
              onChange={e =>
                updateData('position', e.target.value as 'fixed' | 'sticky' | 'static')
              }
              className="mt-1"
              options={[
                { value: 'sticky', label: 'Sticky (stays at top when scrolling)' },
                { value: 'fixed', label: 'Fixed (always at top)' },
                { value: 'static', label: 'Static (scrolls with page)' },
              ]}
            />
          </div>

          {/* Text Color */}
          <div>
            <Label htmlFor="text-color">Text Color</Label>
            <Select
              id="text-color"
              value={section.data.textColor || 'dark'}
              onChange={e => updateData('textColor', e.target.value as 'light' | 'dark' | 'auto')}
              className="mt-1"
              options={[
                { value: 'dark', label: 'Dark' },
                { value: 'light', label: 'Light' },
              ]}
            />
            <p className="text-xs text-gray-500 mt-1">
              Use light text on dark/gradient backgrounds
            </p>
          </div>
        </div>
      </Card>

      {/* Tips */}
      <div className="space-y-3">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-800">
            ✨ <strong>Pro Tip:</strong> The transparent style works great with hero sections that
            have background images
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            🎨 <strong>Branding:</strong> Upload your logo and use your brand colors for a
            professional look
          </p>
        </div>
      </div>
    </div>
  )
}
