'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { PresenceEditorLayout } from '@/components/presence/editor/PresenceEditorLayout'
import type { PageSection } from '@/types/page-sections'

type AdminMutationResult = { success: boolean; error?: string }

export function AdminPresenceEditor({
  businessId,
  businessName,
  businessSlug,
  pageId,
  initialSections,
  initialPublishStatus,
}: {
  businessId: string
  businessName: string
  businessSlug: string
  pageId: string
  initialSections: PageSection[]
  initialPublishStatus: boolean
}) {
  const [sections, setSections] = useState(initialSections)
  const saveRequestRef = useRef<{
    fingerprint: string
    promise: Promise<AdminMutationResult>
  } | null>(null)
  const publishRequestRef = useRef<Promise<AdminMutationResult> | null>(null)

  function handleSave(updatedSections: PageSection[]): Promise<AdminMutationResult> {
    const fingerprint = JSON.stringify(updatedSections)
    const activeSave = saveRequestRef.current

    if (activeSave?.fingerprint === fingerprint) return activeSave.promise
    if (activeSave) return activeSave.promise.then(() => handleSave(updatedSections))

    const request: Promise<AdminMutationResult> = (async () => {
      try {
        const response = await fetch(`/api/admin/businesses/${businessId}/presence`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageId, content: updatedSections }),
        })
        const result = await response.json()

        if (!response.ok || !result.success) {
          return { success: false, error: result.error || 'Failed to save the customer draft.' }
        }

        setSections(updatedSections)
        return { success: true }
      } catch {
        return { success: false, error: 'Failed to save the customer draft.' }
      } finally {
        if (saveRequestRef.current?.fingerprint === fingerprint) {
          saveRequestRef.current = null
        }
      }
    })()

    saveRequestRef.current = { fingerprint, promise: request }
    return request
  }

  function handlePublish(isPublished: boolean): Promise<AdminMutationResult> {
    if (publishRequestRef.current) return publishRequestRef.current

    const request: Promise<AdminMutationResult> = (async () => {
      try {
        const response = await fetch(`/api/admin/businesses/${businessId}/presence/publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageId, isPublished }),
        })
        const result = await response.json()

        if (!response.ok || !result.success) {
          return {
            success: false,
            error: result.error || `Failed to ${isPublished ? 'publish' : 'unpublish'} the page.`,
          }
        }

        return { success: true }
      } catch {
        return {
          success: false,
          error: `Failed to ${isPublished ? 'publish' : 'unpublish'} the page.`,
        }
      } finally {
        publishRequestRef.current = null
      }
    })()

    publishRequestRef.current = request
    return request
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href={`/admin/businesses/${businessId}`}
            className="text-sm font-medium text-blue-600"
          >
            ← Back to assisted setup
          </Link>
          <h1 className="mt-2 text-xl font-semibold">Editing {businessName}</h1>
          <p className="text-sm text-slate-500">
            Changes are made as platform admin and recorded in the security log.
          </p>
        </div>
        {initialPublishStatus ? (
          <Link
            href={`/${businessSlug}`}
            target="_blank"
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
          >
            View live page
          </Link>
        ) : null}
      </div>

      <PresenceEditorLayout
        sections={sections}
        onSave={handleSave}
        onPublish={handlePublish}
        businessId={businessId}
        businessSlug={businessSlug}
        initialPublishStatus={initialPublishStatus}
      />
    </div>
  )
}
