'use client'

import Link from 'next/link'
import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { getPresenceTemplate } from '@/data/presence-template-catalogue'
import { normalisePreviewBusinessName } from '@/lib/templates/preview-personalisation'
import { TEMPLATE_SELECTION_COOKIE } from '@/lib/templates/template-selection'
import { sessionStorage } from '@/lib/utils/session-storage'

export function SignupTemplateSelection() {
  const searchParams = useSearchParams()
  const templateSlug = searchParams.get('template') || ''
  const businessName = normalisePreviewBusinessName(searchParams.get('businessName'))
  const template = useMemo(() => getPresenceTemplate(templateSlug), [templateSlug])

  useEffect(() => {
    if (businessName) {
      sessionStorage.save({ businessName })
    }

    if (template) {
      document.cookie = `${TEMPLATE_SELECTION_COOKIE}=${encodeURIComponent(template.slug)}; Path=/; Max-Age=3600; SameSite=Lax`
    }
  }, [businessName, template])

  if (!template) {
    return null
  }

  return (
    <aside className="mx-auto mb-6 w-full max-w-md rounded-2xl border border-onprez-blue/20 bg-blue-50/90 p-4 text-sm text-gray-800 shadow-sm">
      <p className="font-semibold text-gray-900">Selected template: {template.name}</p>
      <p className="mt-1 text-gray-600">
        We will apply this design as an unpublished draft after your account and business are
        created. Demo services and prices will not be copied.
      </p>
      <Link
        href="/templates"
        className="mt-3 inline-flex font-semibold text-onprez-blue hover:underline"
      >
        Choose a different template
      </Link>
    </aside>
  )
}
