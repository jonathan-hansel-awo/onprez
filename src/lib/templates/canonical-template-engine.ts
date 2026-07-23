import type { BusinessCategory } from '@prisma/client'
import { hairMakeupDemoBusiness } from '@/data/hair-makeup-demo-business'
import {
  getPresenceTemplate,
  presenceTemplateCatalogue,
  type TemplateCatalogueItem,
} from '@/data/presence-template-catalogue'
import { realisticDemoBusiness } from '@/data/realistic-demo-business'
import type { PageSection, SectionType } from '@/types/page-sections'

export const CANONICAL_TEMPLATE_VERSION = 2

export interface CanonicalPresenceTheme {
  primaryColor: string
  secondaryColor: string
  accentColor?: string
  backgroundColor: string
  textColor: string
  fontFamily: string
  headingFont?: string
  buttonStyle?: 'rounded' | 'square' | 'pill'
  spacing?: 'compact' | 'normal' | 'relaxed'
  backgroundType?: 'solid' | 'gradient' | 'pattern'
  backgroundGradient?: {
    type: 'linear' | 'radial'
    angle?: number
    colors: string[]
  }
  backgroundPattern?: {
    type: 'dots' | 'grid' | 'diagonal' | 'waves' | 'none'
    color?: string
    opacity?: number
    size?: 'small' | 'medium' | 'large'
  }
}

export interface CanonicalPreviewService {
  id: string
  name: string
  description: string
  price: number
  duration: number
  priceType?: 'FIXED' | 'STARTING_AT' | 'RANGE' | 'FREE' | 'CONTACT'
  priceRangeMin?: number | null
  priceRangeMax?: number | null
  currency?: string
  category?: { name: string } | null
  imageUrl?: string | null
}

export interface CanonicalTemplateBusinessData {
  phone?: string
  email?: string
  address?: string
  website?: string
  socialLinks?: {
    instagram?: string
  }
}

export interface CanonicalPresencePage {
  templateSlug?: string
  templateName?: string
  templateVersion?: number
  sections: PageSection[]
  theme?: CanonicalPresenceTheme
  previewServices?: CanonicalPreviewService[]
  previewBusinessData?: CanonicalTemplateBusinessData
}

export interface CreateCanonicalPresencePageOptions {
  mode?: 'account' | 'preview'
  existingSections?: PageSection[] | null
  preserveContent?: boolean
}

const genericImages: Record<string, { hero: string; about: string; gallery: string[] }> = {
  'serene-wellness': {
    hero: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=1800&q=85',
    about:
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1400&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=1200&q=85',
    ],
  },
  'regent-barber': {
    hero: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1800&q=85',
    about:
      'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1400&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=85',
    ],
  },
  'kinetic-fitness': {
    hero: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1800&q=85',
    about:
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1400&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1200&q=85',
    ],
  },
  'clear-professional': {
    hero: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1800&q=85',
    about:
      'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=85',
    ],
  },
  'frame-creative': {
    hero: 'https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?auto=format&fit=crop&w=1800&q=85',
    about:
      'https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=1400&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=85',
    ],
  },
  'bright-education': {
    hero: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1800&q=85',
    about:
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=85',
    ],
  },
}

interface PremiumTemplateProfile {
  navbarVariant: 'standard' | 'floating' | 'editorial'
  navbarAnnouncement?: string
  heroVariant: 'luxury' | 'editorial' | 'bold' | 'professional' | 'creative' | 'education'
  imageTreatment: 'full' | 'frame' | 'arch' | 'offset' | 'collage'
  heroMeta: string[]
  floatingCard: { eyebrow: string; title: string; description: string }
  decorativeText: string
  aboutVariant: 'story' | 'atelier' | 'credentials'
  aboutQuote: string
  aboutStats: Array<{ value: string; label: string }>
  aboutImageTreatment: 'arch' | 'stacked' | 'framed' | 'polaroid'
  secondaryImageIndex?: number
  galleryLayout: 'grid' | 'masonry' | 'carousel' | 'editorial'
  contactLayout: 'panel' | 'immersive'
  contactEyebrow: string
  contactDescription: string
  contactNote: string
  backgroundType: 'solid' | 'gradient' | 'pattern'
  backgroundPattern?: CanonicalPresenceTheme['backgroundPattern']
  backgroundGradient?: CanonicalPresenceTheme['backgroundGradient']
}

const premiumTemplateProfiles: Record<string, PremiumTemplateProfile> = {
  'serene-wellness': {
    navbarVariant: 'floating',
    navbarAnnouncement: 'Quiet appointments · thoughtful care · simple online booking',
    heroVariant: 'luxury',
    imageTreatment: 'arch',
    heroMeta: ['Calm studio', 'Tailored care', 'Live availability'],
    floatingCard: {
      eyebrow: 'Your reset',
      title: 'Space to slow down',
      description: 'Choose a treatment and reserve a time that fits your week.',
    },
    decorativeText: 'RESTORE',
    aboutVariant: 'story',
    aboutQuote: 'Care feels different when nothing is rushed.',
    aboutStats: [
      { value: '1:1', label: 'Personal care' },
      { value: '60 min', label: 'Signature ritual' },
      { value: 'Online', label: 'Easy booking' },
    ],
    aboutImageTreatment: 'arch',
    secondaryImageIndex: 1,
    galleryLayout: 'masonry',
    contactLayout: 'immersive',
    contactEyebrow: 'Make room for calm',
    contactDescription:
      'Choose your treatment, see live availability, and reserve a quieter moment.',
    contactNote: 'Not sure what to book? Get in touch and we will help you choose.',
    backgroundType: 'pattern',
    backgroundPattern: { type: 'waves', color: '#6f7562', opacity: 5, size: 'large' },
  },
  'heavenly-pamper-palace': {
    navbarVariant: 'floating',
    navbarAnnouncement: 'Premium rituals · luminous care · beautifully unhurried appointments',
    heroVariant: 'luxury',
    imageTreatment: 'arch',
    heroMeta: ['Private studio', 'Personalised rituals', 'Book online'],
    floatingCard: {
      eyebrow: 'The signature experience',
      title: 'Glow, rest, return renewed',
      description: 'A considered appointment shaped around how you want to feel.',
    },
    decorativeText: 'HEAVENLY',
    aboutVariant: 'story',
    aboutQuote: 'Luxury is attention: to comfort, detail, and the pace of the experience.',
    aboutStats: [
      { value: '5★', label: 'Client care' },
      { value: '1:1', label: 'Private rituals' },
      { value: 'Live', label: 'Availability' },
    ],
    aboutImageTreatment: 'arch',
    galleryLayout: 'editorial',
    contactLayout: 'immersive',
    contactEyebrow: 'Your time, beautifully held',
    contactDescription:
      'Select a ritual, find a time, and arrive knowing every detail has been considered.',
    contactNote: 'Questions before booking? Call or email the studio for personal guidance.',
    backgroundType: 'gradient',
    backgroundGradient: { type: 'radial', colors: ['#fffdf7', '#fff3cf', '#fffaf0'] },
  },
  'regent-barber': {
    navbarVariant: 'editorial',
    navbarAnnouncement: 'Precision cuts · confident finish · appointments without the wait',
    heroVariant: 'bold',
    imageTreatment: 'offset',
    heroMeta: ['Consultation-led', 'Precision finish', 'Book your chair'],
    floatingCard: {
      eyebrow: 'In the chair',
      title: 'Cut for how you carry yourself',
      description: 'Sharp detail, considered shape, and a finish built to last.',
    },
    decorativeText: 'REGENT',
    aboutVariant: 'credentials',
    aboutQuote: 'The best cut should still look right three weeks later.',
    aboutStats: [
      { value: '45 min', label: 'Signature cut' },
      { value: '01', label: 'Dedicated chair' },
      { value: 'Sharp', label: 'Every detail' },
    ],
    aboutImageTreatment: 'framed',
    secondaryImageIndex: 0,
    galleryLayout: 'masonry',
    contactLayout: 'immersive',
    contactEyebrow: 'Take the chair',
    contactDescription: 'Choose your service and lock in a time before the week fills up.',
    contactNote: 'Arrive a few minutes early for a quick consultation before the cut.',
    backgroundType: 'pattern',
    backgroundPattern: { type: 'diagonal', color: '#c87941', opacity: 4, size: 'large' },
  },
  'editorial-beauty': {
    navbarVariant: 'editorial',
    navbarAnnouncement: 'Texture-led hair · modern makeup · editorial attention to detail',
    heroVariant: 'editorial',
    imageTreatment: 'collage',
    heroMeta: ['Texture-aware', 'Consultation-led', 'Portfolio finish'],
    floatingCard: {
      eyebrow: 'Studio note',
      title: 'Your look, fully considered',
      description: 'From preparation to finish, every detail is planned around you.',
    },
    decorativeText: 'FORM',
    aboutVariant: 'atelier',
    aboutQuote: 'Beauty is most powerful when technique makes room for personality.',
    aboutStats: [
      { value: '1:1', label: 'Consultation' },
      { value: 'All', label: 'Textures welcome' },
      { value: 'Full', label: 'Prep guidance' },
    ],
    aboutImageTreatment: 'polaroid',
    galleryLayout: 'editorial',
    contactLayout: 'immersive',
    contactEyebrow: 'Create the look',
    contactDescription:
      'Choose a service, review preparation guidance, and reserve your studio time.',
    contactNote:
      'Bridal and editorial enquiries can be discussed before an appointment is confirmed.',
    backgroundType: 'pattern',
    backgroundPattern: { type: 'grid', color: '#9c4960', opacity: 4, size: 'large' },
  },
  'kinetic-fitness': {
    navbarVariant: 'floating',
    navbarAnnouncement: 'Purposeful coaching · measurable progress · strength for real life',
    heroVariant: 'bold',
    imageTreatment: 'frame',
    heroMeta: ['1:1 coaching', 'Clear programme', 'Real progress'],
    floatingCard: {
      eyebrow: 'Start point',
      title: 'A plan you can actually follow',
      description: 'Book an assessment and turn broad goals into practical weekly action.',
    },
    decorativeText: 'MOVE',
    aboutVariant: 'credentials',
    aboutQuote: 'Progress sticks when the programme fits the person, not the other way around.',
    aboutStats: [
      { value: '1:1', label: 'Coaching' },
      { value: '30 days', label: 'Clear focus' },
      { value: 'Live', label: 'Booking' },
    ],
    aboutImageTreatment: 'stacked',
    secondaryImageIndex: 2,
    galleryLayout: 'masonry',
    contactLayout: 'panel',
    contactEyebrow: 'Build your starting point',
    contactDescription: 'Book an assessment or training session and leave with a clear next step.',
    contactNote: 'New clients can begin with a movement review before choosing a programme.',
    backgroundType: 'pattern',
    backgroundPattern: { type: 'grid', color: '#176b4d', opacity: 4, size: 'medium' },
  },
  'clear-professional': {
    navbarVariant: 'floating',
    navbarAnnouncement: 'Confidential conversations · practical guidance · clear next steps',
    heroVariant: 'professional',
    imageTreatment: 'frame',
    heroMeta: ['Confidential', 'Structured', 'Actionable'],
    floatingCard: {
      eyebrow: 'First conversation',
      title: 'Clarity before commitment',
      description: 'Use an initial consultation to define the problem and the right next step.',
    },
    decorativeText: 'CLARITY',
    aboutVariant: 'credentials',
    aboutQuote: 'Good advice should make the next decision feel clearer, not more complicated.',
    aboutStats: [
      { value: '45 min', label: 'Initial session' },
      { value: 'Clear', label: 'Written next steps' },
      { value: 'Private', label: 'Conversation' },
    ],
    aboutImageTreatment: 'framed',
    secondaryImageIndex: 1,
    galleryLayout: 'grid',
    contactLayout: 'panel',
    contactEyebrow: 'Start with a clear conversation',
    contactDescription: 'Choose the right consultation and reserve a focused time to talk.',
    contactNote:
      'You can send background information after booking so the session starts productively.',
    backgroundType: 'pattern',
    backgroundPattern: { type: 'grid', color: '#274c77', opacity: 3, size: 'large' },
  },
  'frame-creative': {
    navbarVariant: 'editorial',
    navbarAnnouncement: 'Portraits · brand stories · visual work with shape and intention',
    heroVariant: 'creative',
    imageTreatment: 'collage',
    heroMeta: ['Story-led', 'Art directed', 'Curated delivery'],
    floatingCard: {
      eyebrow: 'Selected commission',
      title: 'Images with a point of view',
      description: 'A calm, collaborative process from first idea to final gallery.',
    },
    decorativeText: 'FRAME',
    aboutVariant: 'atelier',
    aboutQuote: 'The strongest images feel specific to the person, place, and story.',
    aboutStats: [
      { value: '90 min', label: 'Portrait session' },
      { value: 'Curated', label: 'Final gallery' },
      { value: 'High-res', label: 'Delivery' },
    ],
    aboutImageTreatment: 'polaroid',
    secondaryImageIndex: 2,
    galleryLayout: 'editorial',
    contactLayout: 'immersive',
    contactEyebrow: 'Make something distinctive',
    contactDescription:
      'Choose a session or start a conversation about the story you want to tell.',
    contactNote: 'Brand and event commissions can begin with a short planning call.',
    backgroundType: 'pattern',
    backgroundPattern: { type: 'dots', color: '#8a4f24', opacity: 5, size: 'large' },
  },
  'bright-education': {
    navbarVariant: 'floating',
    navbarAnnouncement: 'Patient teaching · practical plans · confidence built step by step',
    heroVariant: 'education',
    imageTreatment: 'offset',
    heroMeta: ['One-to-one', 'Clear plan', 'Visible progress'],
    floatingCard: {
      eyebrow: 'Learning plan',
      title: 'A clearer way forward',
      description: 'Book a session shaped around the learner, the goal, and the next milestone.',
    },
    decorativeText: 'LEARN',
    aboutVariant: 'story',
    aboutQuote: 'Confidence grows when learners understand both what to do and why it works.',
    aboutStats: [
      { value: '1:1', label: 'Support' },
      { value: '60 min', label: 'Focused session' },
      { value: 'Clear', label: 'Next milestone' },
    ],
    aboutImageTreatment: 'stacked',
    secondaryImageIndex: 0,
    galleryLayout: 'masonry',
    contactLayout: 'panel',
    contactEyebrow: 'Plan the next step',
    contactDescription: 'Choose a learning session and reserve a time that works for the learner.',
    contactNote:
      'Parents and adult learners are welcome to ask which session is the best starting point.',
    backgroundType: 'pattern',
    backgroundPattern: { type: 'dots', color: '#9b6a08', opacity: 5, size: 'medium' },
  },
}

function premiumTemplateProfile(slug: string) {
  return premiumTemplateProfiles[slug] || premiumTemplateProfiles['serene-wellness']
}

const placeholderFragments = [
  'add your real',
  'share your story',
  'welcome to your professional space',
  'providing exceptional service',
  'tell visitors about',
  'replace this',
]

function sectionId(slug: string, type: SectionType, order: number) {
  return `${slug}-${type.toLowerCase()}-${order}`
}

function isMeaningfulString(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim().length === 0) return false
  const normalized = value.trim().toLowerCase()
  return !placeholderFragments.some(fragment => normalized.includes(fragment))
}

function firstMeaningfulString(...values: unknown[]) {
  return values.find(isMeaningfulString) as string | undefined
}

function parsePrice(value: string) {
  const normalized = value.toLowerCase()
  if (normalized.includes('free')) {
    return { price: 0, priceType: 'FREE' as const }
  }

  const numericValue = Number.parseFloat(value.replace(/[^0-9.]/g, '')) || 0
  return {
    price: numericValue,
    priceType: normalized.includes('from') ? ('STARTING_AT' as const) : ('FIXED' as const),
  }
}

function parseDuration(value: string) {
  const hourMatch = value.match(/(\d+(?:\.\d+)?)\s*(?:hr|hour)/i)
  const minuteMatch = value.match(/(\d+)\s*(?:min|minute)/i)
  const hours = hourMatch ? Number.parseFloat(hourMatch[1]) : 0
  const minutes = minuteMatch ? Number.parseInt(minuteMatch[1], 10) : 0
  return Math.max(1, Math.round(hours * 60 + minutes))
}

function createPreviewServices(template: TemplateCatalogueItem): CanonicalPreviewService[] {
  if (template.slug === 'heavenly-pamper-palace') {
    return realisticDemoBusiness.services.map(service => ({
      id: service.id,
      name: service.name,
      description: service.description,
      duration: parseDuration(service.duration),
      currency: 'GBP',
      imageUrl: realisticDemoBusiness.images[service.image],
      ...parsePrice(service.price),
    }))
  }

  if (template.slug === 'editorial-beauty') {
    return hairMakeupDemoBusiness.services.map(service => ({
      id: service.id,
      name: service.name,
      description: service.description,
      duration: parseDuration(service.duration),
      currency: 'GBP',
      imageUrl: hairMakeupDemoBusiness.images[service.image],
      ...parsePrice(service.price),
    }))
  }

  const imageSet = genericImages[template.slug]
  return template.preview.services.map((service, index) => ({
    id: service.id,
    name: service.name,
    description: service.description,
    duration: parseDuration(service.duration),
    currency: 'GBP',
    imageUrl: imageSet?.gallery[index % imageSet.gallery.length],
    ...parsePrice(service.price),
  }))
}

function baseTheme(template: TemplateCatalogueItem): CanonicalPresenceTheme {
  const serifHeading = new Set([
    'serene-wellness',
    'heavenly-pamper-palace',
    'regent-barber',
    'editorial-beauty',
    'frame-creative',
    'bright-education',
  ])
  const profile = premiumTemplateProfile(template.slug)

  return {
    primaryColor: template.palette.primary,
    secondaryColor: template.palette.surface,
    accentColor: template.palette.primary,
    backgroundColor: template.palette.background,
    textColor: template.palette.text,
    fontFamily: 'Inter',
    headingFont: serifHeading.has(template.slug) ? 'Georgia' : 'Inter',
    buttonStyle:
      template.slug === 'editorial-beauty' ||
      template.slug === 'clear-professional' ||
      template.slug === 'regent-barber'
        ? 'square'
        : 'pill',
    spacing: 'relaxed',
    backgroundType: profile.backgroundType,
    backgroundPattern: profile.backgroundPattern,
    backgroundGradient: profile.backgroundGradient,
  }
}

function navbar(
  slug: string,
  businessName: string,
  template: TemplateCatalogueItem,
  links: Array<{ label: string; type: SectionType }>,
  textColor: 'light' | 'dark' = 'dark'
): PageSection {
  return {
    id: sectionId(slug, 'NAVBAR', 0),
    type: 'NAVBAR',
    order: 0,
    isVisible: true,
    data: {
      showLogo: true,
      showLogoText: true,
      logoText: businessName,
      links: links.map(({ label, type }, index) => {
        const sectionOrders: Record<SectionType, number> = {
          NAVBAR: 0,
          HERO: 1,
          ABOUT: 2,
          SERVICES: 3,
          GALLERY: 4,
          TESTIMONIALS: 5,
          FAQ: 6,
          CONTACT: 7,
          CUSTOM_HTML: 8,
        }

        return {
          id: `${slug}-nav-${index}`,
          label,
          href: `#${sectionId(slug, type, sectionOrders[type])}`,
        }
      }),
      showCta: true,
      ctaText: template.category === 'PROFESSIONAL' ? 'Book a consultation' : 'Book now',
      ctaLink: '#book',
      style: 'solid',
      position: 'sticky',
      backgroundColor: template.palette.background,
      textColor,
      variant: premiumTemplateProfile(slug).navbarVariant,
      showDivider: true,
      monogram: businessName.slice(0, 1).toUpperCase(),
      announcement: premiumTemplateProfile(slug).navbarAnnouncement,
    },
  }
}

function buildHeavenlyPamper(businessName: string, mode: 'account' | 'preview'): PageSection[] {
  const slug = 'heavenly-pamper-palace'
  const isPreview = mode === 'preview'

  return [
    navbar(
      slug,
      businessName,
      getPresenceTemplate(slug)!,
      [
        { label: 'The experience', type: 'ABOUT' },
        { label: 'Treatments', type: 'SERVICES' },
        { label: 'Gallery', type: 'GALLERY' },
        { label: 'Visit', type: 'CONTACT' },
      ],
      'dark'
    ),
    {
      id: sectionId(slug, 'HERO', 1),
      type: 'HERO',
      order: 1,
      isVisible: true,
      appearance: {
        backgroundColor: '#fffaf0',
        textColor: '#513b22',
        accentColor: '#b88a22',
        contentWidth: 'wide',
        spacing: 'spacious',
      },
      data: {
        eyebrow: realisticDemoBusiness.tagline,
        title: businessName,
        subtitle:
          mode === 'preview'
            ? realisticDemoBusiness.description
            : 'A luminous retreat for calm, confidence, and beautifully considered care.',
        backgroundImage: realisticDemoBusiness.images.hero,
        ctaText: 'Book now',
        ctaLink: '#book',
        secondaryCtaText: 'View treatments',
        secondaryCtaLink: `#${sectionId(slug, 'SERVICES', 3)}`,
        layout: 'cover',
        imagePosition: 'right',
        imageFocalPoint: 'center',
        minHeight: 'viewport',
        alignment: 'left',
        overlay: true,
        overlayColor: '#fffaf0',
        overlayOpacity: 74,
        overlayStyle: 'gradient-diagonal',
        textColor: 'dark',
        textShadow: false,
        variant: premiumTemplateProfile(slug).heroVariant,
        imageTreatment: premiumTemplateProfile(slug).imageTreatment,
        floatingCard: premiumTemplateProfile(slug).floatingCard,
        meta: premiumTemplateProfile(slug).heroMeta,
        decorativeText: premiumTemplateProfile(slug).decorativeText,
        showScrollCue: true,
      },
    },
    {
      id: sectionId(slug, 'ABOUT', 2),
      type: 'ABOUT',
      order: 2,
      isVisible: true,
      appearance: {
        backgroundColor: '#ffffff',
        textColor: '#513b22',
        accentColor: '#b88a22',
        contentWidth: 'wide',
        spacing: 'spacious',
      },
      data: {
        eyebrow: 'The experience',
        title: 'Serenity, polished with a touch of glamour',
        content: `<p>${
          isPreview
            ? realisticDemoBusiness.owner.biography
            : 'Personalised treatments, thoughtful rituals, and unhurried care in a peaceful setting designed around every client.'
        }</p>`,
        image: realisticDemoBusiness.images.interior,
        imagePosition: 'right',
        layout: 'editorial',
        imageShape: 'landscape',
        highlights: isPreview
          ? realisticDemoBusiness.owner.credentials
          : ['Thoughtful consultation', 'Unhurried appointments', 'Clear preparation'],
        variant: premiumTemplateProfile(slug).aboutVariant,
        quote: premiumTemplateProfile(slug).aboutQuote,
        stats: premiumTemplateProfile(slug).aboutStats,
        imageTreatment: premiumTemplateProfile(slug).aboutImageTreatment,
        secondaryImage: realisticDemoBusiness.images.owner,
      },
    },
    {
      id: sectionId(slug, 'SERVICES', 3),
      type: 'SERVICES',
      order: 3,
      isVisible: true,
      appearance: {
        backgroundColor: '#fff6dc',
        textColor: '#513b22',
        accentColor: '#b88a22',
        contentWidth: 'wide',
        spacing: 'spacious',
      },
      data: {
        eyebrow: 'Treatment menu',
        title: 'Choose your moment of calm',
        description: 'Clear timing, thoughtful preparation, and live availability before you book.',
        layout: 'grid',
        columns: 3,
        cardStyle: 'elevated',
        showImages: true,
        showPrices: true,
      },
    },
    {
      id: sectionId(slug, 'GALLERY', 4),
      type: 'GALLERY',
      order: 4,
      isVisible: true,
      appearance: {
        backgroundColor: '#4b3820',
        textColor: '#fff8e8',
        accentColor: '#e2bf67',
        contentWidth: 'wide',
        spacing: 'spacious',
      },
      data: {
        eyebrow: 'Inside the experience',
        title: 'Soft light. Thoughtful rituals. Unhurried care.',
        images: [
          {
            url: realisticDemoBusiness.images.interior,
            alt: 'Premium treatment studio placeholder',
          },
          {
            url: realisticDemoBusiness.images.treatment,
            alt: 'Wellness treatment placeholder',
          },
          {
            url: realisticDemoBusiness.images.facial,
            alt: 'Facial treatment placeholder',
          },
          {
            url: realisticDemoBusiness.images.owner,
            alt: 'Studio owner placeholder',
          },
        ],
        layout: 'editorial',
        columns: 3,
        featuredImageIndex: 0,
        gap: 'normal',
        imageRadius: 'rounded',
      },
    },
    {
      id: sectionId(slug, 'TESTIMONIALS', 5),
      type: 'TESTIMONIALS',
      order: 5,
      isVisible: isPreview,
      appearance: {
        backgroundColor: '#4b3820',
        textColor: '#fff8e8',
        accentColor: '#e2bf67',
        contentWidth: 'wide',
        spacing: 'spacious',
      },
      data: {
        eyebrow: 'Client notes',
        title: 'Care people come back to',
        testimonials: isPreview
          ? realisticDemoBusiness.reviews.map(review => ({
              id: review.id,
              name: review.name,
              role: review.treatment,
              content: review.quote,
              rating: review.rating,
            }))
          : [],
        layout: 'editorial',
        showRatings: true,
      },
    },
    {
      id: sectionId(slug, 'FAQ', 6),
      type: 'FAQ',
      order: 6,
      isVisible: isPreview,
      appearance: {
        backgroundColor: '#fffaf0',
        textColor: '#513b22',
        accentColor: '#b88a22',
        contentWidth: 'narrow',
        spacing: 'spacious',
      },
      data: {
        title: 'Frequently asked questions',
        items: isPreview ? realisticDemoBusiness.faqs : [],
      },
    },
    {
      id: sectionId(slug, 'CONTACT', 7),
      type: 'CONTACT',
      order: 7,
      isVisible: true,
      appearance: {
        backgroundColor: '#ffffff',
        textColor: '#513b22',
        accentColor: '#b88a22',
        contentWidth: 'wide',
        spacing: 'spacious',
      },
      data: {
        title: 'Time set aside for you',
        eyebrow: premiumTemplateProfile(slug).contactEyebrow,
        description: premiumTemplateProfile(slug).contactDescription,
        ctaText: 'Reserve your ritual',
        ctaLink: '#book',
        secondaryCtaText: 'View treatments',
        secondaryCtaLink: `#${sectionId(slug, 'SERVICES', 3)}`,
        layout: premiumTemplateProfile(slug).contactLayout,
        backgroundImage: realisticDemoBusiness.images.interior,
        note: premiumTemplateProfile(slug).contactNote,
        showPhone: true,
        showEmail: true,
        showAddress: true,
        showMap: false,
        showSocialMedia: true,
      },
    },
  ]
}

function buildEditorialBeauty(businessName: string, mode: 'account' | 'preview'): PageSection[] {
  const slug = 'editorial-beauty'
  const isPreview = mode === 'preview'

  return [
    navbar(
      slug,
      businessName,
      getPresenceTemplate(slug)!,
      [
        { label: 'About', type: 'ABOUT' },
        { label: 'Services', type: 'SERVICES' },
        { label: 'Portfolio', type: 'GALLERY' },
        { label: 'Contact', type: 'CONTACT' },
      ],
      'dark'
    ),
    {
      id: sectionId(slug, 'HERO', 1),
      type: 'HERO',
      order: 1,
      isVisible: true,
      appearance: {
        backgroundColor: '#fff7f8',
        textColor: '#301f25',
        accentColor: '#9c4960',
        contentWidth: 'wide',
        spacing: 'spacious',
      },
      data: {
        eyebrow: hairMakeupDemoBusiness.tagline,
        title: businessName,
        subtitle: isPreview
          ? hairMakeupDemoBusiness.description
          : 'Texture-led hair and makeup, finished with intention.',
        backgroundImage: hairMakeupDemoBusiness.images.hero,
        ctaText: 'Book an appointment',
        ctaLink: '#book',
        secondaryCtaText: 'Explore our work',
        secondaryCtaLink: `#${sectionId(slug, 'GALLERY', 4)}`,
        layout: 'editorial',
        imagePosition: 'right',
        imageFocalPoint: 'top',
        minHeight: 'viewport',
        alignment: 'left',
        overlay: false,
        textColor: 'dark',
        textShadow: false,
        variant: premiumTemplateProfile(slug).heroVariant,
        imageTreatment: premiumTemplateProfile(slug).imageTreatment,
        floatingCard: premiumTemplateProfile(slug).floatingCard,
        meta: premiumTemplateProfile(slug).heroMeta,
        decorativeText: premiumTemplateProfile(slug).decorativeText,
        showScrollCue: true,
      },
    },
    {
      id: sectionId(slug, 'ABOUT', 2),
      type: 'ABOUT',
      order: 2,
      isVisible: true,
      appearance: {
        backgroundColor: '#fffdfb',
        textColor: '#301f25',
        accentColor: '#9c4960',
        contentWidth: 'wide',
        spacing: 'spacious',
      },
      data: {
        eyebrow: isPreview ? hairMakeupDemoBusiness.owner.role : 'Your approach',
        title: 'The artist behind the studio',
        content: `<p>${
          isPreview
            ? hairMakeupDemoBusiness.owner.biography
            : 'Introduce your approach, experience, and the details that make an appointment with you distinctive.'
        }</p>`,
        image: hairMakeupDemoBusiness.images.owner,
        imagePosition: 'right',
        layout: 'editorial',
        imageShape: 'portrait',
        highlights: isPreview
          ? hairMakeupDemoBusiness.owner.credentials
          : ['Consultation-led', 'Texture-aware', 'Clear aftercare'],
        variant: premiumTemplateProfile(slug).aboutVariant,
        quote: premiumTemplateProfile(slug).aboutQuote,
        stats: premiumTemplateProfile(slug).aboutStats,
        imageTreatment: premiumTemplateProfile(slug).aboutImageTreatment,
        secondaryImage: hairMakeupDemoBusiness.images.makeup,
      },
    },
    {
      id: sectionId(slug, 'SERVICES', 3),
      type: 'SERVICES',
      order: 3,
      isVisible: true,
      appearance: {
        backgroundColor: '#f3eee7',
        textColor: '#301f25',
        accentColor: '#9c4960',
        contentWidth: 'wide',
        spacing: 'spacious',
      },
      data: {
        eyebrow: 'The service menu',
        title: 'Hair and makeup, fully considered',
        description:
          'Clear timing, transparent pricing, preparation guidance, and live availability.',
        layout: 'editorial',
        cardStyle: 'minimal',
        showImages: true,
        showPrices: true,
      },
    },
    {
      id: sectionId(slug, 'GALLERY', 4),
      type: 'GALLERY',
      order: 4,
      isVisible: true,
      appearance: {
        backgroundColor: '#181411',
        textColor: '#fdf7f0',
        accentColor: '#d8a5b1',
        contentWidth: 'wide',
        spacing: 'spacious',
      },
      data: {
        eyebrow: 'Selected work',
        title: 'Texture, colour and finish',
        images: [
          {
            url: hairMakeupDemoBusiness.images.hero,
            alt: 'Editorial hair and makeup placeholder',
          },
          {
            url: hairMakeupDemoBusiness.images.braids,
            alt: 'Detailed braids placeholder',
          },
          {
            url: hairMakeupDemoBusiness.images.silkPress,
            alt: 'Silk press placeholder',
          },
          {
            url: hairMakeupDemoBusiness.images.makeup,
            alt: 'Soft-glam makeup placeholder',
          },
          {
            url: hairMakeupDemoBusiness.images.bridal,
            alt: 'Bridal hair and makeup placeholder',
          },
          {
            url: hairMakeupDemoBusiness.images.studio,
            alt: 'Beauty studio placeholder',
          },
        ],
        layout: 'editorial',
        featuredImageIndex: 0,
        gap: 'tight',
        imageRadius: 'none',
      },
    },
    {
      id: sectionId(slug, 'TESTIMONIALS', 5),
      type: 'TESTIMONIALS',
      order: 5,
      isVisible: isPreview,
      appearance: {
        backgroundColor: '#f5dfe4',
        textColor: '#301f25',
        accentColor: '#9c4960',
        contentWidth: 'wide',
        spacing: 'spacious',
      },
      data: {
        eyebrow: 'Client notes',
        title: 'What the experience feels like',
        testimonials: isPreview
          ? hairMakeupDemoBusiness.reviews.map(review => ({
              id: review.id,
              name: review.name,
              role: review.service,
              content: review.quote,
              rating: review.rating,
            }))
          : [],
        layout: 'editorial',
        showRatings: true,
      },
    },
    {
      id: sectionId(slug, 'FAQ', 6),
      type: 'FAQ',
      order: 6,
      isVisible: isPreview,
      appearance: {
        backgroundColor: '#fff7f8',
        textColor: '#301f25',
        accentColor: '#9c4960',
        contentWidth: 'narrow',
        spacing: 'spacious',
      },
      data: {
        title: 'Before your appointment',
        items: isPreview ? hairMakeupDemoBusiness.faqs : [],
      },
    },
    {
      id: sectionId(slug, 'CONTACT', 7),
      type: 'CONTACT',
      order: 7,
      isVisible: true,
      appearance: {
        backgroundColor: '#181411',
        textColor: '#fdf7f0',
        accentColor: '#d8a5b1',
        contentWidth: 'wide',
        spacing: 'spacious',
      },
      data: {
        title: 'Plan your visit',
        eyebrow: premiumTemplateProfile(slug).contactEyebrow,
        description: premiumTemplateProfile(slug).contactDescription,
        ctaText: 'Book an appointment',
        ctaLink: '#book',
        secondaryCtaText: 'Explore the portfolio',
        secondaryCtaLink: `#${sectionId(slug, 'GALLERY', 4)}`,
        layout: premiumTemplateProfile(slug).contactLayout,
        backgroundImage: hairMakeupDemoBusiness.images.studio,
        note: premiumTemplateProfile(slug).contactNote,
        showPhone: true,
        showEmail: true,
        showAddress: true,
        showMap: false,
        showSocialMedia: true,
      },
    },
  ]
}

function buildGeneric(
  businessName: string,
  template: TemplateCatalogueItem,
  mode: 'account' | 'preview'
): PageSection[] {
  const images = genericImages[template.slug] || genericImages['serene-wellness']
  const isProfessional = template.category === 'PROFESSIONAL'
  const isCreative = template.category === 'CREATIVE'
  const isPreview = mode === 'preview'
  const darkHero = template.slug === 'regent-barber' || template.slug === 'kinetic-fitness'
  const profile = premiumTemplateProfile(template.slug)
  const galleryImages = images.gallery.map((url, index) => ({
    url,
    alt: `${template.name} placeholder ${index + 1}`,
  }))

  return [
    navbar(
      template.slug,
      businessName,
      template,
      [
        { label: 'About', type: 'ABOUT' },
        { label: isProfessional ? 'Expertise' : 'Services', type: 'SERVICES' },
        { label: isCreative ? 'Portfolio' : 'Gallery', type: 'GALLERY' },
        { label: 'Contact', type: 'CONTACT' },
      ],
      template.slug === 'regent-barber' ? 'light' : 'dark'
    ),
    {
      id: sectionId(template.slug, 'HERO', 1),
      type: 'HERO',
      order: 1,
      isVisible: true,
      appearance: {
        backgroundColor: template.palette.background,
        textColor: darkHero ? '#ffffff' : template.palette.text,
        accentColor: template.palette.primary,
        contentWidth: 'wide',
        spacing: 'spacious',
      },
      data: {
        eyebrow: template.preview.eyebrow,
        title: businessName,
        subtitle: template.preview.headline,
        backgroundImage: images.hero,
        ctaText: isProfessional ? 'Book a consultation' : 'Book now',
        ctaLink: '#book',
        secondaryCtaText: isCreative ? 'View portfolio' : 'View services',
        secondaryCtaLink: `#${sectionId(template.slug, isCreative ? 'GALLERY' : 'SERVICES', isCreative ? 4 : 3)}`,
        layout:
          template.slug === 'frame-creative' ||
          template.slug === 'clear-professional' ||
          template.slug === 'bright-education'
            ? 'editorial'
            : 'cover',
        imagePosition: 'right',
        imageFocalPoint: template.slug === 'regent-barber' ? 'top' : 'center',
        minHeight: 'viewport',
        alignment: 'left',
        overlay: true,
        overlayColor: darkHero ? '#101815' : template.palette.background,
        overlayOpacity: darkHero ? 68 : 64,
        overlayStyle: 'gradient-diagonal',
        textColor: darkHero ? 'light' : 'dark',
        textShadow: darkHero,
        variant: profile.heroVariant,
        imageTreatment: profile.imageTreatment,
        floatingCard: profile.floatingCard,
        meta: profile.heroMeta,
        decorativeText: profile.decorativeText,
        showScrollCue: true,
      },
    },
    {
      id: sectionId(template.slug, 'ABOUT', 2),
      type: 'ABOUT',
      order: 2,
      isVisible: true,
      appearance: {
        backgroundColor: '#ffffff',
        textColor: template.palette.text,
        accentColor: template.palette.primary,
        contentWidth: 'wide',
        spacing: 'spacious',
      },
      data: {
        eyebrow: isProfessional ? 'How we work' : 'The experience',
        title: isProfessional
          ? 'Clarity, expertise, and practical next steps'
          : `Built around ${businessName}`,
        content: `<p>${
          isPreview
            ? `${template.description} This canonical preview uses the same sections, spacing, typography, and renderer that the account receives.`
            : 'Introduce your work, your approach, and what customers can expect when they choose you.'
        }</p>`,
        image: images.about,
        imagePosition: 'right',
        layout: 'editorial',
        imageShape: 'portrait',
        highlights: isProfessional
          ? ['Clear scope', 'Transparent next steps', 'Easy appointment booking']
          : ['Personal service', 'Clear pricing', 'Simple booking'],
        variant: profile.aboutVariant,
        quote: profile.aboutQuote,
        stats: profile.aboutStats,
        imageTreatment: profile.aboutImageTreatment,
        secondaryImage:
          profile.secondaryImageIndex !== undefined
            ? images.gallery[profile.secondaryImageIndex % images.gallery.length]
            : undefined,
      },
    },
    {
      id: sectionId(template.slug, 'SERVICES', 3),
      type: 'SERVICES',
      order: 3,
      isVisible: true,
      appearance: {
        backgroundColor: template.palette.surface,
        textColor: template.palette.text,
        accentColor: template.palette.primary,
        contentWidth: 'wide',
        spacing: 'spacious',
      },
      data: {
        eyebrow: isProfessional ? 'Ways to work together' : 'Service menu',
        title: isProfessional
          ? 'Focused support for important work'
          : 'Choose the right appointment',
        description:
          'Real services, prices, durations, and availability remain connected to your account.',
        layout: isProfessional ? 'list' : isCreative ? 'editorial' : 'grid',
        columns: 3,
        cardStyle: isProfessional ? 'outlined' : 'elevated',
        showImages: !isProfessional,
        showPrices: true,
      },
    },
    {
      id: sectionId(template.slug, 'GALLERY', 4),
      type: 'GALLERY',
      order: 4,
      isVisible: true,
      appearance: {
        backgroundColor: darkHero ? '#11110f' : template.palette.background,
        textColor: darkHero ? '#f5f0e8' : template.palette.text,
        accentColor: template.palette.primary,
        contentWidth: 'wide',
        spacing: 'spacious',
      },
      data: {
        eyebrow: isCreative ? 'Selected work' : 'A closer look',
        title: isCreative ? 'Work with shape, character, and intention' : 'Inside the experience',
        images: galleryImages,
        layout: profile.galleryLayout,
        columns: isCreative ? 4 : 3,
        featuredImageIndex: 0,
        gap: isCreative ? 'tight' : 'normal',
        imageRadius: template.slug === 'clear-professional' ? 'none' : 'soft',
      },
    },
    {
      id: sectionId(template.slug, 'FAQ', 6),
      type: 'FAQ',
      order: 6,
      isVisible: false,
      appearance: {
        backgroundColor: template.palette.background,
        textColor: template.palette.text,
        accentColor: template.palette.primary,
        contentWidth: 'narrow',
        spacing: 'spacious',
      },
      data: {
        title: 'Frequently asked questions',
        items: [],
      },
    },
    {
      id: sectionId(template.slug, 'CONTACT', 7),
      type: 'CONTACT',
      order: 7,
      isVisible: true,
      appearance: {
        backgroundColor: darkHero ? '#11110f' : '#ffffff',
        textColor: darkHero ? '#f5f0e8' : template.palette.text,
        accentColor: template.palette.primary,
        contentWidth: 'wide',
        spacing: 'spacious',
      },
      data: {
        title: isProfessional ? 'Start a conversation' : 'Plan your visit',
        eyebrow: profile.contactEyebrow,
        description: profile.contactDescription,
        ctaText: isProfessional ? 'Book a consultation' : 'Book now',
        ctaLink: '#book',
        secondaryCtaText: isCreative ? 'View the portfolio' : 'Explore services',
        secondaryCtaLink: `#${sectionId(template.slug, isCreative ? 'GALLERY' : 'SERVICES', isCreative ? 4 : 3)}`,
        layout: profile.contactLayout,
        backgroundImage: profile.contactLayout === 'immersive' ? images.about : undefined,
        note: profile.contactNote,
        showPhone: true,
        showEmail: true,
        showAddress: true,
        showMap: false,
        showSocialMedia: true,
      },
    },
  ]
}

function mergeSectionData(
  templateSection: PageSection,
  existingSection?: PageSection
): PageSection {
  if (!existingSection || existingSection.type !== templateSection.type) return templateSection

  const existingData = existingSection.data as Record<string, unknown>
  const templateData = templateSection.data as Record<string, unknown>
  const data = { ...templateData }

  switch (templateSection.type) {
    case 'NAVBAR': {
      Object.assign(data, {
        logo: existingData.logo || templateData.logo,
        logoText: firstMeaningfulString(existingData.logoText, templateData.logoText),
        showLogo: existingData.showLogo ?? templateData.showLogo,
        showLogoText: existingData.showLogoText ?? templateData.showLogoText,
      })
      break
    }
    case 'HERO': {
      Object.assign(data, {
        title: firstMeaningfulString(existingData.title, templateData.title),
        subtitle: firstMeaningfulString(existingData.subtitle, templateData.subtitle),
        eyebrow: firstMeaningfulString(existingData.eyebrow, templateData.eyebrow),
        backgroundImage: firstMeaningfulString(
          existingData.backgroundImage,
          templateData.backgroundImage
        ),
      })
      break
    }
    case 'ABOUT': {
      Object.assign(data, {
        title: firstMeaningfulString(existingData.title, templateData.title),
        content: firstMeaningfulString(existingData.content, templateData.content),
        eyebrow: firstMeaningfulString(existingData.eyebrow, templateData.eyebrow),
        image: firstMeaningfulString(existingData.image, templateData.image),
        highlights:
          Array.isArray(existingData.highlights) && existingData.highlights.length > 0
            ? existingData.highlights
            : templateData.highlights,
      })
      break
    }
    case 'SERVICES': {
      Object.assign(data, {
        title: firstMeaningfulString(existingData.title, templateData.title),
        description: firstMeaningfulString(existingData.description, templateData.description),
        eyebrow: firstMeaningfulString(existingData.eyebrow, templateData.eyebrow),
        serviceIds:
          Array.isArray(existingData.serviceIds) && existingData.serviceIds.length > 0
            ? existingData.serviceIds
            : templateData.serviceIds,
      })
      break
    }
    case 'GALLERY': {
      Object.assign(data, {
        title: firstMeaningfulString(existingData.title, templateData.title),
        eyebrow: firstMeaningfulString(existingData.eyebrow, templateData.eyebrow),
        images:
          Array.isArray(existingData.images) && existingData.images.length > 0
            ? existingData.images
            : templateData.images,
      })
      break
    }
    case 'TESTIMONIALS': {
      Object.assign(data, {
        title: firstMeaningfulString(existingData.title, templateData.title),
        eyebrow: firstMeaningfulString(existingData.eyebrow, templateData.eyebrow),
        testimonials:
          Array.isArray(existingData.testimonials) && existingData.testimonials.length > 0
            ? existingData.testimonials
            : templateData.testimonials,
      })
      break
    }
    case 'FAQ': {
      Object.assign(data, {
        title: firstMeaningfulString(existingData.title, templateData.title),
        items:
          Array.isArray(existingData.items) && existingData.items.length > 0
            ? existingData.items
            : templateData.items,
      })
      break
    }
    case 'CONTACT': {
      Object.assign(data, {
        title: firstMeaningfulString(existingData.title, templateData.title),
        showPhone: existingData.showPhone ?? templateData.showPhone,
        showEmail: existingData.showEmail ?? templateData.showEmail,
        showAddress: existingData.showAddress ?? templateData.showAddress,
        showMap: existingData.showMap ?? templateData.showMap,
        showSocialMedia: existingData.showSocialMedia ?? templateData.showSocialMedia,
        mapEmbedUrl: existingData.mapEmbedUrl || templateData.mapEmbedUrl,
      })
      break
    }
  }

  const hasListContent =
    (templateSection.type === 'TESTIMONIALS' &&
      Array.isArray(data.testimonials) &&
      data.testimonials.length > 0) ||
    (templateSection.type === 'FAQ' && Array.isArray(data.items) && data.items.length > 0)

  return {
    ...templateSection,
    data,
    isVisible: hasListContent ? existingSection.isVisible !== false : templateSection.isVisible,
  } as PageSection
}

function preserveExistingContent(templateSections: PageSection[], existingSections: PageSection[]) {
  return templateSections.map(templateSection =>
    mergeSectionData(
      templateSection,
      existingSections.find(existingSection => existingSection.type === templateSection.type)
    )
  )
}

function previewBusinessData(slug: string): CanonicalTemplateBusinessData {
  if (slug === 'heavenly-pamper-palace') {
    return {
      phone: realisticDemoBusiness.contact.phone,
      email: realisticDemoBusiness.contact.email,
      address: `${realisticDemoBusiness.location.address}, ${realisticDemoBusiness.location.city}, ${realisticDemoBusiness.location.postcode}`,
      socialLinks: { instagram: realisticDemoBusiness.contact.instagram },
    }
  }

  if (slug === 'editorial-beauty') {
    return {
      phone: hairMakeupDemoBusiness.contact.phone,
      email: hairMakeupDemoBusiness.contact.email,
      address: `${hairMakeupDemoBusiness.location.address}, ${hairMakeupDemoBusiness.location.city}, ${hairMakeupDemoBusiness.location.postcode}`,
      socialLinks: { instagram: hairMakeupDemoBusiness.contact.instagram },
    }
  }

  return {
    phone: '01223 555 010',
    email: 'hello@example.com',
    address: 'Demo address · replace with your real location or service area',
  }
}

function buildFallbackPresence(businessName: string): PageSection[] {
  const template = presenceTemplateCatalogue[0]
  return buildGeneric(businessName, template, 'account')
}

export function createCanonicalPresencePageContent(
  businessName: string,
  _category: BusinessCategory,
  templateSlug?: string | null,
  options: CreateCanonicalPresencePageOptions = {}
): CanonicalPresencePage {
  const template = templateSlug ? getPresenceTemplate(templateSlug) : undefined
  const mode = options.mode || 'account'

  if (!template) {
    return { sections: buildFallbackPresence(businessName) }
  }

  const sections =
    template.slug === 'heavenly-pamper-palace'
      ? buildHeavenlyPamper(businessName, mode)
      : template.slug === 'editorial-beauty'
        ? buildEditorialBeauty(businessName, mode)
        : buildGeneric(businessName, template, mode)

  const mergedSections =
    options.preserveContent && options.existingSections?.length
      ? preserveExistingContent(sections, options.existingSections)
      : sections

  return {
    templateSlug: template.slug,
    templateName: template.name,
    templateVersion: CANONICAL_TEMPLATE_VERSION,
    sections: mergedSections,
    theme: baseTheme(template),
    previewServices: mode === 'preview' ? createPreviewServices(template) : undefined,
    previewBusinessData: mode === 'preview' ? previewBusinessData(template.slug) : undefined,
  }
}

export function getCanonicalTemplateThumbnail(templateSlug: string) {
  if (templateSlug === 'heavenly-pamper-palace') return realisticDemoBusiness.images.hero
  if (templateSlug === 'editorial-beauty') return hairMakeupDemoBusiness.images.hero
  return genericImages[templateSlug]?.hero || genericImages['serene-wellness'].hero
}

export function isCanonicalTemplateSlug(templateSlug: string) {
  return presenceTemplateCatalogue.some(template => template.slug === templateSlug)
}
