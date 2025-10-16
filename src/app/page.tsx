import { Header } from '@/components/navigation/header'
import { ScrollProgressEnhanced } from '@/components/navigation/scroll-progress-enhanced'
import { Hero } from '@/components/landing/hero'

import {
  ExamplesCarousel,
  FeatureCustomizable,
  FeatureDiscovery,
  FeatureOneLink,
  FinalCTA,
  PricingSection,
  ProblemSolutionSplit,
  SocialProofStreamDual,
  TestimonialsBento,
} from '@/components/landing'
import { Footer } from '@/components/navigation/footer'

export default function LandingPage() {
  return (
    <>
      <Header />
      <ScrollProgressEnhanced interactive={true} />

      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <Hero />

        {/* Social Proof Stream */}
        <SocialProofStreamDual />

        {/* Problem/Solution Split */}
        <ProblemSolutionSplit />

        {/* Features */}
        <FeatureCustomizable />
        <FeatureDiscovery />
        <FeatureOneLink />

        {/* Examples Carousel */}
        <ExamplesCarousel />

        {/* Testimonials Bento */}
        <TestimonialsBento />

        {/* Pricing Section */}
        <PricingSection />

        {/* Final Call to Action */}
        <FinalCTA />
      </main>

      {/* Footer */}
      <Footer />
    </>
  )
}
