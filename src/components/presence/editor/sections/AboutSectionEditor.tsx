/* eslint-disable react/no-unescaped-entities */
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

interface AboutSectionEditorProps {
  section: AboutSection
  onUpdate: (section: AboutSection) => void
}

export function AboutSectionEditor({ section, onUpdate }: AboutSectionEditorProps) {
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

    let wrappedText = ''

    switch (tag) {
      case 'b':
        wrappedText = `<strong>${selectedText || 'bold text'}</strong>`
        break
      case 'i':
        wrappedText = `<em>${selectedText || 'italic text'}</em>`
        break
      case 'ul':
        wrappedText = `<ul>\n  <li>${selectedText || 'list item'}</li>\n</ul>`
        break
      case 'ol':
        wrappedText = `<ol>\n  <li>${selectedText || 'list item'}</li>\n</ol>`
        break
      case 'a':
        wrappedText = `<a href="https://example.com">${selectedText || 'link text'}</a>`
        break
      case 'p':
        wrappedText = `<p>${selectedText || 'paragraph text'}</p>`
        break
      default:
        return
    }

    const newContent =
      section.data.content.substring(0, start) + wrappedText + section.data.content.substring(end)

    updateData('content', newContent)

    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + wrappedText.length, start + wrappedText.length)
    }, 0)
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">About Content</h3>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="about-title">Section Title *</Label>
            <Input
              id="about-title"
              value={section.data.title}
              onChange={e => updateData('title', e.target.value)}
              placeholder="e.g., About Me, Our Story"
              className="mt-1"
            />
          </div>

          {/* Content with Basic Formatting */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="about-content">Content *</Label>
              <button
                onClick={() => setIsRichTextMode(!isRichTextMode)}
                className="text-xs text-onprez-blue hover:underline"
                type="button"
              >
                {isRichTextMode ? 'Hide formatting tools' : 'Show formatting tools'}
              </button>
            </div>

            {/* Rich Text Toolbar */}
            {isRichTextMode && (
              <div className="flex items-center gap-1 p-2 bg-gray-50 border border-gray-200 rounded-t-lg">
                <button
                  type="button"
                  onClick={() => insertHtmlTag('p')}
                  className="p-2 hover:bg-gray-200 rounded transition-colors"
                  title="Paragraph"
                >
                  <span className="text-sm font-medium">P</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertHtmlTag('b')}
                  className="p-2 hover:bg-gray-200 rounded transition-colors"
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertHtmlTag('i')}
                  className="p-2 hover:bg-gray-200 rounded transition-colors"
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-gray-300 mx-1" />
                <button
                  type="button"
                  onClick={() => insertHtmlTag('ul')}
                  className="p-2 hover:bg-gray-200 rounded transition-colors"
                  title="Bullet List"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertHtmlTag('ol')}
                  className="p-2 hover:bg-gray-200 rounded transition-colors"
                  title="Numbered List"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-gray-300 mx-1" />
                <button
                  type="button"
                  onClick={() => insertHtmlTag('a')}
                  className="p-2 hover:bg-gray-200 rounded transition-colors"
                  title="Link"
                >
                  <LinkIcon className="w-4 h-4" />
                </button>
              </div>
            )}

            <TextArea
              id="about-content"
              value={section.data.content}
              onChange={e => updateData('content', e.target.value)}
              placeholder="Tell your story... You can use HTML for formatting."
              rows={12}
              className={`mt-0 font-mono text-sm ${isRichTextMode ? 'rounded-t-none' : ''}`}
            />
            <p className="text-xs text-gray-500 mt-2">
              💡 Tip: Use HTML tags for formatting. Select text and use the toolbar buttons above,
              or write HTML directly.
            </p>
          </div>

          {/* Live Preview Toggle */}
          {section.data.content && (
            <details className="mt-4 bg-gray-50 rounded-lg p-4">
              <summary className="cursor-pointer font-medium text-sm text-gray-700">
                Preview formatted content
              </summary>
              <div className="mt-4 p-4 bg-white rounded border border-gray-200">
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.data.content) }}
                />
              </div>
            </details>
          )}

          {/* Quick HTML Reference */}
          {isRichTextMode && (
            <details className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">
              <summary className="cursor-pointer font-medium">HTML Quick Reference</summary>
              <div className="mt-2 space-y-1">
                <p>
                  <code className="bg-gray-200 px-1 rounded">&lt;p&gt;...&lt;/p&gt;</code> -
                  Paragraph
                </p>
                <p>
                  <code className="bg-gray-200 px-1 rounded">&lt;strong&gt;...&lt;/strong&gt;</code>{' '}
                  - Bold text
                </p>
                <p>
                  <code className="bg-gray-200 px-1 rounded">&lt;em&gt;...&lt;/em&gt;</code> -
                  Italic text
                </p>
                <p>
                  <code className="bg-gray-200 px-1 rounded">
                    &lt;ul&gt;&lt;li&gt;...&lt;/li&gt;&lt;/ul&gt;
                  </code>{' '}
                  - Bullet list
                </p>
                <p>
                  <code className="bg-gray-200 px-1 rounded">
                    &lt;ol&gt;&lt;li&gt;...&lt;/li&gt;&lt;/ol&gt;
                  </code>{' '}
                  - Numbered list
                </p>
                <p>
                  <code className="bg-gray-200 px-1 rounded">
                    &lt;a href="url"&gt;...&lt;/a&gt;
                  </code>{' '}
                  - Link
                </p>
                <p>
                  <code className="bg-gray-200 px-1 rounded">&lt;br&gt;</code> - Line break
                </p>
              </div>
            </details>
          )}
        </div>
      </Card>

      {/* Image */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Image</h3>

        <div className="space-y-4">
          {/* Image Upload */}
          <div>
            <Label className="mb-2">Section Image</Label>
            <ImageUpload
              value={section.data.image}
              onChange={url => updateData('image', url)}
              onRemove={() => updateData('image', undefined)}
            />
            <p className="text-xs text-gray-500 mt-2">
              Upload an image to accompany your about section
            </p>
          </div>

          {/* Image Position */}
          {section.data.image && (
            <div>
              <Label htmlFor="about-image-position">Image Position</Label>
              <Select
                id="about-image-position"
                value={section.data.imagePosition || 'right'}
                onChange={e => updateData('imagePosition', e.target.value as 'left' | 'right')}
                className="mt-1"
                options={[
                  { value: 'left', label: 'Left' },
                  { value: 'right', label: 'Right' },
                ]}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Preview Tip */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> The preview shows how your content will appear with the HTML
          formatting applied
        </p>
      </div>
    </div>
  )
}
