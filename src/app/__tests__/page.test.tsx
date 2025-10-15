import { render, screen } from '@/lib/test-utils'
import HomePage from '@/app/page'

describe('Home Page', () => {
  it('renders the hero section', () => {
    render(<HomePage />)

    expect(screen.getAllByText(/Own Your/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Online Presence/i).length).toBeGreaterThanOrEqual(1)
  })

  it('displays the main CTA button', () => {
    render(<HomePage />)

    const ctaButtons = screen.getAllByRole('button', {
      name: /Claim Your Handle Free/i,
    })

    // Should appear at least once, likely 3 times
    expect(ctaButtons.length).toBeGreaterThanOrEqual(1)
  })

  it('shows trust indicators', () => {
    render(<HomePage />)

    expect(screen.getByText(/2,500\+ professionals trust OnPrez/i)).toBeInTheDocument()
    expect(screen.getByText(/15min/i)).toBeInTheDocument()
    expect(screen.getByText(/45K\+/i)).toBeInTheDocument()
  })

  it('renders feature section', () => {
    render(<HomePage />)

    expect(screen.getByText(/Everything you need, nothing you don't/i)).toBeInTheDocument()
  })

  it('displays pricing section', () => {
    render(<HomePage />)

    expect(screen.getByText(/Start free\. Grow when you're ready\./i)).toBeInTheDocument()
    expect(screen.getByText(/\$0/i)).toBeInTheDocument()
    expect(screen.getByText(/\$29/i)).toBeInTheDocument()
  })

  it('shows testimonials', () => {
    render(<HomePage />)

    expect(screen.getByText(/Sarah Mitchell/i)).toBeInTheDocument()
    expect(screen.getByText(/Marcus Thompson/i)).toBeInTheDocument()
  })
})
