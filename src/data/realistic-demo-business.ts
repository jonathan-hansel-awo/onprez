export interface DemoService {
  id: string
  name: string
  price: string
  duration: string
  description: string
  image: keyof RealisticDemoBusiness['images']
}

export interface RealisticDemoBusiness {
  name: string
  templateSlug: string
  category: string
  tagline: string
  description: string
  owner: {
    name: string
    role: string
    biography: string
    credentials: string[]
  }
  location: {
    address: string
    city: string
    postcode: string
  }
  contact: {
    phone: string
    email: string
    instagram: string
  }
  images: {
    hero: string
    treatment: string
    facial: string
    interior: string
    owner: string
  }
  services: DemoService[]
  hours: Array<{ day: string; time: string }>
  bookingSlots: string[]
  policies: string[]
  reviews: Array<{ id: string; name: string; treatment: string; quote: string; rating: number }>
  faqs: Array<{ id: string; question: string; answer: string }>
}

/**
 * Canonical P2-005 demo fixture.
 *
 * This is intentionally code-backed instead of database-seeded: production deployments can use
 * it safely for public examples, screenshots and onboarding without creating a fake business,
 * owner, reviews or appointments in customer data.
 */
export const realisticDemoBusiness: RealisticDemoBusiness = {
  name: 'Heavenly Pamper Palace',
  templateSlug: 'heavenly-pamper-palace',
  category: 'Luxury wellness and beauty',
  tagline: 'A brighter kind of serenity',
  description:
    'A private Ely treatment studio offering unhurried massage, facial and body rituals tailored to how each client wants to feel.',
  owner: {
    name: 'Amara Cole',
    role: 'Founder and senior therapist',
    biography:
      'Amara founded Heavenly Pamper Palace after twelve years in luxury spa therapy. Her approach combines careful consultation, evidence-informed techniques and the small details that make an appointment feel genuinely personal.',
    credentials: ['Level 3 Massage Therapy', 'Level 3 Facial Treatments', 'Fully insured'],
  },
  location: {
    address: '18 Willow Court',
    city: 'Ely, Cambridgeshire',
    postcode: 'CB7 4QW',
  },
  contact: {
    phone: '01353 555 018',
    email: 'hello@heavenlypamper.example',
    instagram: '@heavenlypamperpalace',
  },
  images: {
    hero: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1800&q=85',
    treatment:
      'https://images.unsplash.com/photo-1677682693087-711e24efaa69?auto=format&fit=crop&w=1470&q=85',
    facial:
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=85',
    interior:
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1400&q=85',
    owner:
      'https://images.unsplash.com/photo-1646831055574-b945ace1b495?auto=format&fit=crop&w=1335&q=85',
  },
  services: [
    {
      id: 'golden-glow',
      name: 'Golden Glow Ritual',
      price: '£95',
      duration: '90 min',
      description:
        'A full-body exfoliation, warm-oil massage and nourishing finish for deeply rested skin.',
      image: 'treatment',
    },
    {
      id: 'serenity-massage',
      name: 'Serenity Massage',
      price: '£70',
      duration: '60 min',
      description:
        'A personalised pressure massage focused on easing tension and restoring comfortable movement.',
      image: 'interior',
    },
    {
      id: 'radiance-facial',
      name: 'Radiance Facial',
      price: '£65',
      duration: '60 min',
      description:
        'A consultation-led facial with gentle exfoliation, massage and hydration selected for your skin.',
      image: 'facial',
    },
    {
      id: 'calm-reset',
      name: 'Calm Reset',
      price: '£42',
      duration: '30 min',
      description:
        'A focused neck, shoulder and scalp treatment for busy days and tight schedules.',
      image: 'treatment',
    },
    {
      id: 'new-client-consultation',
      name: 'New Client Consultation',
      price: 'Free',
      duration: '15 min',
      description:
        'A short phone consultation to discuss sensitivities, goals and the right first treatment.',
      image: 'owner',
    },
  ],
  hours: [
    { day: 'Monday', time: 'Closed' },
    { day: 'Tuesday', time: '10:00–19:00' },
    { day: 'Wednesday', time: '10:00–19:00' },
    { day: 'Thursday', time: '12:00–20:00' },
    { day: 'Friday', time: '09:00–17:00' },
    { day: 'Saturday', time: '09:00–16:00' },
    { day: 'Sunday', time: 'Closed' },
  ],
  bookingSlots: ['Wednesday · 10:30', 'Thursday · 14:00', 'Friday · 11:30', 'Saturday · 13:00'],
  policies: [
    'A 30% deposit secures treatments of 60 minutes or longer.',
    'Please give at least 24 hours’ notice when cancelling or moving an appointment.',
    'Patch tests are arranged in advance when a selected treatment requires one.',
  ],
  reviews: [
    {
      id: 'review-olivia',
      name: 'Olivia M.',
      treatment: 'Golden Glow Ritual',
      quote:
        'Every step felt thoughtful. I left relaxed, looked brighter and never once felt rushed.',
      rating: 5,
    },
    {
      id: 'review-naomi',
      name: 'Naomi T.',
      treatment: 'Serenity Massage',
      quote:
        'Amara listened properly and adapted the pressure throughout. The shoulder pain eased that evening.',
      rating: 5,
    },
    {
      id: 'review-rachel',
      name: 'Rachel K.',
      treatment: 'Radiance Facial',
      quote:
        'Clear advice, a beautiful room and no hard sell. I booked my next appointment before leaving.',
      rating: 5,
    },
  ],
  faqs: [
    {
      id: 'arrival',
      question: 'When should I arrive?',
      answer:
        'Please arrive five minutes before your appointment. New clients receive a short consultation before treatment time begins.',
    },
    {
      id: 'products',
      question: 'Can you accommodate sensitive skin or allergies?',
      answer:
        'Yes. Add any sensitivities to your booking note and Amara will confirm suitable products or arrange a patch test where needed.',
    },
    {
      id: 'parking',
      question: 'Is parking available?',
      answer:
        'Two client spaces are available beside the studio. Step-free access can be arranged when you book.',
    },
    {
      id: 'cancellation',
      question: 'What is the cancellation policy?',
      answer:
        'Appointments can be moved or cancelled without charge with at least 24 hours’ notice. Later cancellations may lose their deposit.',
    },
    {
      id: 'gift-vouchers',
      question: 'Do you offer gift vouchers?',
      answer:
        'Digital vouchers are available from £25 and can be used against any treatment within twelve months.',
    },
  ],
}

export const realisticDemoHref =
  '/templates/heavenly-pamper-palace?businessName=Heavenly%20Pamper%20Palace&view=client'
