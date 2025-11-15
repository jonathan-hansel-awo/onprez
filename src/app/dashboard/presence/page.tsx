'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Eye, Save, Globe } from 'lucide-react'
import { TemplateSelector } from '@/components/presence/TemplateSelector'
import { TemplatePreviewModal } from '@/components/presence/TemplatePreviewModal'
import { PresenceTemplate } from '@/types/templates'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function PresencePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [hasPresence, setHasPresence] = useState(false)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessSlug, setBusinessSlug] = useState<string | null>(null)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<PresenceTemplate | null>(null)
  const [applyingTemplate, setApplyingTemplate] = useState(false)

  useEffect(() => {
    checkPresenceStatus()
  }, [])

  async function checkPresenceStatus() {
    try {
      // Get current business
      const businessRes = await fetch('/api/business/current')
      const businessData = await businessRes.json()

      if (businessData.success && businessData.data.business) {
        const business = businessData.data.business
        setBusinessId(business.id)
        setBusinessSlug(business.slug)

        // Check if presence page exists
        const pageRes = await fetch(`/api/presence/pages?businessId=${business.id}`)
        const pageData = await pageRes.json()

        if (pageData.success && pageData.data.pages.length > 0) {
          setHasPresence(true)
        }
      }
    } catch (error) {
      console.error('Failed to check presence status:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleTemplateSelect(template: PresenceTemplate) {
    if (!businessId) return

    setApplyingTemplate(true)
    try {
      const response = await fetch('/api/presence/apply-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          businessId: businessId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Redirect to editor
        router.push('/dashboard/presence/editor')
      } else {
        alert(data.error || 'Failed to apply template')
      }
    } catch (error) {
      console.error('Failed to apply template:', error)
      alert('Failed to apply template')
    } finally {
      setApplyingTemplate(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-onprez-blue" />
      </div>
    )
  }

  if (!hasPresence) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Your Presence</h1>
          <p className="text-gray-600 mt-2">
            Choose a template to get started with your online presence page
          </p>
        </div>

        {/* Template Selector */}
        {showTemplateSelector ? (
          <div className="space-y-6">
            <Button variant="ghost" onClick={() => setShowTemplateSelector(false)}>
              ← Back
            </Button>

            <TemplateSelector
              onSelect={handleTemplateSelect}
              onPreview={template => setPreviewTemplate(template)}
            />
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-onprez-blue to-onprez-purple rounded-2xl flex items-center justify-center mx-auto">
                <Globe className="w-10 h-10 text-white" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No Presence Page Yet</h2>
                <p className="text-gray-600">
                  Create your professional online presence to showcase your services and accept
                  bookings
                </p>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={() => setShowTemplateSelector(true)}
                disabled={applyingTemplate}
              >
                <Plus className="w-5 h-5 mr-2" />
                {applyingTemplate ? 'Creating...' : 'Create Presence Page'}
              </Button>
            </div>
          </Card>
        )}

        {/* Template Preview Modal */}
        <TemplatePreviewModal
          template={previewTemplate}
          isOpen={!!previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onSelect={handleTemplateSelect}
        />
      </div>
    )
  }

  // If presence exists, show editor options
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Your Presence</h1>
          <p className="text-gray-600 mt-2">Edit your online presence page</p>
        </div>

        <div className="flex gap-3">
          {businessSlug && (
            <Button variant="ghost">
              <Link href={`/${businessSlug}`} target="_blank">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Link>
            </Button>
          )}
          <Button variant="primary">
            <Link href="/dashboard/presence/editor">Edit Presence</Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">Status</div>
          <div className="text-2xl font-bold text-green-600">Published</div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">Page URL</div>
          <div className="text-lg font-semibold text-gray-900">onprez.com/{businessSlug}</div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">Last Updated</div>
          <div className="text-lg font-semibold text-gray-900">Today</div>
        </Card>
      </div>
    </div>
  )
}
