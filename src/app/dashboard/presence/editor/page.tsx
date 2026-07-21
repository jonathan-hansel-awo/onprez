'use client'

import { useState, useEffect, useRef } from 'react'
import { PresenceEditorLayout } from '@/components/presence/editor/PresenceEditorLayout'
import { PageSection } from '@/types/page-sections'

export default function PresenceEditorPage() {
  const [loading, setLoading] = useState(true)
  const [sections, setSections] = useState<PageSection[]>([])
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [pageId, setPageId] = useState<string | null>(null)
  const [businessSlug, setBusinessSlug] = useState<string | null>(null)
  const [isPublished, setIsPublished] = useState(false)
  const saveRequestRef = useRef<{
    fingerprint: string
    promise: Promise<{ success: boolean; error?: string }>
  } | null>(null)
  const publishRequestRef = useRef<Promise<{ success: boolean; error?: string }> | null>(null)

  useEffect(() => {
    loadPresencePage()
  }, [])

  async function loadPresencePage() {
    try {
      const businessRes = await fetch('/api/business/current')
      const businessData = await businessRes.json()

      if (businessData.success && businessData.data.business) {
        const business = businessData.data.business
        setBusinessId(business.id)
        setBusinessSlug(business.slug)

        // Load presence page
        const pageRes = await fetch(`/api/presence/pages?businessId=${business.id}&slug=home`)
        const pageData = await pageRes.json()

        if (pageData.success && pageData.data.pages.length > 0) {
          const page = pageData.data.pages[0]
          setPageId(page.id)
          setSections((page.content as PageSection[]) || [])
          setIsPublished(page.isPublished)
        }
      }
    } catch (error) {
      console.error('Failed to load presence page:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleSave(
    updatedSections: PageSection[]
  ): Promise<{ success: boolean; error?: string }> {
    if (!pageId || !businessId) {
      return Promise.resolve({
        success: false,
        error: 'The page is not ready yet. Refresh and try again.',
      })
    }

    const fingerprint = JSON.stringify(updatedSections)
    const activeSave = saveRequestRef.current

    if (activeSave?.fingerprint === fingerprint) return activeSave.promise
    if (activeSave) {
      return activeSave.promise.then(() => handleSave(updatedSections))
    }

    const request = (async () => {
      try {
        const response = await fetch('/api/presence/pages', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageId: pageId,
            businessId: businessId,
            content: updatedSections,
          }),
        })

        const data = await response.json()

        if (data.success) {
          setSections(updatedSections)
          return { success: true }
        }

        return {
          success: false,
          error: data.error || 'Changes were not saved. Your edits are still here—try again.',
        }
      } catch (error) {
        console.error('Failed to save:', error)
        return {
          success: false,
          error: 'Changes were not saved. Check your connection and try again.',
        }
      } finally {
        if (saveRequestRef.current?.fingerprint === fingerprint) {
          saveRequestRef.current = null
        }
      }
    })()

    saveRequestRef.current = { fingerprint, promise: request }
    return request
  }

  function handlePublish(isPublished: boolean) {
    if (!pageId || !businessId) {
      return Promise.resolve({
        success: false,
        error: 'The page is not ready yet. Refresh and try again.',
      })
    }

    if (publishRequestRef.current) return publishRequestRef.current

    const request = (async () => {
      try {
        const response = await fetch('/api/presence/pages/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageId: pageId,
            businessId: businessId,
            isPublished: isPublished,
          }),
        })

        const data = await response.json()
        if (data.success) return data

        return {
          success: false,
          error:
            data.error ||
            `The page was not ${isPublished ? 'published' : 'unpublished'}. Try again.`,
        }
      } catch (error) {
        console.error('Failed to publish:', error)
        return {
          success: false,
          error: `The page was not ${isPublished ? 'published' : 'unpublished'}. Check your connection and try again.`,
        }
      } finally {
        publishRequestRef.current = null
      }
    })()

    publishRequestRef.current = request
    return request
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-onprez-blue" />
      </div>
    )
  }

  return (
    <PresenceEditorLayout
      sections={sections}
      onSave={handleSave}
      onPublish={handlePublish}
      businessId={businessId}
      businessSlug={businessSlug}
      initialPublishStatus={isPublished}
    />
  )
}
