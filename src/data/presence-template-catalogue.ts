import { realisticDemoBusiness } from '@/data/realistic-demo-business'

export const templateCategories = [
  'ALL',
  'WELLNESS',
  'BEAUTY',
  'FITNESS',
  'PROFESSIONAL',
  'CREATIVE',
  'EDUCATION',
] as const

export type TemplateCategory = (typeof templateCategories)[number]

export interface TemplateCatalogueItem {
  slug: string
  name: string
  category: Exclude<TemplateCategory, 'ALL'>
  description: string
  audience: string
  palette: {
    background: string
    surface: string
    primary: string
    text: string
  }
  preview: {
    eyebrow: string
    headline: string
    businessName: string
    services: Array<{
      id: string
      name: string
      duration: string
      price: string
      description: string
    }>
  }
}

export const presenceTemplateCatalogue: TemplateCatalogueItem[] = [
  {
    slug: 'serene-wellness',
    name: 'Serene Wellness',
    category: 'WELLNESS',
    description: 'A calm, image-led experience designed for massage, spa, and holistic care.',
    audience: 'Massage therapists, spas, wellness practitioners',
    palette: {
      background: '#f7f2ea',
      surface: '#e8ddd0',
      primary: '#6f7562',
      text: '#292b26',
    },
    preview: {
      eyebrow: 'Restore your balance',
      headline: 'Thoughtful treatments for calmer days.',
      businessName: 'Willow & Stone Wellness',
      services: [
        {
          id: 'deep-rest-massage',
          name: 'Deep Rest Massage',
          duration: '60 minutes',
          price: '£65',
          description: 'A restorative full-body treatment tailored to ease tension.',
        },
        {
          id: 'calm-reset',
          name: 'Calm Reset',
          duration: '30 minutes',
          price: '£38',
          description: 'A focused treatment for shoulders, neck, and upper back.',
        },
      ],
    },
  },
  {
    slug: 'heavenly-pamper-palace',
    name: 'Heavenly Pamper Palace',
    category: 'WELLNESS',
    description:
      'A bright cream-and-gold flagship spa template with glamorous serenity and a guided booking preview.',
    audience: 'Premium spas, massage studios, facialists, luxury wellness businesses',
    palette: {
      background: '#fffaf0',
      surface: '#f9e9b8',
      primary: '#b88a22',
      text: '#513b22',
    },
    preview: {
      eyebrow: realisticDemoBusiness.tagline,
      headline: 'Luminous care, polished rituals, and beautifully unhurried moments.',
      businessName: realisticDemoBusiness.name,
      services: realisticDemoBusiness.services.map(service => ({
        id: service.id,
        name: service.name,
        duration: service.duration.replace('min', 'minutes'),
        price: service.price,
        description: service.description,
      })),
    },
  },
  {
    slug: 'regent-barber',
    name: 'Regent Barber',
    category: 'BEAUTY',
    description:
      'A premium charcoal-and-copper barber template built around precision, confidence, and fast appointment booking.',
    audience: 'Barber shops, grooming studios, independent barbers, men’s salons',
    palette: {
      background: '#11110f',
      surface: '#191916',
      primary: '#c87941',
      text: '#f5f0e8',
    },
    preview: {
      eyebrow: 'Precision, craft, confidence',
      headline: 'Sharp cuts, considered detail, and an appointment built around your style.',
      businessName: 'Regent Barber Co.',
      services: [
        {
          id: 'signature-cut',
          name: 'Signature Cut',
          duration: '45 minutes',
          price: '£28',
          description: 'A consultation-led cut finished and styled with care.',
        },
        {
          id: 'skin-fade',
          name: 'Skin Fade',
          duration: '50 minutes',
          price: '£32',
          description: 'A clean, detailed fade tailored to your preferred finish.',
        },
        {
          id: 'cut-beard',
          name: 'Cut & Beard',
          duration: '70 minutes',
          price: '£42',
          description: 'A complete cut, beard shape, line-up, and finishing service.',
        },
      ],
    },
  },
  {
    slug: 'editorial-beauty',
    name: 'Editorial Beauty',
    category: 'BEAUTY',
    description: 'A confident visual layout for beauty professionals with strong social presence.',
    audience: 'Makeup artists, nail technicians, hair stylists',
    palette: {
      background: '#fff7f8',
      surface: '#f5dfe4',
      primary: '#9c4960',
      text: '#301f25',
    },
    preview: {
      eyebrow: 'Beauty, considered',
      headline: 'Polished work. Personal service.',
      businessName: 'The Rose Studio',
      services: [
        {
          id: 'signature-glam',
          name: 'Signature Glam',
          duration: '75 minutes',
          price: '£70',
          description: 'A complete occasion-ready makeup appointment.',
        },
        {
          id: 'soft-glam',
          name: 'Soft Glam',
          duration: '60 minutes',
          price: '£58',
          description: 'A natural, camera-ready finish tailored to you.',
        },
      ],
    },
  },
  {
    slug: 'kinetic-fitness',
    name: 'Kinetic Fitness',
    category: 'FITNESS',
    description: 'A bold, energetic template with direct programme and booking actions.',
    audience: 'Personal trainers, coaches, fitness instructors',
    palette: {
      background: '#f4f7f5',
      surface: '#dce9e1',
      primary: '#176b4d',
      text: '#10251d',
    },
    preview: {
      eyebrow: 'Train with purpose',
      headline: 'Build strength that carries into real life.',
      businessName: 'Northline Coaching',
      services: [
        {
          id: 'personal-training',
          name: 'Personal Training',
          duration: '60 minutes',
          price: '£55',
          description: 'One-to-one coaching built around your goals and routine.',
        },
        {
          id: 'movement-review',
          name: 'Movement Review',
          duration: '45 minutes',
          price: '£40',
          description: 'A focused assessment with practical next steps.',
        },
      ],
    },
  },
  {
    slug: 'clear-professional',
    name: 'Clear Professional',
    category: 'PROFESSIONAL',
    description: 'A precise, trust-led page for consultants and specialist services.',
    audience: 'Consultants, advisers, therapists, specialists',
    palette: {
      background: '#f6f8fb',
      surface: '#dfe7f2',
      primary: '#274c77',
      text: '#17273a',
    },
    preview: {
      eyebrow: 'Clarity before complexity',
      headline: 'Practical guidance for important decisions.',
      businessName: 'Harbour Advisory',
      services: [
        {
          id: 'initial-consultation',
          name: 'Initial Consultation',
          duration: '45 minutes',
          price: '£80',
          description: 'A structured conversation to clarify needs and next steps.',
        },
        {
          id: 'strategy-session',
          name: 'Strategy Session',
          duration: '90 minutes',
          price: '£150',
          description: 'A deeper working session with an actionable summary.',
        },
      ],
    },
  },
  {
    slug: 'frame-creative',
    name: 'Frame Creative',
    category: 'CREATIVE',
    description: 'An expressive portfolio-led template for visual and creative professionals.',
    audience: 'Photographers, designers, artists, creators',
    palette: {
      background: '#fbf8f2',
      surface: '#eee3d2',
      primary: '#8a4f24',
      text: '#2f241c',
    },
    preview: {
      eyebrow: 'Stories with shape',
      headline: 'Distinctive creative work for meaningful moments.',
      businessName: 'Fieldnote Studio',
      services: [
        {
          id: 'portrait-session',
          name: 'Portrait Session',
          duration: '90 minutes',
          price: '£180',
          description: 'A relaxed, directed session with a curated final gallery.',
        },
        {
          id: 'brand-shoot',
          name: 'Brand Shoot',
          duration: '3 hours',
          price: '£420',
          description: 'A visual content session shaped around your brand story.',
        },
      ],
    },
  },
  {
    slug: 'bright-education',
    name: 'Bright Education',
    category: 'EDUCATION',
    description: 'A friendly, structured template for tutors, teachers, and learning support.',
    audience: 'Tutors, music teachers, academic coaches',
    palette: {
      background: '#fffaf0',
      surface: '#f6e7bb',
      primary: '#9b6a08',
      text: '#342a16',
    },
    preview: {
      eyebrow: 'Learning made clearer',
      headline: 'Patient, practical support for confident progress.',
      businessName: 'Lantern Learning',
      services: [
        {
          id: 'one-to-one-tuition',
          name: 'One-to-One Tuition',
          duration: '60 minutes',
          price: '£35',
          description: 'Personalised sessions shaped around the learner’s needs.',
        },
        {
          id: 'exam-planning',
          name: 'Exam Planning Session',
          duration: '45 minutes',
          price: '£28',
          description: 'A practical study plan with priorities and milestones.',
        },
      ],
    },
  },
]

export function getPresenceTemplate(slug: string) {
  return presenceTemplateCatalogue.find(template => template.slug === slug)
}
