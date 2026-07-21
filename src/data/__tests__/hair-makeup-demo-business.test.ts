import { hairMakeupDemoBusiness, hairMakeupDemoHref } from '@/data/hair-makeup-demo-business'

describe('hair and makeup demo business', () => {
  it('contains a complete, sector-specific presence-page fixture', () => {
    expect(hairMakeupDemoBusiness.services.length).toBeGreaterThanOrEqual(6)
    expect(hairMakeupDemoBusiness.hours).toHaveLength(7)
    expect(hairMakeupDemoBusiness.faqs.length).toBeGreaterThanOrEqual(5)
    expect(hairMakeupDemoBusiness.reviews.length).toBeGreaterThanOrEqual(3)
    expect(hairMakeupDemoBusiness.policies.length).toBeGreaterThanOrEqual(4)
    expect(hairMakeupDemoBusiness.owner.credentials.length).toBeGreaterThanOrEqual(3)
  })

  it('gives every service realistic booking and preparation information', () => {
    const serviceIds = hairMakeupDemoBusiness.services.map(service => service.id)

    expect(new Set(serviceIds).size).toBe(serviceIds.length)
    expect(
      hairMakeupDemoBusiness.services.every(
        service =>
          service.description.length >= 70 &&
          service.preparation.length >= 60 &&
          service.price &&
          service.duration &&
          hairMakeupDemoBusiness.images[service.image]
      )
    ).toBe(true)
    expect(hairMakeupDemoBusiness.bookingSlots.length).toBeGreaterThanOrEqual(4)
  })

  it('uses secure imagery and links directly to the client-view booking demo', () => {
    expect(
      Object.values(hairMakeupDemoBusiness.images).every(url => url.startsWith('https://'))
    ).toBe(true)
    expect(hairMakeupDemoHref).toContain(hairMakeupDemoBusiness.templateSlug)
    expect(hairMakeupDemoHref).toContain('view=client')
  })
})
