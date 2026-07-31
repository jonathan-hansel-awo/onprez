/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SectionRenderer } from '@/components/presence/sections/SectionRenderer'
import { StructuredData } from '@/components/seo/structured-data'
import type { PresenceTrustSignals } from '@/components/presence/PresenceConversion'
import { ThemeProvider } from '@/contexts/ThemeProvider'
import { getCachedPublicPresence } from '@/lib/presence/public-presence-cache'
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

  const { business, page, reviewSummary } = presence
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

  return (
    <>
      <StructuredData
        business={{
          name: business.name,
          description: business.description || undefined,
          url: `https://onprez.com/${business.slug}`,
          logo: business.logoUrl || undefined,
          address: fullAddress || undefined,
          phone: business.phone || undefined,
          email: business.email || undefined,
        }}
      />

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
    return {
      title: 'Not Found - OnPrez',
      description: 'This page could not be found.',
      robots: { index: false, follow: false },
    }
  }

  const { business } = presence
  const title = business.seoTitle || `${business.name} - OnPrez`
  const description =
    business.seoDescription ||
    business.description ||
    `Visit ${business.name} on OnPrez. Professional services and booking in ${business.city || business.country}.`

  const imageUrl = business.coverImageUrl || business.logoUrl || '/og-default.png'
  const canonicalUrl = `https://onprez.com/${business.slug}`

  return {
    title,
    description,
    keywords: business.seoKeywords || [],
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'OnPrez',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: business.name,
        },
      ],
      locale: 'en_GB',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
  }
}
