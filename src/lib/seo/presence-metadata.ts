import type { Metadata } from 'next'

interface PresenceMetadataBusiness {
  name: string
  slug: string
  description?: string | null
  city?: string | null
  country?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
  seoKeywords?: string[] | null
  coverImageUrl?: string | null
  logoUrl?: string | null
  allowSearchEngineIndexing: boolean
}

export function buildPresenceMetadata(
  business: PresenceMetadataBusiness,
  baseUrl: string
): Metadata {
  const title = business.seoTitle || `${business.name} - OnPrez`
  const description =
    business.seoDescription ||
    business.description ||
    `Visit ${business.name} on OnPrez. Professional services and booking in ${business.city || business.country || 'your area'}.`
  const imageUrl = business.coverImageUrl || business.logoUrl || `${baseUrl}/og-default.png`
  const canonicalUrl = `${baseUrl}/${business.slug}`
  const index = business.allowSearchEngineIndexing

  return {
    title,
    description,
    keywords: business.seoKeywords || [],
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'OnPrez',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: business.name }],
      locale: 'en_GB',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    alternates: { canonical: canonicalUrl },
    robots: {
      index,
      follow: index,
      googleBot: { index, follow: index },
    },
  }
}

export function buildMissingPresenceMetadata(): Metadata {
  return {
    title: 'Not Found - OnPrez',
    description: 'This page could not be found.',
    robots: { index: false, follow: false },
  }
}
