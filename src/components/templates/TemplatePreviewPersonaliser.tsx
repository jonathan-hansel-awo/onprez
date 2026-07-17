'use client'

import Link from 'next/link'
import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'
import {
  BookingCtaBanner,
  EditorialIntroduction,
  FullBleedHero,
  ImageServiceCards,
  LocationHoursPanel,
  PremiumFaqAccordion,
  StickyMobileBookingCta,
  TrustStrip,
} from '@/components/presence/premium'
import { LuxuryWellnessPreview } from '@/components/templates/LuxuryWellnessPreview'
import type { TemplateCatalogueItem } from '@/data/presence-template-catalogue'
import {
  buildTemplateSignupHref,
  normalisePreviewBusinessName,
} from '@/lib/templates/preview-personalisation'

interface TemplatePreviewPersonaliserProps {
  template: TemplateCatalogueItem
  initialBusinessName?: string
}

export function TemplatePreviewPersonaliser({
  template,
  initialBusinessName,
}: TemplatePreviewPersonaliserProps) {
  const [businessNameInput, setBusinessNameInput] = useState(
    normalisePreviewBusinessName(initialBusinessName) || template.preview.businessName
  )

  const businessName =
    normalisePreviewBusinessName(businessNameInput) || template.preview.businessName
  const signupHref = useMemo(
    () => buildTemplateSignupHref(template.slug, businessName),
    [businessName, template.slug]
  )

  if (template.slug === 'serene-wellness') {
    return (
      <LuxuryWellnessPreview
        template={template}
        businessName={businessName}
        businessNameInput={businessNameInput}
        setBusinessNameInput={setBusinessNameInput}
        signupHref={signupHref}
      />
    )
  }

  const themeStyle = {
    '--theme-background': template.palette.background,
    '--theme-surface': template.palette.surface,
    '--theme-primary': template.palette.primary,
    '--theme-text': template.palette.text,
    '--theme-muted-text': template.palette.text,
  } as CSSProperties

  const services = template.preview.services.map(service => ({
    ...service,
    bookingHref: signupHref,
  }))

  return (
    <main
      style={themeStyle}
      className="min-h-screen bg-[var(--theme-background)] text-[var(--theme-text)]"
    >
      <div className="sticky top-0 z-[60] border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
              Temporary demo preview · not claimed or published
            </p>
            <p className="truncate font-bold text-gray-900">{template.name}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/templates"
              className="hidden rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 sm:inline-flex"
            >
              All templates
            </Link>
            <Link
              href={signupHref}
              className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Use this template
            </Link>
          </div>
        </div>
      </div>

      <section className="border-b border-black/10 bg-white/90 px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <label htmlFor="preview-business-name" className="text-sm font-semibold text-gray-900">
              Preview this template with your business name
            </label>
            <p className="mt-1 text-sm text-gray-600">
              This changes only your browser preview. It does not create an account, claim a name,
              or publish a page.
            </p>
          </div>
          <input
            id="preview-business-name"
            type="text"
            value={businessNameInput}
            maxLength={80}
            onChange={event => setBusinessNameInput(event.target.value)}
            className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-gray-900 outline-none ring-offset-2 focus:ring-2 focus:ring-gray-900 sm:max-w-md"
            placeholder="Enter your business name"
            autoComplete="organization"
          />
        </div>
      </section>

      <FullBleedHero
        eyebrow={template.preview.eyebrow}
        title={businessName}
        description={`${template.preview.headline} This temporary demonstration shows how ${businessName} could appear on OnPrez.`}
        imageUrl={`data:image/svg+xml,${encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${template.palette.primary}"/><stop offset="1" stop-color="${template.palette.surface}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="1200" cy="180" r="260" fill="white" fill-opacity=".14"/><circle cx="300" cy="780" r="340" fill="white" fill-opacity=".08"/></svg>`
        )}`}
        imageAlt={`${template.name} abstract demonstration artwork`}
        primaryAction={{ label: 'Book a service', href: signupHref }}
        secondaryAction={{ label: 'View services', href: '#services' }}
      />

      <EditorialIntroduction
        eyebrow="About this temporary preview"
        title={businessName}
        body={`This sample page demonstrates the ${template.name} template with ${businessName} inserted as temporary browser-only content. A real business can replace every service, price, image, colour, policy, and contact detail after signup.`}
      />

      <div id="services">
        <ImageServiceCards title={`Services from ${businessName}`} services={services} />
      </div>

      <TrustStrip
        items={[
          { label: 'Clear service information' },
          { label: 'Mobile-first booking' },
          { label: 'Customisable branding' },
          { label: 'Contact fallback included' },
        ]}
      />

      <LocationHoursPanel
        address="Demo location · Replace with your real business address or service area"
        hours={[
          { day: 'Monday', time: '9:00–17:00' },
          { day: 'Tuesday', time: '9:00–17:00' },
          { day: 'Wednesday', time: '10:00–19:00' },
          { day: 'Thursday', time: '10:00–19:00' },
          { day: 'Friday', time: '9:00–16:00' },
          { day: 'Weekend', time: 'By appointment' },
        ]}
      />

      <PremiumFaqAccordion
        title="Before you continue"
        items={[
          {
            id: 'temporary-name',
            question: `Has ${businessName} been registered or claimed?`,
            answer:
              'No. The entered name exists only in this temporary preview. Availability and ownership are handled during signup and onboarding.',
          },
          {
            id: 'database',
            question: 'Does this preview create any business records?',
            answer:
              'No. Preview personalisation runs entirely in the browser and creates no account, business, ownership, or publishing records.',
          },
          {
            id: 'preserved',
            question: 'Will my entered name carry into signup?',
            answer:
              'Yes. The selected template and entered business name are included in the signup link so onboarding can reuse them after you choose to continue.',
          },
        ]}
      />

      <BookingCtaBanner
        eyebrow="Ready to continue?"
        title={`Start building ${businessName}`}
        description="Your preview is still temporary. Creating an account is the next step before any page can be claimed, saved, or published."
        action={{ label: 'Continue to signup', href: signupHref }}
      />

      <footer className="px-5 pb-28 pt-10 text-center text-sm text-gray-600 md:pb-10">
        <p>
          All services, prices, locations, imagery, and claims are fictional demo content. The
          entered business name is temporary and does not establish ownership.
        </p>
      </footer>

      <StickyMobileBookingCta action={{ label: 'Continue to signup', href: signupHref }} />
    </main>
  )
}
