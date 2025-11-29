/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageSection } from '@/types/page-sections'
import { Button } from '@/components/ui/button'
import { SectionList } from './SectionList'
import { PresencePreview } from './PresencePreview'
import {
  Save,
  Eye,
  EyeOff,
  Monitor,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Globe,
  GlobeIcon,
  FileText,
  Sparkles,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ThemeCustomizer } from './ThemeCustomizer'
import { debounce } from '@/lib/utils/debounce'
import { Confetti } from '@/components/effects/confetti'

interface PresenceEditorLayoutProps {
  sections: PageSection[]
  onSave: (sections: PageSection[]) => Promise<{ success: boolean; error?: string }>
  onPublish: (isPublished: boolean) => Promise<any>
  businessId: string | null
  businessSlug?: string | null
  initialPublishStatus?: boolean
}

export function PresenceEditorLayout({
  sections: initialSections,
  onSave,
  onPublish,
  businessId,
  businessSlug,
  initialPublishStatus = false,
}: PresenceEditorLayoutProps) {
  const [sections, setSections] = useState<PageSection[]>(initialSections)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [showPreview, setShowPreview] = useState(true)
  const [saving, setSaving] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [isPublished, setIsPublished] = useState(initialPublishStatus)
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [activeTab, setActiveTab] = useState<'sections' | 'theme'>('sections')
  const [themeVersion, setThemeVersion] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)

  // Track changes
  useEffect(() => {
    if (JSON.stringify(sections) !== JSON.stringify(initialSections)) {
      setHasUnsavedChanges(true)
    }
  }, [sections, initialSections])

  // Debounced auto-save function
  const debouncedAutoSave = useCallback(
    debounce(async (sectionsToSave: PageSection[]) => {
      setAutoSaving(true)
      const result = await onSave(sectionsToSave)

      if (result.success) {
        setHasUnsavedChanges(false)
        showSaveMessage('success', 'Draft saved')
      } else {
        showSaveMessage('error', 'Auto-save failed')
      }

      setAutoSaving(false)
    }, 2000),
    [onSave]
  )

  // Auto-save when sections change
  useEffect(() => {
    if (hasUnsavedChanges && businessId) {
      debouncedAutoSave(sections)
    }
  }, [sections, hasUnsavedChanges, businessId, debouncedAutoSave])

  function showSaveMessage(type: 'success' | 'error', text: string) {
    setSaveMessage({ type, text })
    setTimeout(() => setSaveMessage(null), 3000)
  }

  async function handleSave() {
    setSaving(true)
    setSaveMessage(null)

    const result = await onSave(sections)

    if (result.success) {
      setHasUnsavedChanges(false)
      showSaveMessage('success', 'Saved successfully!')
    } else {
      showSaveMessage('error', result.error || 'Failed to save')
    }

    setSaving(false)
  }

  async function handlePublish() {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Save before publishing?')) {
        return
      }
      await handleSave()
    }

    setPublishing(true)

    const result = await onPublish(true)

    if (result.success) {
      setIsPublished(true)
      setShowConfetti(true)
      showSaveMessage('success', 'Page published successfully! 🎉')

      // Hide confetti after 3 seconds
      setTimeout(() => setShowConfetti(false), 3000)
    } else {
      showSaveMessage('error', result.error || 'Failed to publish')
    }

    setPublishing(false)
  }

  async function handleUnpublish() {
    if (
      !confirm(
        'Are you sure you want to unpublish this page? It will no longer be visible to visitors.'
      )
    ) {
      return
    }

    setPublishing(true)

    const result = await onPublish(false)

    if (result.success) {
      setIsPublished(false)
      showSaveMessage('success', 'Page unpublished')
    } else {
      showSaveMessage('error', result.error || 'Failed to unpublish')
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

  function handleThemeUpdate(theme: any) {
    setThemeVersion(prev => prev + 1)
  }

  return (
    <div className="fixed inset-0 top-16 bg-gray-50">
      {/* Confetti Effect */}
      <Confetti active={showConfetti} />

      {/* Top Toolbar */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 relative z-10">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Edit Presence</h2>

          {/* Status Indicators */}
          <div className="flex items-center gap-3">
            {/* Publish Status Badge */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                isPublished
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-300'
              }`}
            >
              {isPublished ? (
                <>
                  <Globe className="w-3 h-3" />
                  <span>Published</span>
                </>
              ) : (
                <>
                  <FileText className="w-3 h-3" />
                  <span>Draft</span>
                </>
              )}
            </div>

            {/* Unsaved Changes */}
            {hasUnsavedChanges && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-300"
              >
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                <span>Unsaved changes</span>
              </motion.div>
            )}

            {/* Auto-saving */}
            {autoSaving && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full"
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span>Saving...</span>
              </motion.div>
            )}

            {/* Save Message */}
            <AnimatePresence>
              {saveMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex items-center gap-2 text-sm ${
                    saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {saveMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <span>{saveMessage.text}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
                className={`p-2 rounded transition-all ${
                  previewMode === 'desktop'
                    ? 'bg-white shadow-sm text-onprez-blue'
                    : 'hover:bg-gray-200 text-gray-600'
                }`}
                title="Desktop preview"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`p-2 rounded transition-all ${
                  previewMode === 'mobile'
                    ? 'bg-white shadow-sm text-onprez-blue'
                    : 'hover:bg-gray-200 text-gray-600'
                }`}
                title="Mobile preview"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Save Draft */}
          <Button variant="ghost" onClick={handleSave} disabled={saving || autoSaving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>

          {/* Publish/Unpublish */}
          {isPublished ? (
            <Button
              variant="outline"
              onClick={handleUnpublish}
              disabled={publishing}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <GlobeIcon className="w-4 h-4 mr-2" />
              {publishing ? 'Unpublishing...' : 'Unpublish'}
            </Button>
          ) : (
            <Button variant="primary" onClick={handlePublish} disabled={publishing}>
              <Sparkles className="w-4 h-4 mr-2" />
              {publishing ? 'Publishing...' : 'Publish'}
            </Button>
          )}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex h-[calc(100vh-8rem)]">
        {/* Section List Sidebar */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('sections')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'sections'
                  ? 'text-onprez-blue border-b-2 border-onprez-blue'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sections
            </button>
            <button
              onClick={() => setActiveTab('theme')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'theme'
                  ? 'text-onprez-blue border-b-2 border-onprez-blue'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Theme
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activeTab === 'sections' ? (
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
            ) : (
              <div className="p-4">
                <ThemeCustomizer businessId={businessId || ''} onUpdate={handleThemeUpdate} />
              </div>
            )}
          </div>
        </div>

        {/* Preview Area */}
        {showPreview && (
          <div className="flex-1 overflow-hidden">
            <PresencePreview
              sections={sections}
              previewMode={previewMode}
              businessId={businessId}
              businessSlug={businessSlug}
              themeVersion={themeVersion}
            />
          </div>
        )}

        {/* Full Width Editor (when preview hidden) */}
        {!showPreview && (
          <div className="flex-1 flex items-center justify-center bg-gray-100">
            <div className="text-center text-gray-500">
              <Eye className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium">Preview Hidden</p>
              <p className="text-sm mt-2">Click "Show Preview" to see your changes</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
