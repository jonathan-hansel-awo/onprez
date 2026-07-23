import type { PageSection } from '@/types/page-sections'

const premiumTemplateSlugs = [
  'serene-wellness',
  'heavenly-pamper-palace',
  'regent-barber',
  'editorial-beauty',
  'kinetic-fitness',
  'clear-professional',
  'frame-creative',
  'bright-education',
] as const

export function normalizeBookingCtaLabel(label?: string): string | undefined {
  if (!label) return label

  const normalized = label.trim().toLowerCase().replace(/\s+/g, ' ')
  if (normalized === 'try booking' || normalized === 'try bookings' || normalized === 'try book') {
    return 'Book an appointment'
  }

  return label
}

export function getPremiumTemplateSlug(sections: PageSection[]): string | undefined {
  return premiumTemplateSlugs.find(slug =>
    sections.some(section => section.id.startsWith(`${slug}-`))
  )
}

export function applyPremiumRuntimeArtDirection(sections: PageSection[]): PageSection[] {
  const templateSlug = getPremiumTemplateSlug(sections)
  if (!templateSlug) return sections

  return sections.map(section => {
    const data = 'data' in section ? section.data : undefined

    if (section.type === 'NAVBAR') {
      return {
        ...section,
        data: {
          ...section.data,
          ctaText: normalizeBookingCtaLabel(section.data.ctaText),
        },
      }
    }

    if (section.type === 'HERO') {
      const baseData = {
        ...section.data,
        ctaText: normalizeBookingCtaLabel(section.data.ctaText),
      }

      if (templateSlug === 'editorial-beauty') {
        return {
          ...section,
          appearance: {
            ...section.appearance,
            backgroundColor: '#2f1720',
            textColor: '#ffffff',
            accentColor: '#ef8dab',
          },
          data: {
            ...baseData,
            layout: 'cover',
            imageFocalPoint: 'center',
            minHeight: 'viewport',
            alignment: 'left',
            overlay: true,
            overlayColor: '#2f1720',
            overlayOpacity: 76,
            overlayStyle: 'gradient-diagonal',
            textColor: 'light',
            textShadow: true,
            imageTreatment: 'full',
            floatingCard: undefined,
            meta: [],
          },
        }
      }

      return { ...section, data: baseData }
    }

    if (section.type === 'CONTACT') {
      return {
        ...section,
        data: {
          ...section.data,
          ctaText: normalizeBookingCtaLabel(section.data.ctaText),
          secondaryCtaText: normalizeBookingCtaLabel(section.data.secondaryCtaText),
        },
      }
    }

    return data ? section : section
  })
}
