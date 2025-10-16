export interface PricingPlan {
  id: string
  name: string
  price: number
  period: string
  description: string
  popular?: boolean
  features: string[]
  cta: string
  highlight?: boolean
}

export const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'Forever free',
    description: 'Perfect to get started',
    features: [
      'Your onprez.com/your-handle',
      'Customizable presence page',
      'Photo gallery (up to 5 images)',
      '30 bookings per month',
      'Basic calendar management',
      'Email notifications',
      'Customer database',
    ],
    cta: 'Claim Your Handle Free',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 18,
    period: 'Billed monthly',
    description: 'For growing businesses',
    popular: true,
    highlight: true,
    features: [
      'Everything in Free, plus:',
      'Unlimited gallery images',
      'Advanced analytics & insights',
      'Automated SMS reminders',
      'Team member accounts',
      'Priority support',
      'Remove OnPrez branding',
    ],
    cta: 'Start Premium Free for 14 Days',
  },
]

export const featureComparison = [
  {
    category: 'Core Features',
    features: [
      { name: 'Custom handle (onprez.com/yourname)', free: true, premium: true },
      { name: 'Customizable presence page', free: true, premium: true },
      { name: 'Booking system', free: true, premium: true },
      { name: 'Customer database', free: true, premium: true },
    ],
  },
  {
    category: 'Customization',
    features: [
      { name: 'Gallery images', free: '5 images', premium: 'Unlimited' },
      { name: 'Custom branding', free: true, premium: true },
      { name: 'Remove OnPrez branding', free: false, premium: true },
    ],
  },
  {
    category: 'Bookings & Management',
    features: [
      { name: 'Monthly bookings', free: '30', premium: 'Unlimited' },
      { name: 'Email notifications', free: true, premium: true },
      { name: 'SMS reminders', free: false, premium: true },
      { name: 'Team member accounts', free: false, premium: true },
    ],
  },
  {
    category: 'Analytics & Support',
    features: [
      { name: 'Basic analytics', free: true, premium: true },
      { name: 'Advanced insights', free: false, premium: true },
      { name: 'Standard support', free: true, premium: true },
      { name: 'Priority support', free: false, premium: true },
    ],
  },
]
