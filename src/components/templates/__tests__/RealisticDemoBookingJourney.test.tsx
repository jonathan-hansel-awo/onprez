import { fireEvent } from '@testing-library/react'
import { render, screen } from '@/lib/test-utils'
import {
  getTemplateBookingDemoFixture,
  RealisticDemoBookingJourney,
} from '@/components/templates/RealisticDemoBookingJourney'
import { getPresenceTemplate, presenceTemplateCatalogue } from '@/data/presence-template-catalogue'

function requireTemplate(slug: string) {
  const template = getPresenceTemplate(slug)

  if (!template) throw new Error(`Missing template fixture: ${slug}`)

  return template
}

describe('RealisticDemoBookingJourney', () => {
  it('renders the complete wellness demo and lets a visitor review a sample booking', () => {
    const template = requireTemplate('heavenly-pamper-palace')
    const signupHref = '/signup?template=heavenly-pamper-palace'

    render(
      <RealisticDemoBookingJourney
        template={template}
        businessName="Aurelia Wellness House"
        signupHref={signupHref}
      />
    )

    expect(screen.getByRole('heading', { name: /try the client journey/i })).toBeInTheDocument()
    expect(screen.getByText('Opening hours')).toBeInTheDocument()
    expect(screen.getByText('Tuesday')).toBeInTheDocument()
    expect(
      screen.getByText('A 30% deposit secures treatments of 60 minutes or longer.')
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Serenity Massage, £70, 60 min' }))
    fireEvent.click(screen.getByRole('button', { name: 'Thursday · 14:00' }))
    fireEvent.click(screen.getByRole('button', { name: 'Review demo booking' }))

    expect(screen.getByText('Demo booking ready')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Serenity Massage' })).toBeInTheDocument()
    expect(screen.getByText('Aurelia Wellness House')).toBeInTheDocument()
    expect(screen.getByText('Thursday · 14:00')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create a page like this' })).toHaveAttribute(
      'href',
      signupHref
    )
  })

  it('uses the second detailed fixture rather than generic template filler', () => {
    const template = requireTemplate('editorial-beauty')

    render(
      <RealisticDemoBookingJourney
        template={template}
        businessName="Crown & Canvas Studio"
        signupHref="/signup?template=editorial-beauty"
      />
    )

    expect(screen.getByRole('button', { name: /Medium Knotless Braids/ })).toBeInTheDocument()
    expect(screen.getByText('Bridal bookings only')).toBeInTheDocument()
    expect(
      screen.getByText(/Braiding hair is included only where the service description confirms it/)
    ).toBeInTheDocument()
    expect(getTemplateBookingDemoFixture(template).isDetailedFixture).toBe(true)
  })

  it('creates a complete interactive booking fixture for every catalogue template', () => {
    for (const template of presenceTemplateCatalogue) {
      const demo = getTemplateBookingDemoFixture(template)

      expect(demo.name).toBe(template.preview.businessName)
      expect(demo.services.length).toBeGreaterThan(0)
      expect(demo.bookingSlots.length).toBeGreaterThanOrEqual(4)
      expect(demo.hours).toHaveLength(7)
      expect(demo.policies.length).toBeGreaterThanOrEqual(3)
      expect(demo.trustSignals.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('renders the booking journey for an ordinary template and preserves personalisation', () => {
    const template = requireTemplate('regent-barber')

    render(
      <RealisticDemoBookingJourney
        template={template}
        businessName="Hansel Grooming Studio"
        signupHref="/signup?template=regent-barber"
      />
    )

    expect(
      screen.getByRole('button', { name: 'Signature Cut, £28, 45 minutes' })
    ).toBeInTheDocument()
    expect(screen.getByText('12 Market Street, Cambridge, CB1 2AB')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Review demo booking' }))

    expect(screen.getByText('Hansel Grooming Studio')).toBeInTheDocument()
    expect(getTemplateBookingDemoFixture(template).isDetailedFixture).toBe(false)
  })
})
