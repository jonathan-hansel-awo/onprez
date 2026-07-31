import type { Metadata } from 'next'
import { Footer, Header, ScrollProgressEnhanced } from '@/components/navigation'
import dynamic from 'next/dynamic'
import {
  FeatureCustomizable,
  FeatureDiscovery,
  FeatureOneLink,
  FinalCTA,
  Hero,
  HomepageScenario,
  HowItWorks,
} from '@/components/landing'

// Lazy load below-the-fold components
const LazyExamplesCarousel = dynamic(
  () =>
    import('@/components/landing/examples-carousel').then(mod => ({
      default: mod.ExamplesCarousel,
    })),
  {
    loading: () => <div className="h-screen" />,
    ssr: true,
  }
)

const LazyPricingSection = dynamic(
  () =>
    import('@/components/landing/pricing-section').then(mod => ({
      default: mod.PricingSection,
    })),
  {
    loading: () => <div className="h-screen" />,
    ssr: true,
  }
)

export const metadata: Metadata = {
  title: 'Online Presence and Booking for Beauty & Wellness Professionals',
  description:
    'Give beauty and wellness clients one memorable place to discover your brand, compare services and prices, see your availability, and book at your own OnPrez handle.',
  alternates: {
    canonical: '/',
  },
}

export default function LandingPage() {
  return (
    <>
      <Header />
      <ScrollProgressEnhanced interactive={true} />

      <main id="main-content" className="min-h-screen bg-white">
        {/* Above the fold - Critical */}
        <Hero />
        <HomepageScenario />

        {/* Early sections - High priority */}
        <HowItWorks />

        <FeatureCustomizable />
        <FeatureDiscovery />
        <FeatureOneLink />

        {/* Demonstrable product proof and transparent pricing */}
        <LazyExamplesCarousel />
        <LazyPricingSection />

        {/* Final sections */}
        <FinalCTA />
      </main>

      <Footer />
    </>
  )
}
