import { PLAN_USAGE_ALLOWANCES } from '@/lib/usage/plan-limits'

export interface PricingPlan {
  id: 'free' | 'professional' | 'business'
  name: string
  price: number
  period: string
  description: string
  popular?: boolean
  features: string[]
  cta: string
}

type ComparisonValue = boolean | string

export interface FeatureComparisonItem {
  name: string
  free: ComparisonValue
  professional: ComparisonValue
  business: ComparisonValue
}

export interface FeatureComparisonCategory {
  category: string
  features: FeatureComparisonItem[]
}

export const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'Free for as long as you need it',
    description: 'Build a simple online presence and start taking bookings.',
    features: [
      'Your onprez.com handle',
      'Basic presence page',
      `Up to ${PLAN_USAGE_ALLOWANCES.FREE.activeServices} services`,
      `Up to ${PLAN_USAGE_ALLOWANCES.FREE.mediaItems} media items`,
      `${PLAN_USAGE_ALLOWANCES.FREE.monthlyBookings} bookings per month`,
      'Customer records and email notifications',
    ],
    cta: 'Claim Your Handle Free',
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 8,
    period: 'Billed monthly',
    description: 'For independent professionals ready to grow their brand and bookings.',
    popular: true,
    features: [
      'Everything in Free, plus:',
      'Advanced presence page',
      `Up to ${PLAN_USAGE_ALLOWANCES.PROFESSIONAL.activeServices} services`,
      `Up to ${PLAN_USAGE_ALLOWANCES.PROFESSIONAL.mediaItems} media items`,
      `${PLAN_USAGE_ALLOWANCES.PROFESSIONAL.monthlyBookings} bookings per month`,
      'Custom branding',
      'Booking deposits and protection',
      'Priority support',
    ],
    cta: 'Choose Professional',
  },
  {
    id: 'business',
    name: 'Business',
    price: 20,
    period: 'Billed monthly',
    description: 'For established businesses with larger catalogues and booking volume.',
    features: [
      'Everything in Professional, plus:',
      'Premium presence page',
      `Up to ${PLAN_USAGE_ALLOWANCES.BUSINESS.activeServices} services`,
      `Up to ${PLAN_USAGE_ALLOWANCES.BUSINESS.mediaItems} media items`,
      'Unlimited bookings under fair use',
      'Homepage and featured-listing eligibility',
      'Priority support',
    ],
    cta: 'Choose Business',
  },
]

export const featureComparison: FeatureComparisonCategory[] = [
  {
    category: 'Online presence',
    features: [
      {
        name: 'Custom OnPrez handle',
        free: true,
        professional: true,
        business: true,
      },
      {
        name: 'Presence page level',
        free: 'Basic',
        professional: 'Advanced',
        business: 'Premium',
      },
      {
        name: 'Services',
        free: String(PLAN_USAGE_ALLOWANCES.FREE.activeServices),
        professional: String(PLAN_USAGE_ALLOWANCES.PROFESSIONAL.activeServices),
        business: String(PLAN_USAGE_ALLOWANCES.BUSINESS.activeServices),
      },
      {
        name: 'Shared media library',
        free: `${PLAN_USAGE_ALLOWANCES.FREE.mediaItems} items`,
        professional: `${PLAN_USAGE_ALLOWANCES.PROFESSIONAL.mediaItems} items`,
        business: `${PLAN_USAGE_ALLOWANCES.BUSINESS.mediaItems} items`,
      },
      {
        name: 'Custom branding',
        free: false,
        professional: true,
        business: true,
      },
    ],
  },
  {
    category: 'Bookings and customers',
    features: [
      {
        name: 'Monthly bookings',
        free: String(PLAN_USAGE_ALLOWANCES.FREE.monthlyBookings),
        professional: String(PLAN_USAGE_ALLOWANCES.PROFESSIONAL.monthlyBookings),
        business: 'Unlimited*',
      },
      {
        name: 'Customer records',
        free: true,
        professional: true,
        business: true,
      },
      {
        name: 'Booking email notifications',
        free: true,
        professional: true,
        business: true,
      },
      {
        name: 'Booking deposits and protection',
        free: false,
        professional: true,
        business: true,
      },
    ],
  },
  {
    category: 'Growth and support',
    features: [
      {
        name: 'Homepage and featured-listing eligibility',
        free: false,
        professional: false,
        business: true,
      },
      {
        name: 'Priority support',
        free: false,
        professional: true,
        business: true,
      },
    ],
  },
]
