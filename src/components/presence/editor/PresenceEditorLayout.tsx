/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */

/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageSection } from '@/types/page-sections'
import { materializePremiumTemplateSections } from '@/lib/templates/premium-runtime-art-direction'
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
import { Confetti } from '@/components/animations/confetti'

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
  const [sections, setSections] = useState<PageSection[]>(() =>
    materializePremiumTemplateSections(initialSections)
  )
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
  const [mobilePane, setMobilePane] = useState<'editor' | 'preview'>('editor')

  useEffect(() => {
    if (JSON.stringify(sections) !== JSON.stringify(initialSections)) {
      setHasUnsavedChanges(true)
    }
  }, [sections, initialSections])

  const debouncedAutoSave = useCallback(
    debounce(async (sectionsToSave: PageSection[]) => {
      setAutoSaving(true)
      const result = await onSave(sectionsToSave)

      if (result.success) {
        setHasUnsavedChanges(false)
        showSaveMessage('success', 'Draft saved')
      } else {
        showSaveMessage('error', 'Auto-save failed. Your edits are still here—use Save to retry.')
      }

      setAutoSaving(false)
    }, 2000),
    [onSave]
  )

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
      const saveResult = await onSave(sections)
      if (!saveResult.success) {
        showSaveMessage(
          'error',
          saveResult.error || 'Changes were not saved. Use Save to retry before publishing.'
        )
        return
      }
      setHasUnsavedChanges(false)
    }

    setPublishing(true)

    const result = await onPublish(true)

    if (result.success) {
      setIsPublished(true)
      setShowConfetti(true)
      showSaveMessage('success', 'Page published successfully! 🎉')

      setTimeout(() => setShowConfetti(false), 3000)
    } else {
      showSaveMessage(
        'error',
        result.error || 'The page was not published. Your draft is safe—try again.'
      )
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
      showSaveMessage('error', result.error || 'The page is still live. Try unpublishing again.')
    }

    setPublishing(false)
  }

  function handleSectionUpdate(updatedSection: PageSection) {
    setSections(previousSections =>
      previousSections.map(section => (section.id === updatedSection.id ? updatedSection : section))
    )
  }

  function handleSectionDelete(sectionId: string) {
    setSections(previousSections => previousSections.filter(section => section.id !== sectionId))
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null)
    }
  }

  function handleSectionReorder(reorderedSections: PageSection[]) {
    setSections(reorderedSections)
  }

  function handleSectionAdd(newSection: PageSection) {
    setSections(previousSections => [...previousSections, newSection])
  }

  function handleThemeUpdate(theme: any) {
    setThemeVersion(previousVersion => previousVersion + 1)
  }

  return (
    <div className="fixed inset-x-0 bottom-0 top-16 flex flex-col overflow-hidden bg-gray-50">
      <Confetti active={showConfetti} />

      <div className="relative z-10 shrink-0 border-b border-gray-200 bg-white px-3 py-2 sm:px-6 lg:flex lg:min-h-16 lg:items-center lg:justify-between lg:py-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Edit Presence</h2>

          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
            <div
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
                isPublished
                  ? 'border-green-300 bg-green-100 text-green-700'
                  : 'border-gray-300 bg-gray-100 text-gray-600'
              }`}
            >
              {isPublished ? (
                <>
                  <Globe className="h-3 w-3" />
                  <span>Published</span>
                </>
              ) : (
                <>
                  <FileText className="h-3 w-3" />
                  <span>Draft</span>
                </>
              )}
            </div>

            {hasUnsavedChanges && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs text-amber-600"
              >
                <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                <span>Unsaved changes</span>
              </motion.div>
            )}

            {autoSaving && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs text-blue-600"
              >
                <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                <span>Saving...</span>
              </motion.div>
            )}

            <AnimatePresence>
              {saveMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  role={saveMessage.type === 'success' ? 'status' : 'alert'}
                  aria-live={saveMessage.type === 'success' ? 'polite' : 'assertive'}
                  className={`flex items-center gap-2 text-sm ${
                    saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {saveMessage.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span>{saveMessage.text}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 lg:mt-0 lg:justify-end lg:gap-3">
          <div className="grid min-w-40 flex-1 grid-cols-2 rounded-lg bg-gray-100 p-1 md:hidden">
            <button
              type="button"
              onClick={() => setMobilePane('editor')}
              className={`min-h-11 rounded-md px-3 text-sm font-semibold transition-colors ${
                mobilePane === 'editor' ? 'bg-white text-onprez-blue shadow-sm' : 'text-gray-600'
              }`}
              aria-pressed={mobilePane === 'editor'}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                setShowPreview(true)
                setPreviewMode('mobile')
                setMobilePane('preview')
              }}
              className={`min-h-11 rounded-md px-3 text-sm font-semibold transition-colors ${
                mobilePane === 'preview' ? 'bg-white text-onprez-blue shadow-sm' : 'text-gray-600'
              }`}
              aria-pressed={mobilePane === 'preview'}
            >
              Preview
            </button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="hidden min-h-11 md:inline-flex md:items-center"
          >
            {showPreview ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>

          {showPreview && (
            <div className="hidden gap-1 rounded-lg bg-gray-100 p-1 md:flex">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`min-h-11 min-w-11 rounded p-2 transition-all ${
                  previewMode === 'desktop'
                    ? 'bg-white text-onprez-blue shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
                title="Desktop preview"
              >
                <Monitor className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`min-h-11 min-w-11 rounded p-2 transition-all ${
                  previewMode === 'mobile'
                    ? 'bg-white text-onprez-blue shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
                title="Mobile preview"
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </div>
          )}

          <Button
            variant="ghost"
            onClick={handleSave}
            disabled={saving || autoSaving || publishing}
            aria-busy={saving || autoSaving}
            className="min-h-11 px-3 sm:px-4"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save'}
          </Button>

          {isPublished ? (
            <Button
              variant="outline"
              onClick={handleUnpublish}
              disabled={publishing || saving || autoSaving}
              aria-busy={publishing}
              className="min-h-11 border-red-300 px-3 text-red-600 hover:bg-red-50 sm:px-4"
            >
              <GlobeIcon className="mr-2 h-4 w-4" />
              {publishing ? 'Unpublishing...' : 'Unpublish'}
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handlePublish}
              disabled={publishing || saving || autoSaving}
              aria-busy={publishing}
              className="min-h-11 px-3 sm:px-4"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {publishing ? 'Publishing...' : 'Publish'}
            </Button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div
          className={`${mobilePane === 'editor' ? 'flex' : 'hidden'} w-full flex-col overflow-hidden border-r border-gray-200 bg-white md:flex md:w-96`}
        >
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('sections')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'sections'
                  ? 'border-b-2 border-onprez-blue text-onprez-blue'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sections
            </button>
            <button
              onClick={() => setActiveTab('theme')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'theme'
                  ? 'border-b-2 border-onprez-blue text-onprez-blue'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Theme
            </button>
          </div>

          <div className="custom-scrollbar flex-1 overflow-y-auto">
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

        {showPreview && (
          <div
            className={`${mobilePane === 'preview' ? 'block' : 'hidden'} min-w-0 flex-1 overflow-hidden md:block`}
          >
            <PresencePreview
              sections={sections}
              previewMode={previewMode}
              businessId={businessId}
              businessSlug={businessSlug}
              themeVersion={themeVersion}
            />
          </div>
        )}

        {!showPreview && (
          <div className="flex flex-1 items-center justify-center bg-gray-100">
            <div className="text-center text-gray-500">
              <Eye className="mx-auto mb-3 h-12 w-12 text-gray-400" />
              <p className="text-lg font-medium">Preview Hidden</p>
              <p className="mt-2 text-sm">Click “Show Preview” to see your changes</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
