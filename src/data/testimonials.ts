export interface Testimonial {
  id: string
  type: 'quote-large' | 'quote-small' | 'metric' | 'video'
  size: 'small' | 'medium' | 'large' // Grid size
  content?: string
  author?: {
    name: string
    role: string
    avatar: string
  }
  rating?: number
  metric?: {
    before: number
    after: number
    label: string
    unit?: string
  }
  video?: {
    thumbnail: string
    duration: string
  }
}

export const testimonials: Testimonial[] = [
  // Large Quote
  {
    id: '1',
    type: 'quote-large',
    size: 'large',
    content:
      'OnPrez completely transformed how I run my business. I went from juggling 5 different tools to having everything in one beautiful place. My booking rate increased by 40% in the first month!',
    author: {
      name: 'Sarah Mitchell',
      role: 'Hair Stylist, Los Angeles',
      avatar: '💇‍♀️',
    },
    rating: 5,
  },

  // Small Quotes
  {
    id: '2',
    type: 'quote-small',
    size: 'small',
    content: 'Best decision I made for my business. Simple, elegant, effective.',
    author: {
      name: 'Marcus Johnson',
      role: 'Personal Trainer',
      avatar: '💪',
    },
    rating: 5,
  },
  {
    id: '3',
    type: 'quote-small',
    size: 'small',
    content: 'My clients love how easy it is to book. I love how easy it is to manage!',
    author: {
      name: 'Emma Davis',
      role: 'Massage Therapist',
      avatar: '💆',
    },
    rating: 5,
  },

  // Metrics
  {
    id: '4',
    type: 'metric',
    size: 'small',
    metric: {
      before: 12,
      after: 45,
      label: 'Monthly Bookings',
    },
  },
  {
    id: '5',
    type: 'metric',
    size: 'small',
    metric: {
      before: 2,
      after: 15,
      label: 'Hours Saved',
      unit: 'hrs/week',
    },
  },

  // Video Testimonials
  {
    id: '6',
    type: 'video',
    size: 'medium',
    author: {
      name: 'Alex Rivera',
      role: 'Yoga Instructor',
      avatar: '🧘',
    },
    video: {
      thumbnail: '🎥',
      duration: '2:34',
    },
  },

  // More Small Quotes
  {
    id: '7',
    type: 'quote-small',
    size: 'small',
    content: 'The customization options are incredible. My page looks exactly how I imagined.',
    author: {
      name: 'Olivia Brown',
      role: 'Graphic Designer',
      avatar: '🎨',
    },
    rating: 5,
  },
  {
    id: '8',
    type: 'quote-small',
    size: 'small',
    content: "I get compliments on my OnPrez page all the time. It's become part of my brand.",
    author: {
      name: 'David Park',
      role: 'Photographer',
      avatar: '📸',
    },
    rating: 5,
  },

  // Another Metric
  {
    id: '9',
    type: 'metric',
    size: 'small',
    metric: {
      before: 3,
      after: 4.9,
      label: 'Average Rating',
      unit: '⭐',
    },
  },

  // Medium Quote
  {
    id: '10',
    type: 'quote-small',
    size: 'medium',
    content:
      'OnPrez helped me go from side hustle to full-time business. The professionalism it adds is worth 10x the price.',
    author: {
      name: 'Sophie Martin',
      role: 'Nutritionist',
      avatar: '🥗',
    },
    rating: 5,
  },
]
