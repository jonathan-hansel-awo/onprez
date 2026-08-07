import { homepagePositioning, homepageScenario } from '../homepage-positioning'

describe('homepage positioning', () => {
  it('states the product outcome in concrete terms', () => {
    const headline = homepagePositioning.headlineLines.join(' ').toLowerCase()
    const summary = homepagePositioning.summary.toLowerCase()

    expect(headline).toContain('online home')
    expect(headline).toContain('seen')
    expect(headline).toContain('shared')
    expect(headline).toContain('booked')
    expect(summary).toContain('brand')
    expect(summary).toContain('work')
    expect(summary).toContain('services')
    expect(summary).toContain('book')
    expect(summary).toContain('schedule')
    expect(homepagePositioning.primaryCta).toBe('Claim Your Handle Free')
    expect(homepagePositioning.secondaryCta).toBe('See What Clients See')
  })

  it('identifies beauty and wellness as the first launch niche', () => {
    const badge = homepagePositioning.badge.toLowerCase()
    const audience = homepagePositioning.audience.toLowerCase()

    expect(badge).toContain('beauty')
    expect(badge).toContain('wellness')
    expect(badge).toContain('small teams')
    expect(audience).toContain('independent beauty and wellness professionals')
    expect(audience).toContain('hair')
    expect(audience).toContain('makeup')
    expect(audience).toContain('nails')
    expect(audience).toContain('massage')
    expect(audience).toContain('spas')
    expect(audience).toContain('salons')
    expect(audience).toContain('mobile beauty')
  })

  it('avoids the previous broad homepage language', () => {
    const positioningCopy = [
      homepagePositioning.headlineLines.join(' '),
      homepagePositioning.summary,
      homepagePositioning.audience,
    ]
      .join(' ')
      .toLowerCase()

    expect(positioningCopy).not.toContain('complete online presence')
    expect(positioningCopy).not.toContain('all-in-one')
    expect(positioningCopy).not.toContain('and more')
  })

  it('shows the complete journey for a realistic beauty business', () => {
    expect(homepageScenario.businessName).toBe('Crown & Canvas Studio')
    expect(homepageScenario.handle).toContain('onprez.com/')
    expect(homepageScenario.services).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Soft Glam Makeup', price: '£65', duration: '90 min' }),
        expect.objectContaining({ name: 'Silk Press', price: '£55', duration: '120 min' }),
      ])
    )

    const journeyCopy = homepageScenario.journey
      .map(step => `${step.title} ${step.description}`)
      .join(' ')
      .toLowerCase()

    expect(journeyCopy).toContain('share one link')
    expect(journeyCopy).toContain('available times')
    expect(journeyCopy).toContain('booking confirmation')
    expect(journeyCopy).toContain('dashboard')
  })
})
