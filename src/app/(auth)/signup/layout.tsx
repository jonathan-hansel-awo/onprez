import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SignupTemplateSelection } from '@/components/templates/SignupTemplateSelection'

export const metadata: Metadata = {
  title: 'Create Your Beauty or Wellness Presence | OnPrez',
  description:
    'Create a bookable beauty or wellness presence for your services, prices, photos, availability, and team at your own memorable OnPrez handle.',
  openGraph: {
    title: 'Create Your Beauty or Wellness Presence | OnPrez',
    description:
      'Give clients one place to discover your beauty or wellness business and book your services.',
    images: ['/og-signup.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Create Your Beauty or Wellness Presence | OnPrez',
    description:
      'Give clients one place to discover your beauty or wellness business and book your services.',
    images: ['/og-signup.png'],
  },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <SignupTemplateSelection />
      </Suspense>
      {children}
    </>
  )
}
