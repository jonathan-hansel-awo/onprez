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
  SocialProofStreamDual,
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

const LazyTestimonialsBento = dynamic(
  () =>
    import('@/components/landing/testimonials-bento').then(mod => ({
      default: mod.TestimonialsBento,
    })),
  {
    loading: () => <div className="h-screen" />,
    ssr: true,
  }
)

const LazyPricingSection = dynamic(
  () =>
    import('@/components/landing/pricing-section').then(mod => ({ default: mod.PricingSection })),
  {
    loading: () => <div className="h-screen" />,
    ssr: true,
  }
)

export const metadata: Metadata = {
  title: 'OnPrez - One Page for Services, Availability and Bookings',
  description:
    'Create one shareable page where clients can see your services and prices, check your availability, and book. Built for independent service professionals and small teams.',
}

export default function LandingPage() {
  return (
    <>
      {/* Skip to main content for accessibility */}
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>

      <Header />
      <ScrollProgressEnhanced interactive={true} />

      <main id="main-content" className="min-h-screen bg-white">
        {/* Above the fold - Critical */}
        <Hero />
        <HomepageScenario />

        {/* Early sections - High priority */}
        <HowItWorks />

        <SocialProofStreamDual />

        {/* <ProblemSolutionSplit /> */}
        <FeatureCustomizable />
        <FeatureDiscovery />
        <FeatureOneLink />

        {/* Below the fold - Lazy loaded */}
        <LazyExamplesCarousel />
        <LazyTestimonialsBento />
        <LazyPricingSection />

        {/* Final sections */}
        <FinalCTA />
      </main>

      <Footer />
    </>
  )
}
