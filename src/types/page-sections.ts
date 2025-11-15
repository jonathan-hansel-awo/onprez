// Section type definitions
export type SectionType =
  | 'HERO'
  | 'ABOUT'
  | 'SERVICES'
  | 'GALLERY'
  | 'CONTACT'
  | 'FAQ'
  | 'TESTIMONIALS'
  | 'CUSTOM_HTML'

// Base section interface
export interface BaseSection {
  id: string
  type: SectionType
  order: number
  isVisible: boolean
}

// Hero section
export interface HeroSection extends BaseSection {
  type: 'HERO'
  data: {
    title: string
    subtitle?: string
    backgroundImage?: string
    ctaText?: string
    ctaLink?: string
    overlay?: boolean
    alignment?: 'left' | 'center' | 'right'
  }
}

// About section
export interface AboutSection extends BaseSection {
  type: 'ABOUT'
  data: {
    title: string
    content: string
    image?: string
    imagePosition?: 'left' | 'right'
  }
}

// Services section
export interface ServicesSection extends BaseSection {
  type: 'SERVICES'
  data: {
    title: string
    description?: string
    layout?: 'grid' | 'list'
    showPrices?: boolean
    serviceIds?: string[] // Reference to Service model
  }
}

// Gallery section
export interface GallerySection extends BaseSection {
  type: 'GALLERY'
  data: {
    title?: string
    images: Array<{
      url: string
      alt: string
      caption?: string
    }>
    layout?: 'grid' | 'masonry' | 'carousel'
    columns?: 2 | 3 | 4
  }
}

// Contact section
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
  }
}

// FAQ section
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

// Testimonials section
export interface TestimonialsSection extends BaseSection {
  type: 'TESTIMONIALS'
  data: {
    title: string
    testimonials: Array<{
      id: string
      name: string
      role?: string
      content: string
      image?: string
      rating?: number
    }>
    layout?: 'carousel' | 'grid'
  }
}

// Custom HTML section
export interface CustomHTMLSection extends BaseSection {
  type: 'CUSTOM_HTML'
  data: {
    html: string
    css?: string
  }
}

// Union type of all sections
export type PageSection =
  | HeroSection
  | AboutSection
  | ServicesSection
  | GallerySection
  | ContactSection
  | FAQSection
  | TestimonialsSection
  | CustomHTMLSection

// Page content structure
export interface PageContent {
  sections: PageSection[]
  theme?: {
    primaryColor?: string
    secondaryColor?: string
    fontFamily?: string
  }
}

// Helper function to create a new section with defaults
export function createSection(type: SectionType, order: number): PageSection {
  const baseSection = {
    id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    order,
    isVisible: true,
  }

  switch (type) {
    case 'HERO':
      return {
        ...baseSection,
        type: 'HERO',
        data: {
          title: 'Welcome',
          subtitle: '',
          alignment: 'center',
          overlay: true,
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
        },
      }

    case 'SERVICES':
      return {
        ...baseSection,
        type: 'SERVICES',
        data: {
          title: 'Our Services',
          layout: 'grid',
          showPrices: true,
        },
      }

    case 'GALLERY':
      return {
        ...baseSection,
        type: 'GALLERY',
        data: {
          title: 'Gallery',
          images: [],
          layout: 'grid',
          columns: 3,
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
