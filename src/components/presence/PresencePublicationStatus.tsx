'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { Clock3, ExternalLink, FilePenLine, Globe2, RefreshCw } from 'lucide-react'
import {
  formatPublishedAt,
  getPresencePublicationState,
  type PresencePublicationState,
} from '@/lib/presence/publication-state'

interface PresencePageRecord {
  slug: string
  content: unknown
  publishedContent: unknown | null
  isPublished: boolean
  publishedAt: string | null
}

interface PublicationStatusData {
  businessSlug: string
  state: PresencePublicationState
}

const toneClasses: Record<PresencePublicationState['kind'], string> = {
  draft: 'border-slate-200 bg-slate-50 text-slate-900',
  published: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  'published-with-changes': 'border-amber-300 bg-amber-50 text-amber-950',
  'published-without-snapshot': 'border-blue-200 bg-blue-50 text-blue-950',
}

const iconClasses: Record<PresencePublicationState['kind'], string> = {
  draft: 'bg-slate-200 text-slate-700',
  published: 'bg-emerald-200 text-emerald-800',
  'published-with-changes': 'bg-amber-200 text-amber-800',
  'published-without-snapshot': 'bg-blue-200 text-blue-800',
}

export function PresencePublicationStatus() {
  const pathname = usePathname()
  const isEditor = pathname.endsWith('/editor')
  const [status, setStatus] = useState<PublicationStatusData | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const refreshStatus = useCallback(async () => {
    setRefreshing(true)

    try {
      const businessResponse = await fetch('/api/business/current', { cache: 'no-store' })
      const businessPayload = await businessResponse.json()
      const business = businessPayload.success ? businessPayload.data?.business : null

      if (!business?.id || !business?.slug) {
        setStatus(null)
        return
      }

      const pageResponse = await fetch(`/api/presence/pages?businessId=${business.id}&slug=home`, {
        cache: 'no-store',
      })
      const pagePayload = await pageResponse.json()
      const page = (pagePayload.success ? pagePayload.data?.pages?.[0] : null) as
        | PresencePageRecord
        | undefined

      if (!page) {
        setStatus(null)
        return
      }

      setStatus({
        businessSlug: business.slug,
        state: getPresencePublicationState({
          isPublished: page.isPublished,
          draftContent: page.content,
          publishedContent: page.publishedContent,
          publishedAt: page.publishedAt,
        }),
      })
    } catch (error) {
      console.error('Failed to refresh presence publication status:', error)
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void refreshStatus()

    const interval = window.setInterval(() => void refreshStatus(), isEditor ? 4000 : 15000)
    const handleFocus = () => void refreshStatus()
    window.addEventListener('focus', handleFocus)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [isEditor, refreshStatus])

  if (!status) return null

  const { state, businessSlug } = status
  const lastPublished = formatPublishedAt(state.publishedAt)
  const Icon = state.kind === 'draft' ? FilePenLine : Globe2

  const content = (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneClasses[state.kind]}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClasses[state.kind]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] opacity-70">
                Publication status
              </p>
              <h2 className="mt-1 text-base font-bold">{state.label}</h2>
            </div>
            <button
              type="button"
              onClick={() => void refreshStatus()}
              disabled={refreshing}
              className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-current/15 bg-white/60 p-2 transition hover:bg-white disabled:opacity-60"
              aria-label="Refresh publication status"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <p className="mt-2 text-sm font-medium leading-6">{state.shortDescription}</p>
          <p className="mt-1 text-sm leading-6 opacity-80">{state.customerViewDescription}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold opacity-80">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              {lastPublished ? `Last published ${lastPublished}` : 'Never published'}
            </span>
            {state.hasUnpublishedChanges && <span>Publish again to update the live page.</span>}
          </div>

          {state.kind !== 'draft' && (
            <Link
              href={`/${businessSlug}`}
              target="_blank"
              className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-current/20 bg-white/70 px-3 py-2 text-sm font-bold transition hover:bg-white"
            >
              View what customers see
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )

  if (isEditor) {
    return (
      <aside
        className="fixed bottom-4 right-4 z-[80] w-[min(25rem,calc(100vw-2rem))]"
        aria-live="polite"
        aria-label="Presence publication status"
      >
        {content}
      </aside>
    )
  }

  return (
    <section aria-live="polite" aria-label="Presence publication status">
      {content}
    </section>
  )
}
