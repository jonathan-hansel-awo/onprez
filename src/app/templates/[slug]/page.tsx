import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { CSSProperties } from 'react'
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
import {
  getPresenceTemplate,
  presenceTemplateCatalogue,
} from '@/data/presence-template-catalogue'

interface TemplatePreviewPageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return presenceTemplateCatalogue.map(template => ({ slug: template.slug }))
}

export async function generateMetadata({ params }: TemplatePreviewPageProps): Promise<Metadata> {
  const { slug } = await params
  const template = getPresenceTemplate(slug)

  if (!template) {
    return { title: 'Template not found | OnPrez' }
  }

  return {
    title: `${template.name} Template Preview | OnPrez`,
    description: template.description,
    robots: { index: false, follow: true },
  }
}

export default async function TemplatePreviewPage({ params }: TemplatePreviewPageProps) {
  const { slug } = await params
  const template = getPresenceTemplate(slug)

  if (!template) {
    notFound()
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
    bookingHref: `/signup?template=${template.slug}`,
  }))

  return (
    <main
      style={themeStyle}
      className="min-h-screen bg-[var(--theme-background)] text-[var(--theme-text)]"
    >
      <div className="sticky top-0 z-[60] border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
              Demo template preview
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
              href={`/signup?template=${template.slug}`}
              className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Use this template
            </Link>
          </div>
        </div>
      </div>

      <FullBleedHero
        eyebrow={template.preview.eyebrow}
        title={template.preview.headline}
        description={`${template.preview.businessName} is demonstration content showing how this template can present a real service business.`}
        imageUrl={`data:image/svg+xml,${encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${template.palette.primary}"/><stop offset="1" stop-color="${template.palette.surface}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="1200" cy="180" r="260" fill="white" fill-opacity=".14"/><circle cx="300" cy="780" r="340" fill="white" fill-opacity=".08"/></svg>`
        )}`}
        imageAlt={`${template.name} abstract demonstration artwork`}
        primaryAction={{ label: 'Book a service', href: `/signup?template=${template.slug}` }}
        secondaryAction={{ label: 'View services', href: '#services' }}
      />

      <EditorialIntroduction
        eyebrow="About this demo business"
        title={template.preview.businessName}
        body={`This sample page demonstrates the ${template.name} template with realistic structure and fictional content. A real business can replace every name, service, price, image, colour, and policy after choosing the template.`}
      />

      <div id="services">
        <ImageServiceCards title="Services" services={services} />
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
        title="Before you book"
        items={[
          {
            id: 'demo-content',
            question: 'Is this a real business page?',
            answer:
              'No. This is clearly labelled demonstration content showing how an OnPrez template behaves before a business signs up.',
          },
          {
            id: 'customise',
            question: 'Can the design be customised?',
            answer:
              'Yes. Business identity, services, prices, imagery, colours, typography, policies, contact details, and approved section settings can be changed.',
          },
          {
            id: 'booking',
            question: 'Will the booking buttons work on a published page?',
            answer:
              'Yes. Published presence pages connect service actions to the business’s real OnPrez booking flow.',
          },
        ]}
      />

      <BookingCtaBanner
        eyebrow="Ready to make it yours?"
        title={`Start with ${template.name}`}
        description="Create your account and carry this template choice into onboarding. No business is created from this preview alone."
        action={{ label: 'Use this template', href: `/signup?template=${template.slug}` }}
      />

      <footer className="px-5 pb-28 pt-10 text-center text-sm text-gray-600 md:pb-10">
        <p>
          All business names, services, prices, locations, and claims on this page are fictional demo
          content.
        </p>
      </footer>

      <StickyMobileBookingCta
        action={{ label: 'Use this template', href: `/signup?template=${template.slug}` }}
      />
    </main>
  )
}
