// Core section types retained for backwards-compatible template recipes
export type SectionType =
  | 'NAVBAR'
  | 'HERO'
  | 'ABOUT'
  | 'SERVICES'
  | 'GALLERY'
  | 'CONTACT'
  | 'FAQ'
  | 'TESTIMONIALS'
  | 'CUSTOM_HTML'

// Rich editor-only sections can be introduced without breaking older exhaustive template maps.
export type PresenceSectionType = SectionType | 'OWNER' | 'PROCESS'

export interface SectionAppearance {
  backgroundColor?: string
  textColor?: string
  accentColor?: string
  contentWidth?: 'narrow' | 'standard' | 'wide' | 'full'
  spacing?: 'compact' | 'normal' | 'spacious'
}

export interface BaseSection {
  id: string
  type: PresenceSectionType
  order: number
  isVisible: boolean
  appearance?: SectionAppearance
}

export interface NavbarSection extends BaseSection {
  type: 'NAVBAR'
  data: {
    logo?: string
    logoText?: string
    showLogo?: boolean
    showLogoText?: boolean
    links: Array<{
      id: string
      label: string
      href: string
      isExternal?: boolean
    }>
    ctaText?: string
    ctaLink?: string
    showCta?: boolean
    style?: 'transparent' | 'solid' | 'gradient'
    position?: 'fixed' | 'sticky' | 'static'
    backgroundColor?: string
    textColor?: 'light' | 'dark' | 'auto'
    variant?: 'standard' | 'floating' | 'editorial'
    showDivider?: boolean
    monogram?: string
    announcement?: string
  }
}

export interface HeroSection extends BaseSection {
  type: 'HERO'
  data: {
    title: string
    subtitle?: string
    eyebrow?: string
    backgroundImage?: string
    ctaText?: string
    ctaLink?: string
    secondaryCtaText?: string
    secondaryCtaLink?: string
    layout?: 'cover' | 'split' | 'editorial'
    imagePosition?: 'left' | 'right'
    imageFocalPoint?: 'center' | 'top' | 'bottom'
    minHeight?: 'compact' | 'standard' | 'viewport'
    overlay?: boolean
    alignment?: 'left' | 'center' | 'right'
    overlayColor?: string
    overlayOpacity?: number
    overlayStyle?: 'solid' | 'gradient-vertical' | 'gradient-diagonal'
    textColor?: 'light' | 'dark' | 'custom'
    customTextColor?: string
    textShadow?: boolean
    variant?:
      | 'classic'
      | 'luxury'
      | 'editorial'
      | 'bold'
      | 'professional'
      | 'creative'
      | 'education'
    imageTreatment?: 'full' | 'frame' | 'arch' | 'offset' | 'collage'
    floatingCard?: {
      eyebrow: string
      title: string
      description?: string
    }
    meta?: string[]
    decorativeText?: string
    showScrollCue?: boolean
  }
}

export interface AboutSection extends BaseSection {
  type: 'ABOUT'
  data: {
    title: string
    content: string
    eyebrow?: string
    image?: string
    imagePosition?: 'left' | 'right'
    layout?: 'split' | 'editorial' | 'centered'
    imageShape?: 'portrait' | 'landscape' | 'square'
    highlights?: string[]
    variant?: 'classic' | 'story' | 'atelier' | 'credentials'
    quote?: string
    stats?: Array<{
      value: string
      label: string
    }>
    imageTreatment?: 'classic' | 'arch' | 'stacked' | 'framed' | 'polaroid'
    secondaryImage?: string
  }
}

export interface OwnerSection extends BaseSection {
  type: 'OWNER'
  data: {
    eyebrow?: string
    name: string
    role?: string
    biography: string
    image?: string
    imagePosition?: 'left' | 'right'
    layout?: 'portrait' | 'profile-card' | 'editorial'
    credentials?: string[]
    quote?: string
    signature?: string
    ctaText?: string
    ctaLink?: string
  }
}

export interface ServicesSection extends BaseSection {
  type: 'SERVICES'
  data: {
    title: string
    description?: string
    eyebrow?: string
    layout?: 'grid' | 'list' | 'editorial'
    columns?: 2 | 3
    cardStyle?: 'elevated' | 'outlined' | 'minimal'
    showImages?: boolean
    showPrices?: boolean
    serviceIds?: string[]
  }
}

export interface ProcessSection extends BaseSection {
  type: 'PROCESS'
  data: {
    eyebrow?: string
    title: string
    description?: string
    layout?: 'steps' | 'timeline' | 'cards'
    columns?: 2 | 3 | 4
    steps: Array<{
      id: string
      title: string
      description: string
    }>
  }
}

export interface GallerySection extends BaseSection {
  type: 'GALLERY'
  data: {
    title?: string
    eyebrow?: string
    images: Array<{
      url: string
      alt: string
      caption?: string
    }>
    layout?: 'grid' | 'masonry' | 'carousel' | 'editorial'
    columns?: 2 | 3 | 4
    featuredImageIndex?: number
    gap?: 'tight' | 'normal' | 'wide'
    imageRadius?: 'none' | 'soft' | 'rounded'
  }
}

export interface ContactSection extends BaseSection {
  type: 'CONTACT'
  data: {
    title: string
    showPhone?: boolean
    showEmail?: boolean
    showAddress?: boolean
    showMap?: boolean
    showSocialMedia?: boolean
    mapEmbedUrl?: string
    eyebrow?: string
    description?: string
    ctaText?: string
    ctaLink?: string
    secondaryCtaText?: string
    secondaryCtaLink?: string
    layout?: 'standard' | 'panel' | 'immersive'
    backgroundImage?: string
    note?: string
  }
}

export interface FAQSection extends BaseSection {
  type: 'FAQ'
  data: {
    title: string
    items: Array<{
      id: string
      question: string
      answer: string
    }>
  }
}

export interface TestimonialsSection extends BaseSection {
  type: 'TESTIMONIALS'
  data: {
    title: string
    eyebrow?: string
    testimonials: Array<{
      id: string
      name: string
      role?: string
      content: string
      image?: string
      rating?: number
    }>
    layout?: 'carousel' | 'grid' | 'editorial'
    showRatings?: boolean
  }
}

export interface CustomHTMLSection extends BaseSection {
  type: 'CUSTOM_HTML'
  data: {
    html: string
    css?: string
  }
}

export type PageSection =
  | NavbarSection
  | HeroSection
  | AboutSection
  | OwnerSection
  | ServicesSection
  | ProcessSection
  | GallerySection
  | ContactSection
  | FAQSection
  | TestimonialsSection
  | CustomHTMLSection

export interface PageContent {
  sections: PageSection[]
  theme?: {
    primaryColor?: string
    secondaryColor?: string
    fontFamily?: string
  }
}

export function createSection(type: PresenceSectionType, order: number): PageSection {
  const baseSection = {
    id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    order,
    isVisible: true,
    appearance: {
      contentWidth: 'standard' as const,
      spacing: 'normal' as const,
    },
  }

  switch (type) {
    case 'NAVBAR':
      return {
        ...baseSection,
        type: 'NAVBAR',
        data: {
          showLogo: true,
          showLogoText: true,
          logoText: 'Your Business',
          links: [
            { id: 'link-1', label: 'About', href: '#about' },
            { id: 'link-2', label: 'Services', href: '#services' },
            { id: 'link-3', label: 'Contact', href: '#contact' },
          ],
          showCta: true,
          ctaText: 'Book Now',
          ctaLink: '#contact',
          style: 'solid',
          position: 'sticky',
          textColor: 'dark',
        },
      }

    case 'HERO':
      return {
        ...baseSection,
        type: 'HERO',
        data: {
          title: 'Welcome to Our Business',
          subtitle: 'Providing exceptional service to our community',
          ctaText: 'Get Started',
          ctaLink: '#contact',
          layout: 'cover',
          imagePosition: 'right',
          imageFocalPoint: 'center',
          minHeight: 'standard',
          alignment: 'center',
          overlay: true,
          overlayColor: '#000000',
          overlayOpacity: 50,
          overlayStyle: 'solid',
          textColor: 'light',
          textShadow: true,
          variant: 'classic',
          imageTreatment: 'full',
        },
      }

    case 'ABOUT':
      return {
        ...baseSection,
        type: 'ABOUT',
        data: {
          title: 'About Us',
          content: '',
          imagePosition: 'right',
          layout: 'split',
          imageShape: 'landscape',
          highlights: [],
        },
      }

    case 'OWNER':
      return {
        ...baseSection,
        type: 'OWNER',
        data: {
          eyebrow: 'Meet the owner',
          name: 'Your Name',
          role: 'Founder',
          biography:
            '<p>Introduce the person behind the business, their experience, and their approach.</p>',
          imagePosition: 'left',
          layout: 'portrait',
          credentials: [],
        },
      }

    case 'SERVICES':
      return {
        ...baseSection,
        type: 'SERVICES',
        data: {
          title: 'Our Services',
          layout: 'grid',
          columns: 3,
          cardStyle: 'elevated',
          showImages: true,
          showPrices: true,
        },
      }

    case 'PROCESS':
      return {
        ...baseSection,
        type: 'PROCESS',
        data: {
          eyebrow: 'How it works',
          title: 'A clear path from enquiry to appointment',
          layout: 'steps',
          columns: 3,
          steps: [
            {
              id: `step-${Date.now()}-1`,
              title: 'Choose a service',
              description: 'Find the option that best matches what you need.',
            },
            {
              id: `step-${Date.now()}-2`,
              title: 'Select a time',
              description: 'Review live availability and reserve a convenient appointment.',
            },
            {
              id: `step-${Date.now()}-3`,
              title: 'Receive confirmation',
              description: 'Get the details and preparation guidance you need before the visit.',
            },
          ],
        },
      }

    case 'GALLERY':
      return {
        ...baseSection,
        type: 'GALLERY',
        data: {
          title: 'Gallery',
          images: [],
          layout: 'carousel',
          columns: 3,
          featuredImageIndex: 0,
          gap: 'normal',
          imageRadius: 'soft',
        },
      }

    case 'CONTACT':
      return {
        ...baseSection,
        type: 'CONTACT',
        data: {
          title: 'Get in Touch',
          showPhone: true,
          showEmail: true,
          showAddress: true,
          showMap: false,
          showSocialMedia: true,
        },
      }

    case 'FAQ':
      return {
        ...baseSection,
        type: 'FAQ',
        data: {
          title: 'Frequently Asked Questions',
          items: [],
        },
      }

    case 'TESTIMONIALS':
      return {
        ...baseSection,
        type: 'TESTIMONIALS',
        data: {
          title: 'What Our Clients Say',
          testimonials: [],
          layout: 'carousel',
          showRatings: true,
        },
      }

    case 'CUSTOM_HTML':
      return {
        ...baseSection,
        type: 'CUSTOM_HTML',
        data: {
          html: '<div></div>',
        },
      }

    default:
      throw new Error(`Unknown section type: ${type}`)
  }
}
