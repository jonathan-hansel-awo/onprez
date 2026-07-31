import { fireEvent } from '@testing-library/react'
import { render, screen } from '@/lib/test-utils'
import {
  getRealisticDemoFixture,
  RealisticDemoBookingJourney,
} from '@/components/templates/RealisticDemoBookingJourney'

describe('RealisticDemoBookingJourney', () => {
  it('renders the complete wellness demo and lets a visitor review a sample booking', () => {
    const signupHref = '/signup?template=heavenly-pamper-palace'

    render(
      <RealisticDemoBookingJourney templateSlug="heavenly-pamper-palace" signupHref={signupHref} />
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
    expect(screen.getByText('Thursday · 14:00')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create a page like this' })).toHaveAttribute(
      'href',
      signupHref
    )
  })

  it('uses the second realistic fixture rather than generic template filler', () => {
    render(
      <RealisticDemoBookingJourney
        templateSlug="editorial-beauty"
        signupHref="/signup?template=editorial-beauty"
      />
    )

    expect(screen.getByRole('button', { name: /Medium Knotless Braids/ })).toBeInTheDocument()
    expect(screen.getByText('Bridal bookings only')).toBeInTheDocument()
    expect(
      screen.getByText(/Braiding hair is included only where the service description confirms it/)
    ).toBeInTheDocument()
    expect(getRealisticDemoFixture('editorial-beauty')?.name).toBe('Crown & Canvas Studio')
  })

  it('does not add demo-only operational content to ordinary templates', () => {
    const { container } = render(
      <RealisticDemoBookingJourney
        templateSlug="regent-barber"
        signupHref="/signup?template=regent-barber"
      />
    )

    expect(container).toBeEmptyDOMElement()
    expect(getRealisticDemoFixture('regent-barber')).toBeUndefined()
  })
})
