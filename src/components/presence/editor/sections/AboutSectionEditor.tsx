'use client'

import { AboutSection } from '@/types/page-sections'
import { Input } from '@/components/form/input'
import { TextArea } from '@/components/form/text-area'
import { Select } from '@/components/form/select'
import { ImageUpload } from '@/components/ui/image-upload'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/form/label'
import { sanitizeHtml } from '@/lib/utils/sanitize-html'
import { useState } from 'react'
import { Bold, Italic, List, ListOrdered, Link as LinkIcon } from 'lucide-react'
import { SectionAppearanceEditor } from '../SectionAppearanceEditor'

interface AboutSectionEditorProps {
  section: AboutSection
  onUpdate: (section: AboutSection) => void
  businessId: string | null
}

export function AboutSectionEditor({ section, onUpdate, businessId }: AboutSectionEditorProps) {
  const [isRichTextMode, setIsRichTextMode] = useState(false)

  function updateData<K extends keyof AboutSection['data']>(
    field: K,
    value: AboutSection['data'][K]
  ) {
    onUpdate({
      ...section,
      data: {
        ...section.data,
        [field]: value,
      },
    })
  }

  function insertHtmlTag(tag: string) {
    const textarea = document.getElementById('about-content') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = section.data.content.substring(start, end)

    const wrappers: Record<string, string> = {
      p: `<p>${selectedText || 'paragraph text'}</p>`,
      b: `<strong>${selectedText || 'bold text'}</strong>`,
      i: `<em>${selectedText || 'italic text'}</em>`,
      ul: `<ul>\n  <li>${selectedText || 'list item'}</li>\n</ul>`,
      ol: `<ol>\n  <li>${selectedText || 'list item'}</li>\n</ol>`,
      a: `<a href="https://example.com">${selectedText || 'link text'}</a>`,
    }

    const wrappedText = wrappers[tag]
    if (!wrappedText) return

    updateData(
      'content',
      section.data.content.substring(0, start) + wrappedText + section.data.content.substring(end)
    )

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + wrappedText.length, start + wrappedText.length)
    }, 0)
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">About Composition</h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="about-layout">Layout Preset</Label>
            <Select
              id="about-layout"
              value={section.data.layout || 'split'}
              onChange={event =>
                updateData('layout', event.target.value as 'split' | 'editorial' | 'centered')
              }
              className="mt-1"
              options={[
                { value: 'split', label: 'Split — image and story' },
                { value: 'editorial', label: 'Editorial — statement and portrait' },
                { value: 'centered', label: 'Centred — text-led' },
              ]}
            />
          </div>

          <div>
            <Label htmlFor="about-eyebrow">Eyebrow / Section Label</Label>
            <Input
              id="about-eyebrow"
              value={section.data.eyebrow || ''}
              onChange={event => updateData('eyebrow', event.target.value)}
              placeholder="e.g., The artist behind the chair"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="about-title">Section Title *</Label>
            <Input
              id="about-title"
              value={section.data.title}
              onChange={event => updateData('title', event.target.value)}
              placeholder="e.g., About Me, Our Story"
              className="mt-1"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label htmlFor="about-content">Content *</Label>
              <button
                onClick={() => setIsRichTextMode(!isRichTextMode)}
                className="text-xs text-onprez-blue hover:underline"
                type="button"
              >
                {isRichTextMode ? 'Hide formatting tools' : 'Show formatting tools'}
              </button>
            </div>

            {isRichTextMode && (
              <div className="flex items-center gap-1 rounded-t-lg border border-gray-200 bg-gray-50 p-2">
                {[
                  { tag: 'p', label: 'P', icon: null },
                  { tag: 'b', label: 'Bold', icon: <Bold className="h-4 w-4" /> },
                  { tag: 'i', label: 'Italic', icon: <Italic className="h-4 w-4" /> },
                  { tag: 'ul', label: 'Bulleted list', icon: <List className="h-4 w-4" /> },
                  {
                    tag: 'ol',
                    label: 'Numbered list',
                    icon: <ListOrdered className="h-4 w-4" />,
                  },
                  { tag: 'a', label: 'Link', icon: <LinkIcon className="h-4 w-4" /> },
                ].map(item => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => insertHtmlTag(item.tag)}
                    className="rounded p-2 transition-colors hover:bg-gray-200"
                    title={item.label}
                    aria-label={item.label}
                  >
                    {item.icon || <span className="text-sm font-medium">P</span>}
                  </button>
                ))}
              </div>
            )}

            <TextArea
              id="about-content"
              value={section.data.content}
              onChange={event => updateData('content', event.target.value)}
              placeholder="Tell your story... You can use simple HTML for formatting."
              rows={12}
              className={`mt-0 font-mono text-sm ${isRichTextMode ? 'rounded-t-none' : ''}`}
            />

            {section.data.content && (
              <details className="mt-4 rounded-lg bg-gray-50 p-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-700">
                  Preview formatted content
                </summary>
                <div className="mt-4 rounded border border-gray-200 bg-white p-4">
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.data.content) }}
                  />
                </div>
              </details>
            )}
          </div>

          <div>
            <Label htmlFor="about-highlights">Credentials / Highlights</Label>
            <TextArea
              id="about-highlights"
              value={(section.data.highlights || []).join('\n')}
              onChange={event =>
                updateData(
                  'highlights',
                  event.target.value
                    .split('\n')
                    .map(item => item.trim())
                    .filter(Boolean)
                )
              }
              placeholder={
                'Award-winning colourist\n10+ years experience\nInclusive texture specialist'
              }
              rows={5}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-gray-500">Add one trust-building highlight per line.</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">About Image</h3>

        <div className="space-y-4">
          <div>
            <Label className="mb-2">Section Image</Label>
            <ImageUpload
              businessId={businessId}
              purpose="gallery"
              value={section.data.image}
              onChange={url => updateData('image', url)}
              onRemove={() => updateData('image', undefined)}
            />
          </div>

          {section.data.image && section.data.layout !== 'centered' && (
            <>
              <div>
                <Label htmlFor="about-image-position">Image Position</Label>
                <Select
                  id="about-image-position"
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

              <div>
                <Label htmlFor="about-image-shape">Image Shape</Label>
                <Select
                  id="about-image-shape"
                  value={section.data.imageShape || 'portrait'}
                  onChange={event =>
                    updateData(
                      'imageShape',
                      event.target.value as 'portrait' | 'landscape' | 'square'
                    )
                  }
                  className="mt-1"
                  options={[
                    { value: 'portrait', label: 'Portrait' },
                    { value: 'landscape', label: 'Landscape' },
                    { value: 'square', label: 'Square' },
                  ]}
                />
              </div>
            </>
          )}
        </div>
      </Card>

      <SectionAppearanceEditor
        appearance={section.appearance}
        onChange={appearance => onUpdate({ ...section, appearance })}
      />
    </div>
  )
}
