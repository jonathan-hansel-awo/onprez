import { render, screen, waitFor } from '@/lib/test-utils'
import {
  PresenceTrustStrip,
  SectionBookingCta,
  StickyMobileBookingCta,
} from '@/components/presence/PresenceConversion'
import { HeroSection } from '@/components/presence/sections/HeroSection'
import { ServicesSection } from '@/components/presence/sections/ServicesSection'
import type {
  HeroSection as HeroSectionType,
  ServicesSection as ServicesSectionType,
} from '@/types/page-sections'

describe('public presence conversion controls', () => {
  afterEach(() => {
    jest.restoreAllMocks()
    delete (global as { fetch?: typeof fetch }).fetch
  })

  it('renders genuine trust signals without inventing missing claims', () => {
    render(
      <PresenceTrustStrip
        signals={{
          location: 'Ely, Cambridgeshire',
          averageRating: 4.8,
          reviewCount: 24,
          cancellationNoticeHours: 24,
          credentials: ['Certified therapist'],
        }}
      />
    )

    expect(screen.getByRole('complementary', { name: 'Business highlights' })).toBeInTheDocument()
    expect(screen.getByText('4.8 from 24 reviews')).toBeInTheDocument()
    expect(screen.getByText('Ely, Cambridgeshire')).toBeInTheDocument()
    expect(screen.getByText('Certified therapist')).toBeInTheDocument()
    expect(screen.queryByText(/response/i)).not.toBeInTheDocument()
  })

  it('links both repeated and sticky booking calls to the public booking flow', () => {
    render(
      <>
        <SectionBookingCta bookingHref="/sage-studio/book" businessName="Sage Studio" />
        <StickyMobileBookingCta bookingHref="/sage-studio/book" businessName="Sage Studio" />
      </>
    )

    const bookingLinks = screen.getAllByRole('link')
    expect(bookingLinks).toHaveLength(2)
    bookingLinks.forEach(link => expect(link).toHaveAttribute('href', '/sage-studio/book'))
  })

  it('turns the default hero contact CTA into a direct booking action', () => {
    const section: HeroSectionType = {
      id: 'hero',
      type: 'HERO',
      order: 0,
      isVisible: true,
      data: {
        title: 'Professional massage in Ely',
        ctaText: 'Book an appointment',
        ctaLink: '#contact',
      },
    }

    render(<HeroSection section={section} bookingHref="/sage-studio/book" />)

    expect(screen.getByRole('link', { name: /book an appointment/i })).toHaveAttribute(
      'href',
      '/sage-studio/book'
    )
  })

  it('shows service price, duration, live availability, and a direct service booking link', async () => {
    const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input)

      if (url.includes('/api/public/businesses/')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              services: [
                {
                  id: 'service-1',
                  name: 'Deep tissue massage',
                  description: 'A focused treatment.',
                  price: 70,
                  priceType: 'FIXED',
                  currency: 'GBP',
                  duration: 60,
                  category: { name: 'Massage' },
                  imageUrl: null,
                },
              ],
            },
          }),
        } as Response
      }

      return {
        ok: true,
        json: async () => ({
          success: true,
          data: { nextAvailable: { date: '2026-07-23', time: '10:00' } },
        }),
      } as Response
    })
    global.fetch = fetchMock as typeof fetch

    const section: ServicesSectionType = {
      id: 'services',
      type: 'SERVICES',
      order: 1,
      isVisible: true,
      data: { title: 'Services', showPrices: true, layout: 'grid' },
    }

    render(<ServicesSection section={section} businessHandle="sage-studio" />)

    expect(await screen.findByText('Deep tissue massage')).toBeInTheDocument()
    expect(screen.getByText('60 min')).toBeInTheDocument()
    expect(screen.getByText('£70.00')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByText(/Next available Thu 23 Jul at 10:00/)).toBeInTheDocument()
    )
    expect(screen.getByRole('link', { name: /book this service/i })).toHaveAttribute(
      'href',
      '/sage-studio/book/service-1'
    )
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
