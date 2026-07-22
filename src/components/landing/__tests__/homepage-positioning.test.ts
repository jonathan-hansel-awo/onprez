import { homepagePositioning, homepageScenario } from '../homepage-positioning'

describe('homepage positioning', () => {
  it('states the product outcome in concrete terms', () => {
    const headline = homepagePositioning.headlineLines.join(' ').toLowerCase()

    expect(headline).toContain('services')
    expect(headline).toContain('availability')
    expect(headline).toContain('bookings')
    expect(homepagePositioning.summary.toLowerCase()).toContain('clients')
    expect(homepagePositioning.summary.toLowerCase()).toContain('book')
  })

  it('identifies the intended service-professional audience', () => {
    expect(homepagePositioning.badge.toLowerCase()).toContain('service professionals')
    expect(homepagePositioning.audience.toLowerCase()).toContain('independent professionals')
    expect(homepagePositioning.audience.toLowerCase()).toContain('small teams')
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
  })

  it('shows the complete journey after a professional shares their link', () => {
    expect(homepageScenario.handle).toContain('onprez.com/')
    expect(homepageScenario.services).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Soft Glam Makeup', price: '£65', duration: '90 min' }),
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
