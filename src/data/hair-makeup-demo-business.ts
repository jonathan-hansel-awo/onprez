export interface HairMakeupDemoService {
  id: string
  name: string
  price: string
  duration: string
  description: string
  image: keyof HairMakeupDemoBusiness['images']
  preparation: string
}

export interface HairMakeupDemoBusiness {
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
  location: { address: string; city: string; postcode: string }
  contact: { phone: string; email: string; instagram: string }
  images: {
    hero: string
    braids: string
    silkPress: string
    makeup: string
    bridal: string
    studio: string
    owner: string
  }
  services: HairMakeupDemoService[]
  hours: Array<{ day: string; time: string }>
  bookingSlots: string[]
  policies: string[]
  reviews: Array<{ id: string; name: string; service: string; quote: string; rating: number }>
  faqs: Array<{ id: string; question: string; answer: string }>
}

/**
 * A second production-quality P2-005 fixture in a distinct service sector.
 * It remains code-backed so examples never create fake production customers or appointments.
 */
export const hairMakeupDemoBusiness: HairMakeupDemoBusiness = {
  name: 'Crown & Canvas Studio',
  templateSlug: 'editorial-beauty',
  category: 'Textured hair and makeup artistry',
  tagline: 'Your texture. Your features. Fully considered.',
  description:
    'A Cambridge studio specialising in healthy textured-hair styling and polished makeup for everyday confidence, celebrations and weddings.',
  owner: {
    name: 'Nia Okafor',
    role: 'Founder, hairstylist and makeup artist',
    biography:
      'Nia created Crown & Canvas to give textured hair and deeper skin tones the time, technique and product knowledge they deserve. Every appointment starts with a proper conversation and finishes with practical advice for maintaining the look at home.',
    credentials: [
      'Level 3 Hairdressing',
      'Certified makeup artist',
      'Bridal specialist',
      'Fully insured',
    ],
  },
  location: {
    address: '42 Mill Yard',
    city: 'Cambridge',
    postcode: 'CB1 2AZ',
  },
  contact: {
    phone: '01223 555 042',
    email: 'hello@crownandcanvas.example',
    instagram: '@crownandcanvasstudio',
  },
  images: {
    hero: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1800&q=85',
    braids:
      'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=1200&q=85',
    silkPress:
      'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=1200&q=85',
    makeup:
      'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1200&q=85',
    bridal:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85',
    studio:
      'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1400&q=85',
    owner:
      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=1200&q=85',
  },
  services: [
    {
      id: 'medium-knotless-braids',
      name: 'Medium Knotless Braids',
      price: 'from £145',
      duration: '4 hr 30 min',
      description:
        'Lightweight waist-length knotless braids with clean parting, a comfortable base and a polished finish.',
      image: 'braids',
      preparation:
        'Arrive with hair washed, fully detangled and blow-dried, or add preparation at checkout.',
    },
    {
      id: 'silk-press',
      name: 'Silk Press & Treatment',
      price: '£78',
      duration: '2 hr',
      description:
        'A clarifying cleanse, conditioning treatment, careful blow-dry and movement-rich thermal finish.',
      image: 'silkPress',
      preparation:
        'Come with hair free from extensions and heavy oils; a consultation is included.',
    },
    {
      id: 'wig-install',
      name: 'Custom Wig Install',
      price: 'from £110',
      duration: '2 hr 30 min',
      description:
        'Braid-down, lace preparation, secure installation and styling tailored to your unit and hairline.',
      image: 'studio',
      preparation: 'Drop off new lace units at least 48 hours beforehand for customisation.',
    },
    {
      id: 'signature-soft-glam',
      name: 'Signature Soft Glam',
      price: '£68',
      duration: '1 hr 15 min',
      description:
        'Skin-focused occasion makeup with lashes and a refined finish shaped around your features and outfit.',
      image: 'makeup',
      preparation:
        'Arrive with a clean face; share outfit or inspiration photos in your booking notes.',
    },
    {
      id: 'bridal-preview',
      name: 'Bridal Hair & Makeup Preview',
      price: '£165',
      duration: '3 hr',
      description:
        'A collaborative trial covering your complete hair and makeup look, timing, products and photography.',
      image: 'bridal',
      preparation:
        'Bring your veil or hair accessories and reference images; a patch test is required first.',
    },
    {
      id: 'new-client-consultation',
      name: 'New Client Consultation',
      price: 'Free',
      duration: '20 min',
      description:
        'A video consultation to discuss your hair history, desired look, timings and the best service to book.',
      image: 'owner',
      preparation: 'Have recent photos of your hair and inspiration images ready to share.',
    },
  ],
  hours: [
    { day: 'Monday', time: 'Closed' },
    { day: 'Tuesday', time: '10:00–18:00' },
    { day: 'Wednesday', time: '10:00–20:00' },
    { day: 'Thursday', time: '10:00–20:00' },
    { day: 'Friday', time: '09:00–18:00' },
    { day: 'Saturday', time: '08:00–17:00' },
    { day: 'Sunday', time: 'Bridal bookings only' },
  ],
  bookingSlots: ['Wednesday · 10:00', 'Thursday · 13:30', 'Friday · 09:00', 'Saturday · 14:00'],
  policies: [
    'A 30% non-refundable deposit secures every appointment longer than one hour.',
    'Braiding hair is included only where the service description confirms it; specialist colours are quoted separately.',
    'Please give at least 48 hours’ notice to move an appointment. Bridal bookings follow the signed booking agreement.',
    'Patch tests must be completed 48 hours before services that use adhesive, tint or unfamiliar products.',
  ],
  reviews: [
    {
      id: 'review-ada',
      name: 'Ada M.',
      service: 'Medium Knotless Braids',
      quote:
        'Beautifully neat without feeling tight. Nia explained the upkeep and the appointment finished exactly when promised.',
      rating: 5,
    },
    {
      id: 'review-jade',
      name: 'Jade R.',
      service: 'Signature Soft Glam',
      quote:
        'My skin still looked like skin, the shade match was perfect and the makeup photographed beautifully all evening.',
      rating: 5,
    },
    {
      id: 'review-zainab',
      name: 'Zainab K.',
      service: 'Bridal Hair & Makeup Preview',
      quote:
        'The trial removed every worry. We tested two looks, planned the morning properly and I never felt rushed.',
      rating: 5,
    },
  ],
  faqs: [
    {
      id: 'hair-included',
      question: 'Is braiding hair included?',
      answer:
        'Natural black, dark brown and standard blend colours are included for selected braid services. Choose your colour during booking; specialist blends are confirmed and quoted separately.',
    },
    {
      id: 'preparation',
      question: 'Can you wash and prepare my hair?',
      answer:
        'Yes. Add the wash, deep-condition and blow-dry option when booking. Otherwise, follow the preparation note shown on your chosen service.',
    },
    {
      id: 'bridal-travel',
      question: 'Do you travel for weddings?',
      answer:
        'Yes. Bridal bookings are available across Cambridgeshire and further afield. Travel and early-start fees are confirmed after your preview appointment.',
    },
    {
      id: 'allergies',
      question: 'What if I have sensitive skin or allergies?',
      answer:
        'List all sensitivities in your booking notes. Nia will review the products, arrange any required patch test and contact you before the appointment if needed.',
    },
    {
      id: 'late-arrival',
      question: 'What happens if I am late?',
      answer:
        'Please call as soon as possible. Arrivals over 15 minutes late may need a simplified finish or a new appointment so the next client is not delayed.',
    },
  ],
}

export const hairMakeupDemoHref =
  '/templates/editorial-beauty?businessName=Crown%20%26%20Canvas%20Studio&view=client'
