export interface Example {
  id: string
  name: string
  profession: string
  handle: string
  category: 'beauty' | 'fitness' | 'wellness' | 'creative'
  image: string
  stats: {
    bookings: number
    views: number
    rating: number
  }
  colors: {
    primary: string
    secondary: string
  }
}

export const examples: Example[] = [
  // Beauty
  {
    id: '1',
    name: 'Sarah Mitchell',
    profession: 'Hair Stylist',
    handle: 'sarah-salon',
    category: 'beauty',
    image: '💇‍♀️',
    stats: {
      bookings: 156,
      views: 2400,
      rating: 4.9,
    },
    colors: {
      primary: 'from-pink-500 to-rose-500',
      secondary: 'bg-pink-50',
    },
  },
  {
    id: '2',
    name: 'Emma Davis',
    profession: 'Makeup Artist',
    handle: 'emma-beauty',
    category: 'beauty',
    image: '💄',
    stats: {
      bookings: 203,
      views: 3200,
      rating: 5.0,
    },
    colors: {
      primary: 'from-purple-500 to-pink-500',
      secondary: 'bg-purple-50',
    },
  },
  {
    id: '3',
    name: 'Lisa Chen',
    profession: 'Nail Technician',
    handle: 'lisa-nails',
    category: 'beauty',
    image: '💅',
    stats: {
      bookings: 189,
      views: 2800,
      rating: 4.8,
    },
    colors: {
      primary: 'from-rose-500 to-orange-500',
      secondary: 'bg-rose-50',
    },
  },

  // Fitness
  {
    id: '4',
    name: 'Marcus Johnson',
    profession: 'Personal Trainer',
    handle: 'marcus-fitness',
    category: 'fitness',
    image: '💪',
    stats: {
      bookings: 142,
      views: 3500,
      rating: 4.9,
    },
    colors: {
      primary: 'from-blue-500 to-cyan-500',
      secondary: 'bg-blue-50',
    },
  },
  {
    id: '5',
    name: 'Alex Rivera',
    profession: 'Yoga Instructor',
    handle: 'alex-yoga',
    category: 'fitness',
    image: '🧘',
    stats: {
      bookings: 178,
      views: 2900,
      rating: 5.0,
    },
    colors: {
      primary: 'from-green-500 to-teal-500',
      secondary: 'bg-green-50',
    },
  },
  {
    id: '6',
    name: 'Jake Williams',
    profession: 'Boxing Coach',
    handle: 'jake-boxing',
    category: 'fitness',
    image: '🥊',
    stats: {
      bookings: 134,
      views: 2600,
      rating: 4.8,
    },
    colors: {
      primary: 'from-red-500 to-orange-500',
      secondary: 'bg-red-50',
    },
  },

  // Wellness
  {
    id: '7',
    name: 'Emma Taylor',
    profession: 'Massage Therapist',
    handle: 'emma-massage',
    category: 'wellness',
    image: '💆',
    stats: {
      bookings: 167,
      views: 2700,
      rating: 4.9,
    },
    colors: {
      primary: 'from-indigo-500 to-purple-500',
      secondary: 'bg-indigo-50',
    },
  },
  {
    id: '8',
    name: 'Dr. Maya Patel',
    profession: 'Therapist',
    handle: 'maya-therapy',
    category: 'wellness',
    image: '🧠',
    stats: {
      bookings: 145,
      views: 3100,
      rating: 5.0,
    },
    colors: {
      primary: 'from-teal-500 to-emerald-500',
      secondary: 'bg-teal-50',
    },
  },
  {
    id: '9',
    name: 'Sophie Martin',
    profession: 'Nutritionist',
    handle: 'sophie-nutrition',
    category: 'wellness',
    image: '🥗',
    stats: {
      bookings: 156,
      views: 2500,
      rating: 4.8,
    },
    colors: {
      primary: 'from-lime-500 to-green-500',
      secondary: 'bg-lime-50',
    },
  },

  // Creative
  {
    id: '10',
    name: 'David Park',
    profession: 'Photographer',
    handle: 'david-photos',
    category: 'creative',
    image: '📸',
    stats: {
      bookings: 198,
      views: 4200,
      rating: 4.9,
    },
    colors: {
      primary: 'from-slate-500 to-gray-500',
      secondary: 'bg-slate-50',
    },
  },
  {
    id: '11',
    name: 'Olivia Brown',
    profession: 'Graphic Designer',
    handle: 'olivia-design',
    category: 'creative',
    image: '🎨',
    stats: {
      bookings: 187,
      views: 3800,
      rating: 5.0,
    },
    colors: {
      primary: 'from-amber-500 to-orange-500',
      secondary: 'bg-amber-50',
    },
  },
  {
    id: '12',
    name: 'Ryan Lee',
    profession: 'Music Teacher',
    handle: 'ryan-music',
    category: 'creative',
    image: '🎵',
    stats: {
      bookings: 143,
      views: 2400,
      rating: 4.9,
    },
    colors: {
      primary: 'from-violet-500 to-purple-500',
      secondary: 'bg-violet-50',
    },
  },
]

export const categories = [
  { id: 'all', label: 'All', icon: '✨' },
  { id: 'beauty', label: 'Beauty', icon: '💄' },
  { id: 'fitness', label: 'Fitness', icon: '💪' },
  { id: 'wellness', label: 'Wellness', icon: '🧘' },
  { id: 'creative', label: 'Creative', icon: '🎨' },
] as const
