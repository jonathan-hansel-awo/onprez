import type { Metadata } from 'next'
import { Footer, Header } from '@/components/navigation'
import { PricingSection } from '@/components/landing/pricing-section'

export const metadata: Metadata = {
  title: 'Pricing | OnPrez',
  description:
    'Compare OnPrez Free, Professional and Business plans for branded online presence pages with integrated booking.',
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    title: 'OnPrez Pricing - Free, Professional and Business',
    description:
      'Choose the OnPrez plan that fits your services, media library and monthly booking volume.',
    url: 'https://onprez.com/pricing',
    type: 'website',
  },
}

export default function PricingPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white pt-16 md:pt-20">
        <PricingSection showCalculator={false} showPageLink={false} />
      </main>
      <Footer />
    </>
  )
}
