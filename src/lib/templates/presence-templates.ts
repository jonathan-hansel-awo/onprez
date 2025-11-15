import { PresenceTemplate } from '@/types/templates'
import { PageSection } from '@/types/page-sections'

// Export template categories
export const TEMPLATE_CATEGORIES = {
  modern: 'Modern',
  classic: 'Classic',
  minimal: 'Minimal',
  creative: 'Creative',
  professional: 'Professional',
} as const

export const PRESENCE_TEMPLATES: PresenceTemplate[] = [
  // Modern Template
  {
    id: 'modern-default',
    name: 'Modern Professional',
    description: 'Clean, contemporary design with bold typography and gradient accents',
    category: 'modern',
    thumbnail: '/templates/modern-default.jpg',
    isDefault: true,
    content: {
      sections: [
        {
          id: `section-hero-${Date.now()}`,
          type: 'HERO',
          order: 0,
          isVisible: true,
          data: {
            title: 'Welcome to Your Professional Space',
            subtitle: 'Book appointments and explore services with ease',
            alignment: 'center',
            overlay: true,
            ctaText: 'Get Started',
            ctaLink: '#services',
          },
        },
        {
          id: `section-about-${Date.now()}`,
          type: 'ABOUT',
          order: 1,
          isVisible: true,
          data: {
            title: 'About Me',
            content:
              '<p>Share your story, expertise, and what makes you unique. This is your opportunity to connect with potential clients.</p>',
            imagePosition: 'right',
          },
        },
        {
          id: `section-services-${Date.now()}`,
          type: 'SERVICES',
          order: 2,
          isVisible: true,
          data: {
            title: 'Services',
            description: 'Explore what I offer and book your appointment',
            layout: 'grid',
            showPrices: true,
          },
        },
        {
          id: `section-testimonials-${Date.now()}`,
          type: 'TESTIMONIALS',
          order: 3,
          isVisible: true,
          data: {
            title: 'What Clients Say',
            testimonials: [],
            layout: 'carousel',
          },
        },
        {
          id: `section-faq-${Date.now()}`,
          type: 'FAQ',
          order: 4,
          isVisible: true,
          data: {
            title: 'Frequently Asked Questions',
            items: [],
          },
        },
        {
          id: `section-contact-${Date.now()}`,
          type: 'CONTACT',
          order: 5,
          isVisible: true,
          data: {
            title: 'Get in Touch',
            showPhone: true,
            showEmail: true,
            showAddress: true,
            showMap: false,
            showSocialMedia: true,
          },
        },
      ] as PageSection[],
      theme: {
        primaryColor: '#3B82F6',
        secondaryColor: '#8B5CF6',
        fontFamily: 'Inter',
      },
    },
  },

  // Classic Template
  {
    id: 'classic-elegant',
    name: 'Classic Elegant',
    description: 'Timeless design with traditional layout and serif typography',
    category: 'classic',
    thumbnail: '/templates/classic-elegant.jpg',
    content: {
      sections: [
        {
          id: `section-hero-classic-${Date.now()}`,
          type: 'HERO',
          order: 0,
          isVisible: true,
          data: {
            title: 'Experience Excellence',
            subtitle: 'Quality service delivered with care',
            alignment: 'center',
            overlay: true,
            ctaText: 'Learn More',
            ctaLink: '#about',
          },
        },
        {
          id: `section-about-classic-${Date.now()}`,
          type: 'ABOUT',
          order: 1,
          isVisible: true,
          data: {
            title: 'Our Story',
            content:
              '<p>Established with a commitment to excellence, we bring years of experience to every client interaction.</p>',
            imagePosition: 'left',
          },
        },
        {
          id: `section-services-classic-${Date.now()}`,
          type: 'SERVICES',
          order: 2,
          isVisible: true,
          data: {
            title: 'Our Services',
            description: 'Professional services tailored to your needs',
            layout: 'list',
            showPrices: true,
          },
        },
        {
          id: `section-gallery-classic-${Date.now()}`,
          type: 'GALLERY',
          order: 3,
          isVisible: true,
          data: {
            title: 'Gallery',
            images: [],
            layout: 'grid',
            columns: 3,
          },
        },
        {
          id: `section-contact-classic-${Date.now()}`,
          type: 'CONTACT',
          order: 4,
          isVisible: true,
          data: {
            title: 'Contact Us',
            showPhone: true,
            showEmail: true,
            showAddress: true,
            showMap: true,
            showSocialMedia: true,
          },
        },
      ] as PageSection[],
      theme: {
        primaryColor: '#1F2937',
        secondaryColor: '#6B7280',
        fontFamily: 'Georgia',
      },
    },
  },

  // Minimal Template
  {
    id: 'minimal-clean',
    name: 'Minimal Clean',
    description: 'Simple, focused design with plenty of whitespace',
    category: 'minimal',
    thumbnail: '/templates/minimal-clean.jpg',
    content: {
      sections: [
        {
          id: `section-hero-minimal-${Date.now()}`,
          type: 'HERO',
          order: 0,
          isVisible: true,
          data: {
            title: 'Simple. Professional. Effective.',
            alignment: 'left',
            overlay: false,
          },
        },
        {
          id: `section-services-minimal-${Date.now()}`,
          type: 'SERVICES',
          order: 1,
          isVisible: true,
          data: {
            title: 'What I Do',
            layout: 'list',
            showPrices: true,
          },
        },
        {
          id: `section-about-minimal-${Date.now()}`,
          type: 'ABOUT',
          order: 2,
          isVisible: true,
          data: {
            title: 'About',
            content: '<p>Focus on what matters. Clear communication and quality results.</p>',
            imagePosition: 'right',
          },
        },
        {
          id: `section-contact-minimal-${Date.now()}`,
          type: 'CONTACT',
          order: 3,
          isVisible: true,
          data: {
            title: 'Contact',
            showPhone: true,
            showEmail: true,
            showAddress: false,
            showMap: false,
            showSocialMedia: true,
          },
        },
      ] as PageSection[],
      theme: {
        primaryColor: '#000000',
        secondaryColor: '#666666',
        fontFamily: 'Inter',
      },
    },
  },

  // Creative Template
  {
    id: 'creative-vibrant',
    name: 'Creative Vibrant',
    description: 'Bold, colorful design for creative professionals',
    category: 'creative',
    thumbnail: '/templates/creative-vibrant.jpg',
    content: {
      sections: [
        {
          id: `section-hero-creative-${Date.now()}`,
          type: 'HERO',
          order: 0,
          isVisible: true,
          data: {
            title: 'Create. Inspire. Deliver.',
            subtitle: 'Bringing your vision to life',
            alignment: 'center',
            overlay: true,
            ctaText: 'See My Work',
            ctaLink: '#gallery',
          },
        },
        {
          id: `section-gallery-creative-${Date.now()}`,
          type: 'GALLERY',
          order: 1,
          isVisible: true,
          data: {
            title: 'Portfolio',
            images: [],
            layout: 'masonry',
            columns: 3,
          },
        },
        {
          id: `section-about-creative-${Date.now()}`,
          type: 'ABOUT',
          order: 2,
          isVisible: true,
          data: {
            title: 'Creative Vision',
            content:
              '<p>Passionate about creating unique experiences that stand out and make an impact.</p>',
            imagePosition: 'left',
          },
        },
        {
          id: `section-services-creative-${Date.now()}`,
          type: 'SERVICES',
          order: 3,
          isVisible: true,
          data: {
            title: 'Services',
            description: 'What I can do for you',
            layout: 'grid',
            showPrices: true,
          },
        },
        {
          id: `section-testimonials-creative-${Date.now()}`,
          type: 'TESTIMONIALS',
          order: 4,
          isVisible: true,
          data: {
            title: 'Client Love',
            testimonials: [],
            layout: 'grid',
          },
        },
        {
          id: `section-contact-creative-${Date.now()}`,
          type: 'CONTACT',
          order: 5,
          isVisible: true,
          data: {
            title: "Let's Connect",
            showPhone: true,
            showEmail: true,
            showAddress: false,
            showMap: false,
            showSocialMedia: true,
          },
        },
      ] as PageSection[],
      theme: {
        primaryColor: '#EC4899',
        secondaryColor: '#8B5CF6',
        fontFamily: 'Inter',
      },
    },
  },

  // Professional Template
  {
    id: 'professional-corporate',
    name: 'Professional Corporate',
    description: 'Business-focused design with trust-building elements',
    category: 'professional',
    thumbnail: '/templates/professional-corporate.jpg',
    content: {
      sections: [
        {
          id: `section-hero-professional-${Date.now()}`,
          type: 'HERO',
          order: 0,
          isVisible: true,
          data: {
            title: 'Professional Excellence',
            subtitle: 'Trusted expertise for your business needs',
            alignment: 'left',
            overlay: true,
            ctaText: 'Book Consultation',
            ctaLink: '#services',
          },
        },
        {
          id: `section-about-professional-${Date.now()}`,
          type: 'ABOUT',
          order: 1,
          isVisible: true,
          data: {
            title: 'Professional Background',
            content:
              '<p>With extensive experience and proven results, we deliver professional services you can trust.</p>',
            imagePosition: 'right',
          },
        },
        {
          id: `section-services-professional-${Date.now()}`,
          type: 'SERVICES',
          order: 2,
          isVisible: true,
          data: {
            title: 'Professional Services',
            description: 'Comprehensive solutions for your needs',
            layout: 'grid',
            showPrices: false,
          },
        },
        {
          id: `section-faq-professional-${Date.now()}`,
          type: 'FAQ',
          order: 3,
          isVisible: true,
          data: {
            title: 'Common Questions',
            items: [],
          },
        },
        {
          id: `section-testimonials-professional-${Date.now()}`,
          type: 'TESTIMONIALS',
          order: 4,
          isVisible: true,
          data: {
            title: 'Client Success Stories',
            testimonials: [],
            layout: 'carousel',
          },
        },
        {
          id: `section-contact-professional-${Date.now()}`,
          type: 'CONTACT',
          order: 5,
          isVisible: true,
          data: {
            title: 'Schedule a Consultation',
            showPhone: true,
            showEmail: true,
            showAddress: true,
            showMap: true,
            showSocialMedia: true,
          },
        },
      ] as PageSection[],
      theme: {
        primaryColor: '#1E40AF',
        secondaryColor: '#3B82F6',
        fontFamily: 'Inter',
      },
    },
  },
]

// Helper function to get template by ID
export function getTemplateById(id: string): PresenceTemplate | undefined {
  return PRESENCE_TEMPLATES.find(template => template.id === id)
}

// Helper function to get default template
export function getDefaultTemplate(): PresenceTemplate {
  return PRESENCE_TEMPLATES.find(template => template.isDefault) || PRESENCE_TEMPLATES[0]
}

// Helper function to get templates by category
export function getTemplatesByCategory(category: string): PresenceTemplate[] {
  return PRESENCE_TEMPLATES.filter(template => template.category === category)
}
