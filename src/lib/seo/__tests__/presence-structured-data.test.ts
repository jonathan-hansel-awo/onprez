import type { PageSection } from '@/types/page-sections'
import {
  buildPresenceStructuredData,
  extractPublishedFaqs,
  serializeJsonLd,
} from '../presence-structured-data'

const publishedSections = [
  {
    id: 'faq-visible',
    type: 'FAQ',
    order: 5,
    isVisible: true,
    data: {
      title: 'Common questions',
      items: [
        {
          id: 'faq-1',
          question: ' Do you offer pregnancy massage? ',
          answer: 'Yes, after the first trimester and with appropriate adaptations.',
        },
        {
          id: 'faq-2',
          question: 'do you offer pregnancy massage?',
          answer: 'Duplicate answer that must not be emitted.',
        },
        { id: 'faq-empty', question: ' ', answer: 'Not visible because the question is empty.' },
      ],
    },
  },
  {
    id: 'faq-hidden',
    type: 'FAQ',
    order: 6,
    isVisible: false,
    data: {
      title: 'Draft FAQ',
      items: [{ id: 'draft-1', question: 'Secret draft?', answer: 'Never publish this.' }],
    },
  },
] as PageSection[]

const realisticBusiness = {
  id: 'business-heavenly',
  name: 'Heavenly Pamper Palace',
  slug: 'heavenly-pamper-palace',
  category: 'SPA',
  description: 'A restorative massage and beauty studio in Cambridge.',
  phone: '+44 1223 555 010',
  email: 'hello@heavenly.example',
  website: 'https://heavenly.example/services',
  address: '12 Rose Crescent',
  city: 'Cambridge',
  state: 'Cambridgeshire',
  zipCode: 'CB2 3LL',
  country: 'GB',
  latitude: 52.2053,
  longitude: 0.1218,
  logoUrl: 'https://images.example.test/heavenly-logo.png',
  coverImageUrl: 'https://images.example.test/heavenly-cover.jpg',
  socialLinks: {
    instagram: 'https://instagram.com/heavenlypamper',
    unsafe: 'javascript:alert(1)',
  },
}

describe('presence structured data', () => {
  it('uses only complete, visible, de-duplicated FAQs from the published snapshot', () => {
    expect(extractPublishedFaqs(publishedSections)).toEqual([
      {
        question: 'Do you offer pregnancy massage?',
        answer: 'Yes, after the first trimester and with appropriate adaptations.',
      },
    ])
  })

  it('builds realistic local-business, service, rating, hours, breadcrumb, and FAQ schema', () => {
    const data = buildPresenceStructuredData({
      baseUrl: 'https://onprez.com',
      business: realisticBusiness,
      services: [
        {
          id: 'pregnancy-massage',
          name: 'Pregnancy Massage',
          description: 'A gentle, tailored treatment for expectant mothers.',
          imageUrl: 'https://images.example.test/pregnancy-massage.jpg',
          price: '70',
          priceType: 'FIXED',
          priceRangeMin: null,
          priceRangeMax: null,
          currency: 'GBP',
        },
      ],
      businessHours: [
        { dayOfWeek: 1, openTime: '09:00', closeTime: '18:00' },
        { dayOfWeek: 6, openTime: '10:00', closeTime: '16:00' },
      ],
      reviewSummary: { averageRating: 4.9, reviewCount: 18 },
      sections: publishedSections,
    })

    const graph = data['@graph']
    const localBusiness = graph.find(node => node['@type'] === 'DaySpa')
    const faqPage = graph.find(node => node['@type'] === 'FAQPage')

    expect(localBusiness).toEqual(
      expect.objectContaining({
        '@id': 'https://onprez.com/heavenly-pamper-palace#business',
        name: 'Heavenly Pamper Palace',
        address: expect.objectContaining({ addressLocality: 'Cambridge', addressCountry: 'GB' }),
        geo: { '@type': 'GeoCoordinates', latitude: 52.2053, longitude: 0.1218 },
        aggregateRating: expect.objectContaining({ ratingValue: 4.9, reviewCount: 18 }),
        sameAs: ['https://heavenly.example/services', 'https://instagram.com/heavenlypamper'],
      })
    )
    expect(localBusiness?.openingHoursSpecification).toHaveLength(2)
    expect(localBusiness?.hasOfferCatalog).toEqual(
      expect.objectContaining({
        itemListElement: [
          expect.objectContaining({
            price: '70',
            priceCurrency: 'GBP',
            itemOffered: expect.objectContaining({ name: 'Pregnancy Massage' }),
          }),
        ],
      })
    )
    expect(faqPage).toEqual(
      expect.objectContaining({
        mainEntity: [expect.objectContaining({ name: 'Do you offer pregnancy massage?' })],
      })
    )
  })

  it('serializes JSON-LD without allowing a business value to close the script element', () => {
    const serialized = serializeJsonLd({ name: '</script><script>alert(1)</script>' })

    expect(serialized).not.toContain('</script>')
    expect(serialized).toContain('\\u003c/script\\u003e')
  })
})
