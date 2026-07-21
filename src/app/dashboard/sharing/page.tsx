'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, Copy, ExternalLink, Share2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { ActionFeedback } from '@/components/ui/action-feedback'
import type { OnboardingProgress } from '@/lib/onboarding/progress'

export default function SharingPage() {
  const [onboarding, setOnboarding] = useState<OnboardingProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadBusiness() {
      try {
        const response = await fetch('/api/dashboard/onboarding')
        const result = await response.json()
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Your sharing details could not be loaded.')
        }
        setOnboarding(result.data.onboarding)
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Your sharing details could not be loaded.'
        )
      } finally {
        setLoading(false)
      }
    }

    void loadBusiness()
  }, [])

  async function markShared() {
    const response = await fetch('/api/dashboard/onboarding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: 'share', action: 'complete' }),
    })
    if (!response.ok) throw new Error('Your link was shared, but the checklist could not update.')
  }

  function getPublicUrl() {
    if (!onboarding) return ''
    return `${window.location.origin}${onboarding.publicUrl}`
  }

  async function copyLink() {
    if (!onboarding?.isPublished) return
    setError('')
    try {
      await navigator.clipboard.writeText(getPublicUrl())
      await markShared()
      setCopied(true)
      window.setTimeout(() => setCopied(false), 3000)
    } catch (copyError) {
      setError(copyError instanceof Error ? copyError.message : 'The link could not be copied.')
    }
  }

  async function shareLink() {
    if (!onboarding?.isPublished) return
    if (!navigator.share) {
      await copyLink()
      return
    }

    setError('')
    try {
      await navigator.share({
        title: onboarding.businessName,
        text: `Book with ${onboarding.businessName} on OnPrez`,
        url: getPublicUrl(),
      })
      await markShared()
      setCopied(true)
      window.setTimeout(() => setCopied(false), 3000)
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === 'AbortError') return
      setError(shareError instanceof Error ? shareError.message : 'The link could not be shared.')
    }
  }

  if (loading) {
    return (
      <div className="h-64 animate-pulse rounded-2xl bg-white" aria-label="Loading sharing tools" />
    )
  }

  if (!onboarding) {
    return (
      <ActionFeedback
        status="error"
        title="Sharing tools unavailable"
        message={error || 'Your presence link could not be loaded. Refresh the page to try again.'}
      />
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Share your presence</h1>
        <p className="mt-2 text-gray-600">
          Put your OnPrez link wherever customers already discover and contact you.
        </p>
      </div>

      {!onboarding.isPublished && (
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 text-amber-900">
          <p className="font-semibold">Publish before sharing</p>
          <p className="mt-1 text-sm">
            Your link is reserved, but visitors cannot see your presence until it is published.
          </p>
          <Link
            href="/dashboard/presence/editor"
            className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-2"
          >
            Open presence editor
          </Link>
        </div>
      )}

      <Card hover={false} className="overflow-hidden">
        <div className="bg-gradient-to-br from-onprez-blue/10 to-onprez-purple/10 p-6 sm:p-8">
          <p className="text-sm font-semibold text-gray-600">Your public link</p>
          <p className="mt-2 break-all text-xl font-bold text-gray-950 sm:text-2xl">
            onprez.com/{onboarding.slug}
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void copyLink()}
              disabled={!onboarding.isPublished}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-onprez-blue to-onprez-purple px-5 py-3 font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copied ? (
                <Check className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Copy className="h-5 w-5" aria-hidden="true" />
              )}
              {copied ? 'Link ready to share' : 'Copy link'}
            </button>
            <button
              type="button"
              onClick={() => void shareLink()}
              disabled={!onboarding.isPublished}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border-2 border-onprez-blue px-5 py-3 font-semibold text-onprez-blue hover:bg-onprez-blue/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Share2 className="h-5 w-5" aria-hidden="true" />
              Share
            </button>
            {onboarding.isPublished && (
              <Link
                href={onboarding.publicUrl}
                target="_blank"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-3 font-semibold text-gray-700 hover:bg-white/70"
              >
                View live page
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          [
            'Social profiles',
            'Add the link to your Instagram, TikTok, Facebook, and LinkedIn bios.',
          ],
          [
            'Direct messages',
            'Send it when a customer asks about services, prices, or availability.',
          ],
          [
            'Printed materials',
            'Use it on business cards, flyers, appointment cards, and QR codes.',
          ],
        ].map(([title, description]) => (
          <Card key={title} hover={false} className="p-5">
            <h2 className="font-bold text-gray-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
          </Card>
        ))}
      </div>

      {error && (
        <ActionFeedback
          status="error"
          title="Sharing was not completed"
          message={`${error} Your link is unchanged; please try again.`}
        />
      )}
    </div>
  )
}
