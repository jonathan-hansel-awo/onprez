import { PageSection } from '@/types/page-sections'
import { BusinessCategory } from '@prisma/client'

/**
 * Creates default presence page content based on business name and category
 */
export function createDefaultPresencePageContent(
  businessName: string,
  category: BusinessCategory
): PageSection[] {
  const categoryDefaults = getCategoryDefaults(category)

  const sections: PageSection[] = [
    // Navbar Section
    {
      id: `section-navbar-${Date.now()}`,
      type: 'NAVBAR',
      order: 0,
      isVisible: true,
      data: {
        showLogo: true,
        showLogoText: true,
        logoText: businessName,
        links: [
          { id: 'link-about', label: 'About', href: '#about' },
          { id: 'link-services', label: 'Services', href: '#services' },
          { id: 'link-gallery', label: 'Gallery', href: '#gallery' },
          { id: 'link-contact', label: 'Contact', href: '#contact' },
        ],
        showCta: true,
        ctaText: 'Book Now',
        ctaLink: '#contact',
        style: 'solid',
        position: 'sticky',
        textColor: 'dark',
      },
    },

    // Hero Section
    {
      id: `section-hero-${Date.now() + 1}`,
      type: 'HERO',
      order: 1,
      isVisible: true,
      data: {
        title: `Welcome to ${businessName}`,
        subtitle: categoryDefaults.heroSubtitle,
        ctaText: categoryDefaults.ctaText,
        ctaLink: '#contact',
        alignment: 'center',
        overlay: true,
        overlayColor: '#000000',
        overlayOpacity: 50,
        overlayStyle: 'solid',
        textColor: 'light',
        textShadow: true,
      },
    },

    // About Section
    {
      id: `section-about-${Date.now() + 2}`,
      type: 'ABOUT',
      order: 2,
      isVisible: true,
      data: {
        title: 'About Us',
        content: categoryDefaults.aboutContent,
        imagePosition: 'right',
      },
    },

    // Services Section
    {
      id: `section-services-${Date.now() + 3}`,
      type: 'SERVICES',
      order: 3,
      isVisible: true,
      data: {
        title: 'Our Services',
        description: categoryDefaults.servicesDescription,
        layout: 'grid',
        showPrices: true,
      },
    },

    // Gallery Section
    {
      id: `section-gallery-${Date.now() + 4}`,
      type: 'GALLERY',
      order: 4,
      isVisible: true,
      data: {
        title: 'Our Work',
        images: [],
        layout: 'grid',
        columns: 3,
      },
    },

    // FAQ Section
    {
      id: `section-faq-${Date.now() + 5}`,
      type: 'FAQ',
      order: 5,
      isVisible: true,
      data: {
        title: 'Frequently Asked Questions',
        items: categoryDefaults.faqItems,
      },
    },

    // Contact Section
    {
      id: `section-contact-${Date.now() + 6}`,
      type: 'CONTACT',
      order: 6,
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
  ]

  return sections
}

/**
 * Get category-specific default content
 */
function getCategoryDefaults(category: BusinessCategory): {
  heroSubtitle: string
  ctaText: string
  aboutContent: string
  servicesDescription: string
  faqItems: Array<{ id: string; question: string; answer: string }>
} {
  const defaults: Record<string, ReturnType<typeof getCategoryDefaults>> = {
    SALON: {
      heroSubtitle:
        'Professional hair care and styling services to help you look and feel your best.',
      ctaText: 'Book Your Appointment',
      aboutContent: `<p>Welcome to our salon! We are dedicated to providing exceptional hair care services in a relaxing and welcoming environment.</p><p>Our team of skilled stylists stays up-to-date with the latest trends and techniques to ensure you leave looking and feeling amazing.</p>`,
      servicesDescription: 'Discover our range of professional hair care services.',
      faqItems: [
        {
          id: 'faq-1',
          question: 'Do I need to book in advance?',
          answer:
            'We recommend booking in advance to secure your preferred time slot, but we also welcome walk-ins when availability permits.',
        },
        {
          id: 'faq-2',
          question: 'What is your cancellation policy?',
          answer:
            'We kindly ask for at least 24 hours notice for cancellations. Late cancellations may be subject to a fee.',
        },
        {
          id: 'faq-3',
          question: 'Do you offer consultations?',
          answer:
            'Yes! We offer free consultations for new clients or anyone considering a significant change to their look.',
        },
      ],
    },
    BARBERSHOP: {
      heroSubtitle: 'Classic cuts and modern styles. Where tradition meets contemporary grooming.',
      ctaText: 'Book Your Cut',
      aboutContent: `<p>Welcome to our barbershop! We pride ourselves on delivering quality haircuts and grooming services in a classic barbershop atmosphere.</p><p>Whether you're after a traditional cut or something more modern, our experienced barbers have got you covered.</p>`,
      servicesDescription:
        'From classic cuts to hot towel shaves, we offer the full barbershop experience.',
      faqItems: [
        {
          id: 'faq-1',
          question: 'Do you take walk-ins?',
          answer:
            'Yes, we welcome walk-ins! However, booking ahead guarantees your spot and reduces wait times.',
        },
        {
          id: 'faq-2',
          question: 'How long does a typical haircut take?',
          answer:
            'A standard haircut takes about 20-30 minutes. Services like hot towel shaves may take longer.',
        },
        {
          id: 'faq-3',
          question: 'Do you offer beard grooming?',
          answer: 'Absolutely! We offer beard trims, shaping, and hot towel shaves.',
        },
      ],
    },
    SPA: {
      heroSubtitle: 'Relax, rejuvenate, and restore. Your journey to wellness begins here.',
      ctaText: 'Book Your Treatment',
      aboutContent: `<p>Welcome to our spa sanctuary. We offer a tranquil escape from the everyday, where you can unwind and restore your mind, body, and spirit.</p><p>Our skilled therapists provide personalised treatments using premium products to ensure you leave feeling completely refreshed.</p>`,
      servicesDescription: 'Indulge in our range of relaxing and rejuvenating spa treatments.',
      faqItems: [
        {
          id: 'faq-1',
          question: 'How early should I arrive for my appointment?',
          answer:
            'We recommend arriving 15 minutes early to complete any paperwork and begin relaxing before your treatment.',
        },
        {
          id: 'faq-2',
          question: 'What should I wear to my appointment?',
          answer:
            'Wear comfortable clothing. We provide robes and slippers for your comfort during your visit.',
        },
        {
          id: 'faq-3',
          question: 'Can I customise my treatment?',
          answer:
            'Yes! Our therapists will discuss your preferences and any areas of concern before your treatment begins.',
        },
      ],
    },
    FITNESS: {
      heroSubtitle: 'Transform your body and mind. Start your fitness journey with us today.',
      ctaText: 'Start Training',
      aboutContent: `<p>Welcome to our fitness studio! We're passionate about helping you achieve your health and fitness goals in a supportive, motivating environment.</p><p>Whether you're just starting out or looking to take your training to the next level, we're here to guide you every step of the way.</p>`,
      servicesDescription: 'Explore our range of fitness services and training programmes.',
      faqItems: [
        {
          id: 'faq-1',
          question: 'Do I need to be fit to start?',
          answer:
            'Not at all! We welcome all fitness levels and will tailor sessions to your current abilities and goals.',
        },
        {
          id: 'faq-2',
          question: 'What should I bring to my session?',
          answer:
            'Bring comfortable workout clothes, trainers, a water bottle, and a towel. We provide all the equipment.',
        },
        {
          id: 'faq-3',
          question: 'Do you offer trial sessions?',
          answer:
            'Yes! We offer introductory sessions for new clients to experience our training style.',
        },
      ],
    },
    BEAUTY: {
      heroSubtitle: 'Enhance your natural beauty with our professional beauty services.',
      ctaText: 'Book Your Treatment',
      aboutContent: `<p>Welcome to our beauty studio! We specialise in enhancing your natural beauty with a range of professional treatments.</p><p>Our skilled beauticians use premium products and the latest techniques to help you look and feel your absolute best.</p>`,
      servicesDescription: 'Discover our range of beauty treatments and services.',
      faqItems: [
        {
          id: 'faq-1',
          question: 'How should I prepare for my appointment?',
          answer:
            'Arrive with clean skin free of makeup for facial treatments. Specific prep instructions will be provided when booking.',
        },
        {
          id: 'faq-2',
          question: 'Are your products suitable for sensitive skin?',
          answer:
            'Yes, we offer a range of products suitable for all skin types. Please let us know about any sensitivities when booking.',
        },
        {
          id: 'faq-3',
          question: 'How often should I book treatments?',
          answer:
            "This depends on the treatment type. We'll recommend a schedule based on your individual needs and goals.",
        },
      ],
    },
  }

  // Return category-specific defaults or generic defaults
  return (
    defaults[category] || {
      heroSubtitle: 'Professional services tailored to your needs. Book your appointment today.',
      ctaText: 'Book Now',
      aboutContent: `<p>Welcome to ${category.toLowerCase().replace('_', ' ')}! We are dedicated to providing exceptional service and ensuring every client has a great experience.</p><p>Our team of professionals is here to help you with all your needs.</p>`,
      servicesDescription: 'Explore our range of professional services.',
      faqItems: [
        {
          id: 'faq-1',
          question: 'How do I book an appointment?',
          answer: 'You can book directly through our website or contact us by phone or email.',
        },
        {
          id: 'faq-2',
          question: 'What is your cancellation policy?',
          answer: 'We kindly ask for at least 24 hours notice for cancellations.',
        },
        {
          id: 'faq-3',
          question: 'Do you offer consultations?',
          answer: 'Yes, we offer consultations to discuss your needs before booking.',
        },
      ],
    }
  )
}
