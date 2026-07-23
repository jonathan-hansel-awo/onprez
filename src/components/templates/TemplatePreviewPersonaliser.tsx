'use client'

import type { BusinessCategory } from '@prisma/client'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { SectionRenderer } from '@/components/presence/sections/SectionRenderer'
import { ThemeProvider } from '@/contexts/ThemeProvider'
import type { TemplateCatalogueItem } from '@/data/presence-template-catalogue'
import { createCanonicalPresencePageContent } from '@/lib/templates/canonical-template-engine'
import {
  buildTemplateSignupHref,
  normalisePreviewBusinessName,
} from '@/lib/templates/preview-personalisation'

interface TemplatePreviewPersonaliserProps {
  template: TemplateCatalogueItem
  initialBusinessName?: string
  initialClientView?: boolean
}

export function TemplatePreviewPersonaliser({
  template,
  initialBusinessName,
  initialClientView = false,
}: TemplatePreviewPersonaliserProps) {
  const [businessNameInput, setBusinessNameInput] = useState(
    normalisePreviewBusinessName(initialBusinessName) || template.preview.businessName
  )
  const [isClientView, setIsClientView] = useState(initialClientView)

  const businessName =
    normalisePreviewBusinessName(businessNameInput) || template.preview.businessName
  const signupHref = useMemo(
    () => buildTemplateSignupHref(template.slug, businessName),
    [businessName, template.slug]
  )
  const canonicalPage = useMemo(
    () =>
      createCanonicalPresencePageContent(businessName, 'OTHER' as BusinessCategory, template.slug, {
        mode: 'preview',
      }),
    [businessName, template.slug]
  )

  return (
    <main className="min-h-screen bg-white">
      {!isClientView && (
        <>
          <div className="sticky top-0 z-[70] border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur-xl">
            <div className="mx-auto flex max-w-[1440px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-[10px] font-bold uppercase tracking-[0.24em] text-gray-500">
                  Canonical customer preview · same renderer used after signup
                </p>
                <p className="truncate text-lg font-semibold text-gray-900">{template.name}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/templates" className="text-sm font-semibold text-gray-700">
                  All templates
                </Link>
                <button
                  type="button"
                  onClick={() => setIsClientView(true)}
                  className="rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-bold text-gray-800"
                >
                  Client view
                </button>
                <Link
                  href={signupHref}
                  className="rounded-full bg-gray-950 px-5 py-2.5 text-sm font-bold text-white shadow-lg"
                >
                  Use this template
                </Link>
              </div>
            </div>
          </div>

          <section className="border-b border-gray-200 bg-gray-50 px-5 py-5 sm:px-8">
            <div className="mx-auto flex max-w-[1440px] flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <label
                  htmlFor="preview-business-name"
                  className="text-xs font-bold uppercase tracking-[0.18em] text-gray-700"
                >
                  Preview with your business name
                </label>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  The layout below is not a separate marketing mock-up. It is generated from the
                  same template definition and section renderer used by the dashboard and public
                  page.
                </p>
              </div>
              <input
                id="preview-business-name"
                value={businessNameInput}
                onChange={event => setBusinessNameInput(event.target.value)}
                maxLength={80}
                className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-gray-900 outline-none focus:ring-2 focus:ring-gray-900 lg:max-w-md"
                autoComplete="organization"
              />
            </div>
          </section>
        </>
      )}

      {isClientView && (
        <button
          type="button"
          onClick={() => setIsClientView(false)}
          className="fixed right-4 top-4 z-[90] rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-gray-900 shadow-xl backdrop-blur"
        >
          Exit client view
        </button>
      )}

      <ThemeProvider theme={canonicalPage.theme || {}}>
        <div
          className="min-h-screen overflow-x-clip"
          style={{
            backgroundColor: canonicalPage.theme?.backgroundColor || '#FFFFFF',
            fontFamily: canonicalPage.theme?.fontFamily || 'Inter',
          }}
        >
          <SectionRenderer
            sections={canonicalPage.sections}
            businessHandle="template-preview"
            businessId="template-preview"
            businessName={businessName}
            businessData={canonicalPage.previewBusinessData || {}}
            servicesOverride={canonicalPage.previewServices}
            bookingHrefOverride={signupHref}
            showInquiryForm={false}
            trustSignals={{
              responseTime: 'Replies within one business day',
              credentials: ['Clear services', 'Live availability', 'Mobile booking'],
            }}
          />
        </div>
      </ThemeProvider>

      {!isClientView && (
        <footer className="border-t border-gray-200 bg-white px-5 py-8 text-center text-xs leading-6 text-gray-600">
          Demo services, imagery, contact details, and reviews are clearly fictional preview
          content. The selected design, section structure, typography, spacing, and responsive
          renderer are the same ones applied to the account.
        </footer>
      )}
    </main>
  )
}
