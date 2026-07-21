import { realisticDemoBusiness, realisticDemoHref } from '@/data/realistic-demo-business'

describe('realistic demo business', () => {
  it('contains enough realistic content to exercise a full presence page', () => {
    expect(realisticDemoBusiness.services.length).toBeGreaterThanOrEqual(5)
    expect(realisticDemoBusiness.hours).toHaveLength(7)
    expect(realisticDemoBusiness.faqs.length).toBeGreaterThanOrEqual(4)
    expect(realisticDemoBusiness.reviews.length).toBeGreaterThanOrEqual(3)
    expect(realisticDemoBusiness.policies.length).toBeGreaterThanOrEqual(3)
    expect(realisticDemoBusiness.owner.credentials.length).toBeGreaterThanOrEqual(2)
  })

  it('keeps services and booking examples complete and uniquely addressable', () => {
    const serviceIds = realisticDemoBusiness.services.map(service => service.id)

    expect(new Set(serviceIds).size).toBe(serviceIds.length)
    expect(
      realisticDemoBusiness.services.every(
        service =>
          service.name &&
          service.description.length >= 60 &&
          service.price &&
          service.duration &&
          realisticDemoBusiness.images[service.image]
      )
    ).toBe(true)
    expect(realisticDemoBusiness.bookingSlots.length).toBeGreaterThanOrEqual(4)
  })

  it('uses secure imagery and a stable client-view route for screenshots and onboarding', () => {
    expect(
      Object.values(realisticDemoBusiness.images).every(url => url.startsWith('https://'))
    ).toBe(true)
    expect(realisticDemoHref).toContain(realisticDemoBusiness.templateSlug)
    expect(realisticDemoHref).toContain('view=client')
  })
})
