'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, Globe, LayoutTemplate, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ActionFeedback } from '@/components/ui/action-feedback'
import { TemplateSelector } from '@/components/presence/TemplateSelector'
import { TemplatePreviewModal } from '@/components/presence/TemplatePreviewModal'
import type { PresenceTemplate } from '@/types/templates'

export default function PresencePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [hasPresence, setHasPresence] = useState(false)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessSlug, setBusinessSlug] = useState<string | null>(null)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<PresenceTemplate | null>(null)
  const [applyingTemplate, setApplyingTemplate] = useState(false)
  const [templateError, setTemplateError] = useState('')
  const applyingTemplateRef = useRef(false)

  useEffect(() => {
    void checkPresenceStatus()
  }, [])

  async function checkPresenceStatus() {
    try {
      const businessRes = await fetch('/api/business/current')
      const businessData = await businessRes.json()

      if (businessData.success && businessData.data.business) {
        const business = businessData.data.business
        setBusinessId(business.id)
        setBusinessSlug(business.slug)

        const pageRes = await fetch(`/api/presence/pages?businessId=${business.id}`)
        const pageData = await pageRes.json()
        setHasPresence(Boolean(pageData.success && pageData.data.pages.length > 0))
      }
    } catch (error) {
      console.error('Failed to check presence status:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleTemplateSelect(template: PresenceTemplate) {
    if (!businessId || applyingTemplateRef.current) return

    applyingTemplateRef.current = true
    setApplyingTemplate(true)
    setTemplateError('')

    try {
      const response = await fetch('/api/presence/apply-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: template.id, businessId }),
      })
      const data = await response.json()

      if (data.success) {
        router.push('/dashboard/presence/editor')
        return
      }

      setTemplateError(
        data.error || 'The template could not be applied. Your current page is unchanged.'
      )
    } catch (error) {
      console.error('Failed to apply template:', error)
      setTemplateError('The template could not be applied. Check your connection and try again.')
    } finally {
      applyingTemplateRef.current = false
      setApplyingTemplate(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-onprez-blue" />
      </div>
    )
  }

  if (showTemplateSelector) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {hasPresence ? 'Change your template' : 'Choose your template'}
            </h1>
            <p className="mt-2 max-w-3xl text-gray-600">
              Every option below uses the same canonical layout in the example, editor preview, and
              published customer page.
            </p>
          </div>
          <Button variant="ghost" onClick={() => setShowTemplateSelector(false)}>
            ← Back
          </Button>
        </div>

        {hasPresence && (
          <Card className="border-blue-200 bg-blue-50 p-5">
            <h2 className="font-semibold text-blue-950">Your business data stays intact</h2>
            <p className="mt-2 text-sm leading-6 text-blue-900">
              Changing templates preserves your services, bookings, availability, written copy,
              uploaded imagery, FAQs, and testimonials. The new presentation is saved as a draft so
              you can inspect it before republishing your live page.
            </p>
          </Card>
        )}

        <TemplateSelector
          onSelect={handleTemplateSelect}
          onPreview={template => setPreviewTemplate(template)}
        />

        {templateError && (
          <ActionFeedback
            status="error"
            title="Template not applied"
            message={templateError}
            actionLabel="Choose a template and try again"
            onAction={() => setTemplateError('')}
          />
        )}

        <TemplatePreviewModal
          template={previewTemplate}
          isOpen={Boolean(previewTemplate)}
          onClose={() => setPreviewTemplate(null)}
          onSelect={handleTemplateSelect}
        />
      </div>
    )
  }

  if (!hasPresence) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Your Presence</h1>
          <p className="mt-2 text-gray-600">
            Choose a premium template for your services, availability, and booking page.
          </p>
        </div>

        <Card className="p-12 text-center">
          <div className="mx-auto max-w-md space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-onprez-blue to-onprez-purple">
              <Globe className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">No Presence Page Yet</h2>
              <p className="text-gray-600">
                Start from the exact design customers see in the public template examples.
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowTemplateSelector(true)}
              disabled={applyingTemplate}
            >
              <Plus className="mr-2 h-5 w-5" />
              Choose a template
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Your Presence</h1>
          <p className="mt-2 text-gray-600">Edit your page or switch its premium presentation.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {businessSlug && (
            <Link
              href={`/${businessSlug}`}
              target="_blank"
              className="inline-flex items-center rounded-lg border border-onprez-blue/20 px-6 py-3 font-semibold text-onprez-blue transition-colors hover:bg-onprez-blue/10"
            >
              <Eye className="mr-2 h-4 w-4" />
              View live page
            </Link>
          )}
          <Button variant="ghost" onClick={() => setShowTemplateSelector(true)}>
            <LayoutTemplate className="mr-2 h-4 w-4" />
            Change template
          </Button>
          <Link
            href="/dashboard/presence/editor"
            className="inline-flex items-center rounded-lg bg-gradient-to-r from-onprez-blue to-onprez-purple px-6 py-3 font-semibold text-white shadow-lg transition-transform hover:scale-[1.02]"
          >
            Edit Presence
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <div className="mb-1 text-sm text-gray-600">Status</div>
          <div className="text-2xl font-bold text-green-600">Published</div>
        </Card>
        <Card className="p-6">
          <div className="mb-1 text-sm text-gray-600">Page URL</div>
          <div className="break-all text-lg font-semibold text-gray-900">
            onprez.com/{businessSlug}
          </div>
        </Card>
        <Card className="p-6">
          <div className="mb-1 text-sm text-gray-600">Template controls</div>
          <div className="text-lg font-semibold text-gray-900">Content-preserving</div>
        </Card>
      </div>
    </div>
  )
}
