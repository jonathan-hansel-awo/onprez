export type StepId = 1 | 2 | 3

export interface Step {
  id: StepId
  eyebrow: string
  title: string
  description: string
  /** Duration in ms that this step's internal animation plays before auto-advancing. */
  duration: number
}

export const STEPS: Step[] = [
  {
    id: 1,
    eyebrow: 'Step 01',
    title: 'Claim your handle',
    description:
      'Sign up and grab your unique handle. You instantly get a live presence page to accept bookings and a dashboard to manage them.',
    duration: 8500,
  },
  {
    id: 2,
    eyebrow: 'Step 02',
    title: 'Customise your page',
    description:
      'Make it yours. Pick your colours, fonts, and layout. Add services, gallery, and testimonials — all updated live as you click.',
    duration: 7500,
  },
  {
    id: 3,
    eyebrow: 'Step 03',
    title: 'Share and get booked',
    description:
      'Share onprez.com/your-handle anywhere — bio, email, cards. Watch bookings roll straight into your dashboard.',
    duration: 7000,
  },
]
