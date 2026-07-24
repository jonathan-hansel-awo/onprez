import type { OwnerSection, PageSection, ProcessSection } from '@/types/page-sections'

const premiumTemplateSlugs = [
  'serene-wellness',
  'heavenly-pamper-palace',
  'regent-barber',
  'editorial-beauty',
  'kinetic-fitness',
  'clear-professional',
  'stillpoint-therapy',
  'frame-creative',
  'bright-education',
] as const

const stillpointImages = {
  hero: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1800&q=85',
  practice:
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=85',
  owner:
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=85',
  gallery: [
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1400&q=85',
  ],
}

const sereneFallbackImageFragments = [
  'photo-1600334089648-b0d9d3028eb2',
  'photo-1544161515-4ab6ce6db874',
  'photo-1570172619644-dfd03ed5d881',
  'photo-1540555700478-4be289fbecef',
  'photo-1600334129128-685c5582fd35',
]

function isSereneFallbackImage(url?: string) {
  return Boolean(url && sereneFallbackImageFragments.some(fragment => url.includes(fragment)))
}

function hasGenericTherapistCopy(value?: string) {
  if (!value) return true
  const normalized = value.toLowerCase()
  return (
    normalized.includes('this canonical preview uses the same sections') ||
    normalized.includes('introduce your work, your approach') ||
    normalized.includes('focused support for important work') ||
    normalized.includes('inside the experience') ||
    normalized.includes('start a conversation')
  )
}

export function normalizeBookingCtaLabel(label?: string): string | undefined {
  if (!label) return label

  const normalized = label.trim().toLowerCase().replace(/\s+/g, ' ')
  if (
    normalized === 'try booking' ||
    normalized === 'try bookings' ||
    normalized === 'try book' ||
    normalized.startsWith('try booking ')
  ) {
    return 'Book an appointment'
  }

  return label
}

export function getPremiumTemplateSlug(sections: PageSection[]): string | undefined {
  return premiumTemplateSlugs.find(slug =>
    sections.some(section => section.id.startsWith(`${slug}-`))
  )
}

function createStillpointOwner(order: number): OwnerSection {
  return {
    id: 'stillpoint-therapy-owner-3',
    type: 'OWNER',
    order,
    isVisible: true,
    appearance: {
      backgroundColor: '#f5f2ec',
      textColor: '#24312e',
      accentColor: '#526f68',
      contentWidth: 'wide',
      spacing: 'spacious',
    },
    data: {
      eyebrow: 'Meet your therapist',
      name: 'Dr Sarah Bennett',
      role: 'Integrative therapist · MBACP',
      biography:
        '<p>I offer a calm, collaborative space for adults navigating anxiety, grief, change, relationship difficulties, and the feeling of being stuck.</p><p>My approach brings together person-centred, psychodynamic, and trauma-informed practice. We work at a pace that feels manageable, without pressure to arrive with the right words.</p>',
      image: stillpointImages.owner,
      imagePosition: 'left',
      layout: 'editorial',
      credentials: [
        'BACP registered',
        'Trauma-informed practice',
        'Online and in-person sessions',
        'Confidential, inclusive support',
      ],
      quote: 'Therapy can begin before everything makes sense. We start with what is here.',
      signature: 'Sarah',
      ctaText: 'Book an initial consultation',
      ctaLink: '#book',
    },
  }
}

function createStillpointProcess(order: number): ProcessSection {
  return {
    id: 'stillpoint-therapy-process-5',
    type: 'PROCESS',
    order,
    isVisible: true,
    appearance: {
      backgroundColor: '#eef2ef',
      textColor: '#24312e',
      accentColor: '#526f68',
      contentWidth: 'wide',
      spacing: 'spacious',
    },
    data: {
      eyebrow: 'Your first steps',
      title: 'Starting therapy should feel clear',
      description:
        'You do not need to commit to a long course of therapy before we have spoken. The first steps are simple and unhurried.',
      layout: 'cards',
      columns: 3,
      steps: [
        {
          id: 'stillpoint-process-consultation',
          title: 'Choose a consultation',
          description:
            'Reserve a short introductory conversation so we can discuss what brings you here and what support may fit.',
        },
        {
          id: 'stillpoint-process-conversation',
          title: 'Meet without pressure',
          description:
            'Ask questions, get a sense of how I work, and decide whether continuing together feels right.',
        },
        {
          id: 'stillpoint-process-next-step',
          title: 'Agree the next step',
          description:
            'We can arrange regular sessions, choose a different form of support, or simply leave the decision open.',
        },
      ],
    },
  }
}

function getSectionId(sections: PageSection[], type: PageSection['type'], fallback: string) {
  return sections.find(section => section.type === type)?.id || fallback
}

export function materializePremiumTemplateSections(sections: PageSection[]): PageSection[] {
  const templateSlug = getPremiumTemplateSlug(sections)
  if (templateSlug !== 'stillpoint-therapy') return sections

  const unmaterializedStillpoint = sections.some(
    section =>
      (section.type === 'HERO' && isSereneFallbackImage(section.data.backgroundImage)) ||
      (section.type === 'ABOUT' && isSereneFallbackImage(section.data.image)) ||
      (section.type === 'GALLERY' &&
        section.data.images.some(image => isSereneFallbackImage(image.url)))
  )
  const ownerId = getSectionId(sections, 'OWNER', 'stillpoint-therapy-owner-3')
  const servicesId = getSectionId(sections, 'SERVICES', 'stillpoint-therapy-services-3')
  const processId = getSectionId(sections, 'PROCESS', 'stillpoint-therapy-process-5')
  const galleryId = getSectionId(sections, 'GALLERY', 'stillpoint-therapy-gallery-4')
  const contactId = getSectionId(sections, 'CONTACT', 'stillpoint-therapy-contact-7')

  const enrichedSections: PageSection[] = sections.map((section): PageSection => {
    switch (section.type) {
      case 'NAVBAR': {
        const existingLinks = section.data.links || []
        const desiredLinks = [
          {
            id: 'stillpoint-nav-about',
            label: 'The practice',
            href: '#stillpoint-therapy-about-2',
          },
          { id: 'stillpoint-nav-owner', label: 'Meet Sarah', href: `#${ownerId}` },
          { id: 'stillpoint-nav-services', label: 'Sessions', href: `#${servicesId}` },
          { id: 'stillpoint-nav-process', label: 'How it works', href: `#${processId}` },
          { id: 'stillpoint-nav-contact', label: 'Contact', href: `#${contactId}` },
        ]
        const hasRichNavigation = existingLinks.some(link => link.href === `#${ownerId}`)

        return {
          ...section,
          order: 0,
          data: {
            ...section.data,
            links: unmaterializedStillpoint || !hasRichNavigation ? desiredLinks : existingLinks,
            ctaText:
              unmaterializedStillpoint || !section.data.ctaText
                ? 'Book an initial consultation'
                : normalizeBookingCtaLabel(section.data.ctaText),
            ctaLink: section.data.ctaLink || '#book',
            announcement:
              section.data.announcement ||
              'Confidential therapy · online and in person · a calm first conversation',
          },
        }
      }

      case 'HERO': {
        const shouldApplyTemplateArt =
          unmaterializedStillpoint || isSereneFallbackImage(section.data.backgroundImage)

        return {
          ...section,
          order: 1,
          appearance: shouldApplyTemplateArt
            ? {
                ...section.appearance,
                backgroundColor: '#24312e',
                textColor: '#ffffff',
                accentColor: '#b8d0c7',
                contentWidth: 'wide',
                spacing: 'spacious',
              }
            : section.appearance,
          data: {
            ...section.data,
            ...(shouldApplyTemplateArt
              ? {
                  eyebrow: 'Confidential support · online and in person',
                  subtitle: 'A calmer place to understand what you are carrying.',
                  backgroundImage: stillpointImages.hero,
                  ctaText: 'Book an initial consultation',
                  ctaLink: '#book',
                  secondaryCtaText: 'Meet your therapist',
                  secondaryCtaLink: `#${ownerId}`,
                  layout: 'cover' as const,
                  imagePosition: 'right' as const,
                  imageFocalPoint: 'center' as const,
                  minHeight: 'viewport' as const,
                  alignment: 'left' as const,
                  overlay: true,
                  overlayColor: '#20322d',
                  overlayOpacity: 72,
                  overlayStyle: 'gradient-diagonal' as const,
                  textColor: 'light' as const,
                  textShadow: true,
                  variant: 'professional' as const,
                  imageTreatment: 'full' as const,
                  floatingCard: {
                    eyebrow: 'Begin gently',
                    title: 'A first conversation, not a commitment',
                    description:
                      'Use an introductory consultation to ask questions and decide what feels right.',
                  },
                  meta: ['Confidential', 'BACP registered', 'Online and in person'],
                  decorativeText: 'BREATHE',
                  showScrollCue: true,
                }
              : {
                  ctaText: normalizeBookingCtaLabel(section.data.ctaText),
                  secondaryCtaText: normalizeBookingCtaLabel(section.data.secondaryCtaText),
                }),
          },
        }
      }

      case 'ABOUT': {
        const shouldApplyPracticeStory =
          unmaterializedStillpoint ||
          hasGenericTherapistCopy(section.data.content) ||
          isSereneFallbackImage(section.data.image)

        return {
          ...section,
          order: 2,
          appearance: shouldApplyPracticeStory
            ? {
                ...section.appearance,
                backgroundColor: '#ffffff',
                textColor: '#24312e',
                accentColor: '#526f68',
                contentWidth: 'wide',
                spacing: 'spacious',
              }
            : section.appearance,
          data: shouldApplyPracticeStory
            ? {
                ...section.data,
                eyebrow: 'The practice',
                title: 'A private place to pause and be heard',
                content:
                  '<p>Stillpoint is a quiet, inclusive therapy practice for adults who need room to think, feel, and make sense of what has become difficult.</p><p>Sessions are collaborative rather than prescriptive. There is no demand to perform wellness, explain everything at once, or move faster than feels safe.</p>',
                image: stillpointImages.practice,
                imagePosition: 'right',
                layout: 'editorial',
                imageShape: 'landscape',
                highlights: [
                  'Confidential sessions',
                  'Online and in-person options',
                  'Inclusive and affirming practice',
                  'Clear fees and appointment times',
                ],
                variant: 'story',
                quote: 'A useful session is not always the one with the neatest conclusion.',
                stats: [
                  { value: '50 min', label: 'Therapy session' },
                  { value: '1:1', label: 'Private support' },
                  { value: 'Flexible', label: 'Online or in person' },
                ],
                imageTreatment: 'framed',
                secondaryImage: undefined,
              }
            : section.data,
        }
      }

      case 'SERVICES': {
        const shouldApplySessionDesign =
          unmaterializedStillpoint || hasGenericTherapistCopy(section.data.title)

        return {
          ...section,
          order: 4,
          appearance: shouldApplySessionDesign
            ? {
                ...section.appearance,
                backgroundColor: '#dfe8e3',
                textColor: '#24312e',
                accentColor: '#526f68',
                contentWidth: 'wide',
                spacing: 'spacious',
              }
            : section.appearance,
          data: shouldApplySessionDesign
            ? {
                ...section.data,
                eyebrow: 'Ways to begin',
                title: 'Therapy shaped around what you need now',
                description:
                  'Choose an introductory conversation or a full session. Fees, duration, and live availability are clear before you book.',
                layout: 'grid',
                columns: 3,
                cardStyle: 'elevated',
                showImages: false,
                showPrices: true,
              }
            : section.data,
        }
      }

      case 'GALLERY': {
        const shouldApplyQuietGallery =
          unmaterializedStillpoint ||
          hasGenericTherapistCopy(section.data.title) ||
          section.data.images.some(image => isSereneFallbackImage(image.url))

        return {
          ...section,
          order: 6,
          appearance: shouldApplyQuietGallery
            ? {
                ...section.appearance,
                backgroundColor: '#24312e',
                textColor: '#f6f4ef',
                accentColor: '#b8d0c7',
                contentWidth: 'wide',
                spacing: 'spacious',
              }
            : section.appearance,
          data: shouldApplyQuietGallery
            ? {
                ...section.data,
                eyebrow: 'The therapy space',
                title: 'Quiet, private, and designed for conversation',
                images: stillpointImages.gallery.map((url, index) => ({
                  url,
                  alt: [
                    'A calm private therapy room',
                    'A comfortable and light-filled consultation space',
                    'A quiet professional setting for confidential conversations',
                  ][index],
                })),
                layout: 'carousel',
                columns: 3,
                featuredImageIndex: 0,
                gap: 'normal',
                imageRadius: 'soft',
              }
            : section.data,
        }
      }

      case 'FAQ':
        return { ...section, order: 8 }

      case 'TESTIMONIALS':
        return { ...section, order: 7 }

      case 'CONTACT': {
        const shouldApplyContactDesign =
          unmaterializedStillpoint ||
          hasGenericTherapistCopy(section.data.title) ||
          isSereneFallbackImage(section.data.backgroundImage)

        return {
          ...section,
          order: 9,
          appearance: shouldApplyContactDesign
            ? {
                ...section.appearance,
                backgroundColor: '#f5f2ec',
                textColor: '#24312e',
                accentColor: '#526f68',
                contentWidth: 'wide',
                spacing: 'spacious',
              }
            : section.appearance,
          data: shouldApplyContactDesign
            ? {
                ...section.data,
                title: 'Take the first step at your own pace',
                eyebrow: 'Begin with a conversation',
                description:
                  'Choose an introductory consultation, review live availability, or get in touch with a question before booking.',
                ctaText: 'Book an initial consultation',
                ctaLink: '#book',
                secondaryCtaText: 'Review sessions',
                secondaryCtaLink: `#${servicesId}`,
                layout: 'panel',
                backgroundImage: undefined,
                note: 'Messages are handled confidentially and answered within one business day.',
                showPhone: true,
                showEmail: true,
                showAddress: true,
                showMap: false,
                showSocialMedia: false,
              }
            : {
                ...section.data,
                ctaText: normalizeBookingCtaLabel(section.data.ctaText),
                secondaryCtaText: normalizeBookingCtaLabel(section.data.secondaryCtaText),
              },
        }
      }

      default:
        return section
    }
  })

  if (unmaterializedStillpoint && !enrichedSections.some(section => section.type === 'OWNER')) {
    enrichedSections.push(createStillpointOwner(3))
  }

  if (unmaterializedStillpoint && !enrichedSections.some(section => section.type === 'PROCESS')) {
    enrichedSections.push(createStillpointProcess(5))
  }

  return enrichedSections.sort((left, right) => left.order - right.order)
}

export function applyPremiumRuntimeArtDirection(sections: PageSection[]): PageSection[] {
  const materializedSections = materializePremiumTemplateSections(sections)
  const templateSlug = getPremiumTemplateSlug(materializedSections)
  if (!templateSlug) return materializedSections

  return materializedSections.map(section => {
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
        secondaryCtaText: normalizeBookingCtaLabel(section.data.secondaryCtaText),
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

    if (section.type === 'OWNER') {
      return {
        ...section,
        data: {
          ...section.data,
          ctaText: normalizeBookingCtaLabel(section.data.ctaText),
        },
      }
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

    return section
  })
}
