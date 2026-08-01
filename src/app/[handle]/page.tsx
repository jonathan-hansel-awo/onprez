/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SectionRenderer } from '@/components/presence/sections/SectionRenderer'
import { StructuredData } from '@/components/seo/structured-data'
import type { PresenceTrustSignals } from '@/components/presence/PresenceConversion'
import { ThemeProvider } from '@/contexts/ThemeProvider'
import { getCachedPublicPresence } from '@/lib/presence/public-presence-cache'
import { buildMissingPresenceMetadata, buildPresenceMetadata } from '@/lib/seo/presence-metadata'
import { buildPresenceStructuredData } from '@/lib/seo/presence-structured-data'
import { getAppUrl } from '@/lib/utils/get-app-url'
import type { PageSection } from '@/types/page-sections'

export const revalidate = 300

interface PresencePageProps {
  params: Promise<{
    handle: string
  }>
}

export default async function PresencePage({ params }: PresencePageProps) {
  const { handle } = await params
  const presence = await getCachedPublicPresence(handle)

  if (!presence) notFound()

  const { business, page, reviewSummary, services, businessHours } = presence
  const sections = (page.publishedContent || page.content) as unknown as PageSection[]
  const settings = business.settings as any
  const theme = settings?.theme || {}
  const showInquiryForm = settings?.inquiriesEnabled !== false
  const bookingSettings = settings?.booking || {}

  const fullAddress = [business.address, business.city, business.state, business.zipCode]
    .filter(Boolean)
    .join(', ')

  const trustSignals: PresenceTrustSignals = {
    location: [business.city, business.state].filter(Boolean).join(', ') || undefined,
    reviewCount: reviewSummary.reviewCount || undefined,
    averageRating: reviewSummary.averageRating || undefined,
    cancellationNoticeHours:
      typeof bookingSettings.cancellationDeadline === 'number'
        ? bookingSettings.cancellationDeadline
        : undefined,
    responseTime: typeof settings?.responseTime === 'string' ? settings.responseTime : undefined,
    credentials: Array.isArray(settings?.credentials)
      ? settings.credentials.filter(
          (credential: unknown): credential is string => typeof credential === 'string'
        )
      : undefined,
  }
  const structuredData = buildPresenceStructuredData({
    baseUrl: getAppUrl(),
    business,
    services,
    businessHours,
    reviewSummary,
    sections,
  })

  return (
    <>
      <StructuredData data={structuredData} />

      <ThemeProvider theme={theme}>
        <div
          className="min-h-screen overflow-x-clip"
          style={{
            backgroundColor: theme.backgroundColor || '#FFFFFF',
            fontFamily: theme.fontFamily || 'Inter',
          }}
        >
          <SectionRenderer
            sections={sections}
            businessHandle={business.slug}
            businessId={business.id}
            businessName={business.name}
            businessData={{
              phone: business.phone || undefined,
              email: business.email || undefined,
              address: fullAddress || undefined,
              website: business.website || undefined,
              socialLinks: business.socialLinks as any,
            }}
            showInquiryForm={showInquiryForm}
            trustSignals={trustSignals}
          />
        </div>
      </ThemeProvider>
    </>
  )
}

export async function generateMetadata({ params }: PresencePageProps): Promise<Metadata> {
  const { handle } = await params
  const presence = await getCachedPublicPresence(handle)

  if (!presence) {
    return buildMissingPresenceMetadata()
  }

  return buildPresenceMetadata(presence.business, getAppUrl())
}
