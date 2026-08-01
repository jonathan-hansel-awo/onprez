import type { FAQSection, PageSection } from '@/types/page-sections'

interface StructuredBusiness {
  id: string
  name: string
  slug: string
  category: string
  description?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  country?: string | null
  latitude?: number | null
  longitude?: number | null
  logoUrl?: string | null
  coverImageUrl?: string | null
  socialLinks?: unknown
}

interface StructuredService {
  id: string
  name: string
  description?: string | null
  imageUrl?: string | null
  price: string
  priceType: string
  priceRangeMin?: string | null
  priceRangeMax?: string | null
  currency: string
}

interface StructuredBusinessHours {
  dayOfWeek: number
  openTime: string
  closeTime: string
}

interface PresenceStructuredDataInput {
  baseUrl: string
  business: StructuredBusiness
  services: StructuredService[]
  businessHours: StructuredBusinessHours[]
  reviewSummary: {
    averageRating?: number | null
    reviewCount: number
  }
  sections: PageSection[]
}

const CATEGORY_SCHEMA_TYPE: Record<string, string> = {
  SALON: 'BeautySalon',
  BARBERSHOP: 'HairSalon',
  SPA: 'DaySpa',
  MASSAGE: 'HealthAndBeautyBusiness',
  NAILS: 'NailSalon',
  BEAUTY: 'BeautySalon',
  FITNESS: 'HealthClub',
  YOGA: 'HealthClub',
  PERSONAL_TRAINING: 'HealthClub',
  PHOTOGRAPHY: 'ProfessionalService',
  VIDEOGRAPHY: 'ProfessionalService',
  EVENT_PLANNING: 'ProfessionalService',
  CONSULTING: 'ProfessionalService',
  CLEANING: 'HomeAndConstructionBusiness',
  HOME_SERVICES: 'HomeAndConstructionBusiness',
  PET_SERVICES: 'ProfessionalService',
}

const SCHEMA_DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function cleanText(value: unknown, maxLength = 5000): string | undefined {
  if (typeof value !== 'string') return undefined
  const cleaned = value.replace(/\s+/g, ' ').trim()
  return cleaned ? cleaned.slice(0, maxLength) : undefined
}

function safeHttpUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined

  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined
  } catch {
    return undefined
  }
}

function publicUrls(value: unknown): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return []
  return Array.from(
    new Set(
      Object.values(value as Record<string, unknown>)
        .map(safeHttpUrl)
        .filter(Boolean)
    )
  ) as string[]
}

export function extractPublishedFaqs(sections: PageSection[]) {
  const seen = new Set<string>()

  return sections
    .filter((section): section is FAQSection => section.type === 'FAQ' && section.isVisible)
    .flatMap(section => section.data.items)
    .flatMap(item => {
      const question = cleanText(item.question, 300)
      const answer = cleanText(item.answer)
      if (!question || !answer) return []

      const key = question.toLocaleLowerCase('en-GB')
      if (seen.has(key)) return []
      seen.add(key)

      return [{ question, answer }]
    })
    .slice(0, 50)
}

function buildServiceOffer(service: StructuredService, businessUrl: string) {
  const price = cleanText(service.price, 32)
  const priceRange =
    service.priceType === 'RANGE'
      ? [service.priceRangeMin, service.priceRangeMax].filter(Boolean).join('–')
      : undefined

  return {
    '@type': 'Offer',
    url: `${businessUrl}/book/${service.id}`,
    availability: 'https://schema.org/InStock',
    priceCurrency: service.currency,
    price: service.priceType === 'RANGE' ? undefined : service.priceType === 'FREE' ? '0' : price,
    description: priceRange ? `Price range: ${priceRange} ${service.currency}` : undefined,
    itemOffered: {
      '@type': 'Service',
      name: cleanText(service.name, 200),
      description: cleanText(service.description),
      image: safeHttpUrl(service.imageUrl),
    },
  }
}

export function buildPresenceStructuredData({
  baseUrl,
  business,
  services,
  businessHours,
  reviewSummary,
  sections,
}: PresenceStructuredDataInput) {
  const businessUrl = `${baseUrl}/${business.slug}`
  const businessId = `${businessUrl}#business`
  const faqId = `${businessUrl}#faq`
  const faqs = extractPublishedFaqs(sections)
  const sameAs = Array.from(
    new Set([safeHttpUrl(business.website), ...publicUrls(business.socialLinks)].filter(Boolean))
  ) as string[]
  const hasAddress = Boolean(
    business.address || business.city || business.state || business.zipCode || business.country
  )
  const hasGeo = Number.isFinite(business.latitude) && Number.isFinite(business.longitude)
  const hasRating =
    reviewSummary.reviewCount > 0 &&
    typeof reviewSummary.averageRating === 'number' &&
    reviewSummary.averageRating >= 1 &&
    reviewSummary.averageRating <= 5

  const graph: Array<Record<string, unknown>> = [
    {
      '@type': CATEGORY_SCHEMA_TYPE[business.category] || 'LocalBusiness',
      '@id': businessId,
      name: cleanText(business.name, 200),
      description: cleanText(business.description),
      url: businessUrl,
      image: safeHttpUrl(business.coverImageUrl) || safeHttpUrl(business.logoUrl),
      logo: safeHttpUrl(business.logoUrl),
      telephone: cleanText(business.phone, 50),
      email: cleanText(business.email, 320),
      sameAs: sameAs.length ? sameAs : undefined,
      address: hasAddress
        ? {
            '@type': 'PostalAddress',
            streetAddress: cleanText(business.address, 300),
            addressLocality: cleanText(business.city, 100),
            addressRegion: cleanText(business.state, 100),
            postalCode: cleanText(business.zipCode, 30),
            addressCountry: cleanText(business.country, 2),
          }
        : undefined,
      geo: hasGeo
        ? {
            '@type': 'GeoCoordinates',
            latitude: business.latitude,
            longitude: business.longitude,
          }
        : undefined,
      openingHoursSpecification: businessHours.map(hours => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: SCHEMA_DAY[hours.dayOfWeek],
        opens: hours.openTime,
        closes: hours.closeTime,
      })),
      aggregateRating: hasRating
        ? {
            '@type': 'AggregateRating',
            ratingValue: Number(reviewSummary.averageRating?.toFixed(1)),
            reviewCount: reviewSummary.reviewCount,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
      hasOfferCatalog: services.length
        ? {
            '@type': 'OfferCatalog',
            name: `${business.name} services`,
            itemListElement: services.map(service => buildServiceOffer(service, businessUrl)),
          }
        : undefined,
    },
    {
      '@type': 'WebPage',
      '@id': `${businessUrl}#webpage`,
      url: businessUrl,
      name: business.name,
      mainEntity: { '@id': businessId },
      breadcrumb: { '@id': `${businessUrl}#breadcrumb` },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${businessUrl}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'OnPrez', item: baseUrl },
        { '@type': 'ListItem', position: 2, name: business.name, item: businessUrl },
      ],
    },
  ]

  if (faqs.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': faqId,
      url: businessUrl,
      isPartOf: { '@id': `${businessUrl}#webpage` },
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    })
  }

  return { '@context': 'https://schema.org', '@graph': graph }
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}
