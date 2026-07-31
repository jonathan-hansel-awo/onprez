import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SectionRenderer } from '@/components/presence/sections/SectionRenderer'
import type { PresenceTrustSignals } from '@/components/presence/PresenceConversion'
import { ThemeProvider } from '@/contexts/ThemeProvider'
import type {
  CanonicalPresenceTheme,
  CanonicalPreviewService,
} from '@/lib/templates/canonical-template-engine'
import {
  isPresenceDraftPreviewVersionCurrent,
  verifyPresenceDraftPreviewToken,
} from '@/lib/presence/draft-preview-token'
import { prisma } from '@/lib/prisma'
import type { PageSection } from '@/types/page-sections'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Private draft preview - OnPrez',
  description: 'A private preview of the latest saved OnPrez presence-page draft.',
  referrer: 'no-referrer',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
}

interface DraftPreviewPageProps {
  params: Promise<{
    token: string
  }>
}

interface PreviewSettings {
  theme?: CanonicalPresenceTheme
  responseTime?: string
  credentials?: unknown
  booking?: {
    cancellationDeadline?: number
  }
}

interface PreviewSocialLinks {
  facebook?: string
  instagram?: string
  twitter?: string
  linkedin?: string
  tiktok?: string
  youtube?: string
  website?: string
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/London',
  }).format(value)
}

export default async function DraftPresencePreviewPage({ params }: DraftPreviewPageProps) {
  const { token } = await params

  let claims: ReturnType<typeof verifyPresenceDraftPreviewToken>

  try {
    claims = verifyPresenceDraftPreviewToken(token)
  } catch {
    notFound()
  }

  const [page, business, services, reviewSummary] = await Promise.all([
    prisma.page.findFirst({
      where: {
        id: claims.pageId,
        businessId: claims.businessId,
        slug: 'home',
      },
      select: {
        id: true,
        content: true,
        version: true,
        updatedAt: true,
      },
    }),
    prisma.business.findFirst({
      where: {
        id: claims.businessId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        website: true,
        socialLinks: true,
        settings: true,
      },
    }),
    prisma.service.findMany({
      where: {
        businessId: claims.businessId,
        active: true,
      },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        currency: true,
        duration: true,
        imageUrl: true,
        category: {
          select: { name: true },
        },
      },
    }),
    prisma.review.aggregate({
      where: {
        businessId: claims.businessId,
        isPublished: true,
      },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ])

  if (
    !page ||
    !business ||
    !isPresenceDraftPreviewVersionCurrent(claims.pageVersion, page.version)
  ) {
    notFound()
  }

  const settings = (business.settings || {}) as PreviewSettings
  const theme = settings.theme || {}
  const bookingSettings = settings.booking || {}
  const fullAddress = [business.address, business.city, business.state, business.zipCode]
    .filter(Boolean)
    .join(', ')
  const credentials = Array.isArray(settings.credentials)
    ? settings.credentials.filter(
        (credential: unknown): credential is string => typeof credential === 'string'
      )
    : undefined
  const trustSignals: PresenceTrustSignals = {
    location: [business.city, business.state].filter(Boolean).join(', ') || undefined,
    reviewCount: reviewSummary._count.rating || undefined,
    averageRating: reviewSummary._avg.rating || undefined,
    cancellationNoticeHours:
      typeof bookingSettings.cancellationDeadline === 'number'
        ? bookingSettings.cancellationDeadline
        : undefined,
    responseTime: settings.responseTime,
    credentials,
  }
  const previewServices: CanonicalPreviewService[] = services.map(service => ({
    id: service.id,
    name: service.name,
    description: service.description || '',
    price: Number(service.price),
    duration: service.duration,
    currency: service.currency,
    category: service.category,
    imageUrl: service.imageUrl,
  }))

  return (
    <main className="min-h-screen bg-white" data-presence-draft-preview>
      <aside
        id="draft-preview-note"
        className="sticky top-0 z-[100] border-b border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 shadow-sm"
        aria-label="Private draft preview information"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em]">Private draft preview</p>
            <p className="mt-1 text-sm font-semibold">
              This is the latest saved draft, not the page customers currently see. Booking and
              inquiry actions are disabled.
            </p>
          </div>
          <p className="shrink-0 text-xs font-medium leading-5 text-amber-800">
            Saved {formatDateTime(page.updatedAt)}
            <br />
            Link expires {formatDateTime(claims.expiresAt)} and invalidates on publish.
          </p>
        </div>
      </aside>

      <ThemeProvider theme={theme}>
        <div
          className="min-h-screen overflow-x-clip"
          style={{
            backgroundColor: theme.backgroundColor || '#FFFFFF',
            fontFamily: theme.fontFamily || 'Inter',
          }}
        >
          <SectionRenderer
            sections={page.content as unknown as PageSection[]}
            businessHandle={business.slug}
            businessId={business.id}
            businessName={business.name}
            businessData={{
              phone: business.phone || undefined,
              email: business.email || undefined,
              address: fullAddress || undefined,
              website: business.website || undefined,
              socialLinks: (business.socialLinks || undefined) as PreviewSocialLinks | undefined,
            }}
            servicesOverride={previewServices}
            bookingHrefOverride="#draft-preview-note"
            showInquiryForm={false}
            trustSignals={trustSignals}
          />
        </div>
      </ThemeProvider>
    </main>
  )
}
