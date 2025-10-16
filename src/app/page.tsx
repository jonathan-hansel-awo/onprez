import { Header } from '@/components/navigation/header'
import { ScrollProgressEnhanced } from '@/components/navigation/scroll-progress-enhanced'
import { Hero } from '@/components/landing/hero'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollTrigger } from '@/components/animations/scroll-trigger'
import { ParallaxLayer } from '@/components/animations/parallax-layer'
import { StaggerChildren } from '@/components/animations/stagger-children'
import { FadeIn } from '@/components/animations/fade-in'
import {
  ExamplesCarousel,
  FeatureCustomizable,
  FeatureDiscovery,
  FeatureOneLink,
  ProblemSolutionSplit,
  SocialProofStreamDual,
  TestimonialsBento,
} from '@/components/landing'

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
        <FeatureCustomizable />
        <FeatureDiscovery />
        <FeatureOneLink />
        <ExamplesCarousel />
        <TestimonialsBento />
      </main>
    </>
  )
}
