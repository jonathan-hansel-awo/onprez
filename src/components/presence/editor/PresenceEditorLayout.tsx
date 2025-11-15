/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { PageSection } from '@/types/page-sections'
import { Button } from '@/components/ui/button'
import { SectionList } from './SectionList'
import { PresencePreview } from './PresencePreview'
import { Save, Eye, EyeOff, Monitor, Smartphone } from 'lucide-react'
import { motion } from 'framer-motion'

interface PresenceEditorLayoutProps {
  sections: PageSection[]
  onSave: (sections: PageSection[]) => Promise<{ success: boolean; error?: string }>
  onPublish: (isPublished: boolean) => Promise<any>
  businessId: string | null
}

export function PresenceEditorLayout({
  sections: initialSections,
  onSave,
  onPublish,
  businessId,
}: PresenceEditorLayoutProps) {
  const [sections, setSections] = useState<PageSection[]>(initialSections)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [showPreview, setShowPreview] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setSaveMessage(null)

    const result = await onSave(sections)

    if (result.success) {
      setSaveMessage('Saved successfully!')
      setTimeout(() => setSaveMessage(null), 3000)
    } else {
      setSaveMessage(result.error || 'Failed to save')
    }

    setSaving(false)
  }

  async function handlePublish() {
    setPublishing(true)

    const result = await onPublish(true)

    if (result.success) {
      alert('Page published successfully!')
    } else {
      alert(result.error || 'Failed to publish')
    }

    setPublishing(false)
  }

  function handleSectionUpdate(updatedSection: PageSection) {
    setSections(prev =>
      prev.map(section => (section.id === updatedSection.id ? updatedSection : section))
    )
  }

  function handleSectionDelete(sectionId: string) {
    setSections(prev => prev.filter(section => section.id !== sectionId))
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null)
    }
  }

  function handleSectionReorder(reorderedSections: PageSection[]) {
    setSections(reorderedSections)
  }

  function handleSectionAdd(newSection: PageSection) {
    setSections(prev => [...prev, newSection])
  }

  return (
    <div className="fixed inset-0 top-16 bg-gray-50">
      {/* Top Toolbar */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Edit Presence</h2>
          {saveMessage && (
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-green-600"
            >
              {saveMessage}
            </motion.span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Preview Toggle */}
          <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>

          {/* Device Toggle */}
          {showPreview && (
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`p-2 rounded ${
                  previewMode === 'desktop' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`p-2 rounded ${
                  previewMode === 'mobile' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Save & Publish */}
          <Button variant="ghost" onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>

          <Button variant="primary" onClick={handlePublish} disabled={publishing}>
            {publishing ? 'Publishing...' : 'Publish'}
          </Button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex h-[calc(100vh-8rem)]">
        {/* Section List Sidebar */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          <SectionList
            sections={sections}
            selectedSectionId={selectedSectionId}
            onSectionSelect={setSelectedSectionId}
            onSectionUpdate={handleSectionUpdate}
            onSectionDelete={handleSectionDelete}
            onSectionReorder={handleSectionReorder}
            onSectionAdd={handleSectionAdd}
            businessId={businessId}
          />
        </div>

        {/* Preview Area */}
        {showPreview && (
          <div className="flex-1 overflow-y-auto bg-gray-100 p-8">
            <PresencePreview
              sections={sections}
              previewMode={previewMode}
              businessId={businessId}
            />
          </div>
        )}
      </div>
    </div>
  )
}
