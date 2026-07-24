import { BusinessCategory } from '@prisma/client'
import { createCanonicalPresencePageContent } from '../canonical-template-engine'
import { applyPremiumRuntimeArtDirection } from '../premium-runtime-art-direction'

describe('Stillpoint Therapy template', () => {
  it('renders the complete art-directed therapist journey through the canonical renderer', () => {
    const page = createCanonicalPresencePageContent(
      'Stillpoint Therapy',
      BusinessCategory.OTHER,
      'stillpoint-therapy',
      { mode: 'preview' }
    )
    const sections = applyPremiumRuntimeArtDirection(page.sections)

    expect(sections.map(section => section.type)).toEqual([
      'NAVBAR',
      'HERO',
      'ABOUT',
      'OWNER',
      'SERVICES',
      'PROCESS',
      'GALLERY',
      'FAQ',
      'CONTACT',
    ])

    const hero = sections.find(section => section.type === 'HERO')
    const owner = sections.find(section => section.type === 'OWNER')
    const gallery = sections.find(section => section.type === 'GALLERY')
    const contact = sections.find(section => section.type === 'CONTACT')

    expect(hero).toMatchObject({
      data: {
        variant: 'professional',
        layout: 'cover',
        imageTreatment: 'full',
        ctaText: 'Book an initial consultation',
        secondaryCtaText: 'Meet your therapist',
      },
    })
    expect(owner).toMatchObject({
      data: {
        name: 'Dr Sarah Bennett',
        role: 'Integrative therapist · MBACP',
      },
    })
    expect(gallery).toMatchObject({ data: { layout: 'carousel' } })
    expect(contact).toMatchObject({
      data: {
        layout: 'panel',
        ctaText: 'Book an initial consultation',
      },
    })
  })
})
