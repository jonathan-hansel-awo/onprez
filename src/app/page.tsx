import type { Metadata } from 'next'
import { Footer, Header } from '@/components/navigation'
import { ScrollProgressEnhanced } from '@/components/navigation/scroll-progress-enhanced'
import { FinalCTA } from '@/components/landing/final-cta'
import dynamic from 'next/dynamic'
import {
  FeatureCustomizable,
  FeatureDiscovery,
  FeatureOneLink,
  Hero,
  ProblemSolutionSplit,
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
  title: 'OnPrez - Your Handle, Your Brand, Your Bookings',
  description:
    'Create your complete online presence in 15 minutes. Customizable presence pages with integrated booking for service professionals. Start free at onprez.com/yourname',
}

export default function LandingPage() {
  return (
    <>
      <Header />
      <ScrollProgressEnhanced interactive={true} />

      <main className="min-h-screen bg-white">
        {/* Above the fold - Critical */}
        <Hero />

        {/* Early sections - High priority */}
        <SocialProofStreamDual />
        <ProblemSolutionSplit />
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
