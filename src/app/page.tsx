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

        {/* Features Section */}
        <section id="features" className="py-32 bg-white">
          <div className="container mx-auto px-4">
            <ScrollTrigger threshold={0.3}>
              <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
                Everything You Need
              </h2>
              <p className="text-center text-gray-600 mb-16 text-lg">
                Purpose-built for service professionals
              </p>
            </ScrollTrigger>

            <StaggerChildren
              staggerDelay={0.15}
              className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
            >
              <Card>
                <CardContent className="py-8">
                  <div className="text-4xl mb-4">🎨</div>
                  <h3 className="text-xl font-bold mb-2">Fully Customizable</h3>
                  <p className="text-gray-600">
                    Your handle, your brand. Customize colors, layouts, fonts, and content sections.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="py-8">
                  <div className="text-4xl mb-4">👁️</div>
                  <h3 className="text-xl font-bold mb-2">Discovery First</h3>
                  <p className="text-gray-600">
                    Clients browse your gallery, read your story, then book seamlessly.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="py-8">
                  <div className="text-4xl mb-4">🔗</div>
                  <h3 className="text-xl font-bold mb-2">One Link Everywhere</h3>
                  <p className="text-gray-600">
                    Put your handle in your Instagram bio, business cards, email—everywhere.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="py-8">
                  <div className="text-4xl mb-4">📅</div>
                  <h3 className="text-xl font-bold mb-2">Seamless Booking</h3>
                  <p className="text-gray-600">
                    Integrated booking with real-time availability and automatic confirmations.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="py-8">
                  <div className="text-4xl mb-4">📊</div>
                  <h3 className="text-xl font-bold mb-2">Customer Insights</h3>
                  <p className="text-gray-600">
                    Automatically build your client database with booking history and preferences.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="py-8">
                  <div className="text-4xl mb-4">⚡</div>
                  <h3 className="text-xl font-bold mb-2">Lightning Fast</h3>
                  <p className="text-gray-600">
                    Optimized for speed. Your page loads instantly on any device, anywhere.
                  </p>
                </CardContent>
              </Card>
            </StaggerChildren>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-32 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <ScrollTrigger>
              <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
                Start Free. Grow When Ready.
              </h2>
              <p className="text-center text-gray-600 mb-16 text-lg">
                No credit card required. Premium features when you need them.
              </p>
            </ScrollTrigger>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <FadeIn direction="left">
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <CardTitle>Free</CardTitle>
                      <Badge variant="default">Perfect to Start</Badge>
                    </div>
                    <div className="text-4xl font-bold mb-2">£0</div>
                    <CardDescription>Forever free</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-start">
                        <span className="text-onprez-green mr-2">✓</span>
                        <span className="text-gray-600">Your onprez.com/handle</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-onprez-green mr-2">✓</span>
                        <span className="text-gray-600">Customizable presence page</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-onprez-green mr-2">✓</span>
                        <span className="text-gray-600">Photo gallery (5 images)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-onprez-green mr-2">✓</span>
                        <span className="text-gray-600">30 bookings per month</span>
                      </li>
                    </ul>
                    <Button variant="ghost" className="w-full">
                      Claim Your Handle Free
                    </Button>
                  </CardContent>
                </Card>
              </FadeIn>

              <FadeIn direction="right" delay={0.2}>
                <Card className="h-full border-2 border-onprez-blue shadow-xl relative">
                  {/* <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge variant="purple" size="lg">Most Popular</Badge>
                  </div> */}
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <CardTitle>Premium</CardTitle>
                      <Badge variant="success">For Growing Businesses</Badge>
                    </div>
                    <div className="text-4xl font-bold mb-2">
                      £20
                      <span className="text-lg font-normal text-gray-600">/mo</span>
                    </div>
                    <CardDescription>Billed monthly</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-start">
                        <span className="text-onprez-green mr-2">✓</span>
                        <span className="text-gray-600">Everything in Free, plus:</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-onprez-green mr-2">✓</span>
                        <span className="text-gray-600">Unlimited gallery images</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-onprez-green mr-2">✓</span>
                        <span className="text-gray-600">Advanced analytics & insights</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-onprez-green mr-2">✓</span>
                        <span className="text-gray-600">Automated SMS reminders</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-onprez-green mr-2">✓</span>
                        <span className="text-gray-600">Priority support</span>
                      </li>
                    </ul>
                    <Button variant="primary" className="w-full">
                      Start Premium Free for 14 Days
                    </Button>
                  </CardContent>
                </Card>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Examples Section */}
        <section id="examples" className="py-32 bg-white">
          <div className="container mx-auto px-4">
            <ScrollTrigger>
              <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">See It In Action</h2>
              <p className="text-center text-gray-600 mb-16 text-lg">
                Real professionals. Real results. Real inspiration.
              </p>
            </ScrollTrigger>

            <StaggerChildren
              staggerDelay={0.1}
              className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto"
            >
              {[
                {
                  name: 'Sarah Mitchell',
                  profession: 'Hair Stylist',
                  color: 'from-pink-500 to-rose-500',
                },
                {
                  name: 'Marcus Thompson',
                  profession: 'Personal Trainer',
                  color: 'from-blue-500 to-cyan-500',
                },
                {
                  name: 'Emma Rodriguez',
                  profession: 'Massage Therapist',
                  color: 'from-purple-500 to-indigo-500',
                },
              ].map((example, index) => (
                <Card key={index} hover={true}>
                  <div className={`h-48 bg-gradient-to-br ${example.color} rounded-t-xl`} />
                  <CardContent className="py-6">
                    <h3 className="text-xl font-bold mb-1">{example.name}</h3>
                    <p className="text-gray-600 mb-4">{example.profession}</p>
                    <div className="flex items-center justify-center">
                      <span>📊 245 visits/mo</span>
                      <span>⭐ 4.9 rating</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </StaggerChildren>
          </div>
        </section>

        {/* CTA Section */}
        <section
          id="cta"
          className="py-32 bg-gradient-to-br from-gray-900 to-gray-800 text-white relative overflow-hidden"
        >
          <ParallaxLayer speed={0.2} className="absolute inset-0 -z-10">
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-onprez-blue/20 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-onprez-purple/20 rounded-full blur-3xl" />
          </ParallaxLayer>

          <div className="container mx-auto px-4 text-center relative">
            <FadeIn direction="up">
              <h2 className="text-4xl md:text-6xl font-bold mb-6">
                Ready to Own Your Online Presence?
              </h2>
            </FadeIn>

            <FadeIn direction="up" delay={0.2}>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of professionals who&apos;ve claimed their handle and built a
                presence clients love.
              </p>
            </FadeIn>

            <FadeIn direction="up" delay={0.4}>
              <Button variant="primary" size="lg">
                Claim Your Handle Free
              </Button>
            </FadeIn>

            <FadeIn direction="up" delay={0.6}>
              <p className="mt-4 text-sm text-gray-400">
                Free forever • No credit card required • 2 minutes to get started
              </p>
            </FadeIn>
          </div>
        </section>
      </main>
    </>
  )
}
