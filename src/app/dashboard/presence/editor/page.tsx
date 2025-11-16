'use client'

import { useState, useEffect } from 'react'
import { PresenceEditorLayout } from '@/components/presence/editor/PresenceEditorLayout'
import { PageSection } from '@/types/page-sections'

export default function PresenceEditorPage() {
  const [loading, setLoading] = useState(true)
  const [sections, setSections] = useState<PageSection[]>([])
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [pageId, setPageId] = useState<string | null>(null)
  const [businessSlug, setBusinessSlug] = useState<string | null>(null)

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
        }
      }
    } catch (error) {
      console.error('Failed to load presence page:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(updatedSections: PageSection[]) {
    if (!pageId || !businessId) return { success: false, error: 'Missing pageId or businessId' }

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
      } else {
        return { success: false, error: data.error || 'Failed to save' }
      }
    } catch (error) {
      console.error('Failed to save:', error)
      return { success: false, error: 'Failed to save changes' }
    }
  }

  async function handlePublish(isPublished: boolean) {
    if (!pageId || !businessId) return

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
      return data
    } catch (error) {
      console.error('Failed to publish:', error)
      return { success: false, error: 'Failed to publish page' }
    }
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
    />
  )
}
