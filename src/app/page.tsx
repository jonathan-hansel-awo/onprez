import { Button } from '@/components/ui/button'
import {
  Calendar,
  Palette,
  Share2,
  Sparkles,
  TrendingUp,
  Users,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Star,
  Globe,
  Image,
  Layout,
  Zap,
  Eye,
  MousePointerClick,
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section - Sophisticated with depth */}
      <section className="relative pt-20 pb-32 px-4 overflow-hidden">
        {/* Sophisticated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-950" />

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080801a_1px,transparent_1px),linear-gradient(to_bottom,#8080801a_1px,transparent_1px)] bg-[size:4rem_4rem]" />

        {/* Ambient glow effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center px-4 py-2 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse mr-3" />
                <span className="text-sm font-medium text-primary">
                  2,500+ professionals trust OnPrez
                </span>
              </div>

              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
                  Own Your
                  <br />
                  <span className="text-primary">Online Presence</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
                  Create a fully customizable presence at{' '}
                  <span className="font-semibold text-foreground">onprez.com/yourname</span> where
                  clients discover your work and book appointments—all in one seamless experience.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="text-lg px-8 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all group"
                >
                  Claim Your Handle Free
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 group border-2">
                  <Eye className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  See Live Examples
                </Button>
              </div>

              {/* Trust indicators - horizontal layout */}
              <div className="flex flex-wrap gap-8 pt-8 border-t border-border">
                <div>
                  <div className="text-3xl font-bold">15min</div>
                  <div className="text-sm text-muted-foreground">To go live</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">45K+</div>
                  <div className="text-sm text-muted-foreground">Monthly bookings</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">Free</div>
                  <div className="text-sm text-muted-foreground">Forever</div>
                </div>
              </div>
            </div>

            {/* Right: Visual showcase */}
            <div className="relative lg:h-[600px] animate-slide-up [animation-delay:200ms]">
              {/* Mockup container with glassmorphism */}
              <div className="relative h-full">
                {/* Main mockup card - floating */}
                <div className="absolute inset-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-xl rounded-3xl border border-border shadow-2xl p-8 transform hover:scale-[1.02] transition-transform duration-500">
                  {/* Fake browser chrome */}
                  <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border/50">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="px-4 py-1.5 rounded-lg bg-muted text-xs font-mono text-muted-foreground">
                        onprez.com/sarah-salon
                      </div>
                    </div>
                  </div>

                  {/* Simulated profile content */}
                  <div className="space-y-6">
                    {/* Profile header */}
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400" />
                      <div className="flex-1">
                        <div className="h-4 w-32 bg-foreground/80 rounded mb-2" />
                        <div className="h-3 w-48 bg-muted-foreground/40 rounded" />
                      </div>
                    </div>

                    {/* Service cards */}
                    <div className="grid grid-cols-2 gap-3">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className="aspect-square rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-border/50 p-4 hover:scale-105 transition-transform"
                        />
                      ))}
                    </div>

                    {/* CTA button */}
                    <div className="h-12 rounded-lg bg-primary/80 shadow-lg shadow-primary/20" />
                  </div>
                </div>

                {/* Floating accent cards */}
                <div className="absolute -right-8 top-20 w-48 h-32 bg-card/80 backdrop-blur-xl rounded-2xl border border-border shadow-xl p-4 animate-float">
                  <Calendar className="w-8 h-8 text-primary mb-2" />
                  <div className="h-2 w-24 bg-muted rounded mb-2" />
                  <div className="h-2 w-16 bg-muted rounded" />
                </div>

                <div className="absolute -left-8 bottom-32 w-48 h-32 bg-card/80 backdrop-blur-xl rounded-2xl border border-border shadow-xl p-4 animate-float [animation-delay:1s]">
                  <Star className="w-8 h-8 text-amber-400 mb-2" />
                  <div className="h-2 w-28 bg-muted rounded mb-2" />
                  <div className="h-2 w-20 bg-muted rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes OnPrez Different - Bento Box Layout */}
      <section className="py-32 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Not just booking. Not just a website.
              <br />
              <span className="text-primary">Your complete online presence.</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything service professionals need in one shareable handle
            </p>
          </div>

          {/* Bento grid - asymmetric, modern layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {/* Large feature - spans 2 columns */}
            <div className="lg:col-span-2 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent backdrop-blur-sm rounded-3xl border border-border p-8 md:p-12 hover:shadow-2xl transition-all group">
              <div className="flex items-start gap-6">
                <div className="p-4 rounded-2xl bg-primary/10 group-hover:scale-110 transition-transform">
                  <Palette className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1 space-y-4">
                  <h3 className="text-3xl font-bold">Fully Customizable</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Your handle, your brand. Customize colors, layouts, fonts, and content sections
                    to match your unique style. Add galleries to showcase your work, testimonials to
                    build trust, and an about section to tell your story.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-4">
                    {['Brand Colors', 'Photo Galleries', 'Custom Sections', 'Your Typography'].map(
                      tag => (
                        <span
                          key={tag}
                          className="px-4 py-2 bg-background/50 rounded-lg text-sm font-medium border border-border"
                        >
                          {tag}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Medium feature */}
            <div className="bg-gradient-to-br from-card to-card/50 backdrop-blur-sm rounded-3xl border border-border p-8 hover:shadow-2xl transition-all group">
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-primary/10 w-fit group-hover:scale-110 transition-transform">
                  <Eye className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Discovery First</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Clients don&#39;t just book—they discover you. They browse your gallery, read your
                  story, explore your services, and get excited about working with you.
                </p>
                <div className="pt-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <ArrowRight className="w-4 h-4" />
                    Then they book seamlessly
                  </div>
                </div>
              </div>
            </div>

            {/* Medium feature */}
            <div className="bg-gradient-to-br from-card to-card/50 backdrop-blur-sm rounded-3xl border border-border p-8 hover:shadow-2xl transition-all group">
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-primary/10 w-fit group-hover:scale-110 transition-transform">
                  <Share2 className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">One Link Everywhere</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Put onprez.com/yourname in your Instagram bio, on business cards, email
                  signature—everywhere. One link becomes your professional identity.
                </p>
                <div className="pt-4 space-y-2">
                  {['Instagram', 'Business Cards', 'Email', 'Google'].map(place => (
                    <div key={place} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">{place}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Large feature - spans 2 columns */}
            <div className="lg:col-span-2 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent backdrop-blur-sm rounded-3xl border border-border p-8 md:p-12 hover:shadow-2xl transition-all group">
              <div className="flex items-start gap-6">
                <div className="p-4 rounded-2xl bg-amber-500/10 group-hover:scale-110 transition-transform">
                  <Calendar className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 space-y-4">
                  <h3 className="text-3xl font-bold">Seamless Booking</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Booking is integrated right into your presence—no redirects, no third-party
                    forms. Clients see your availability, pick a time, and book. You get automatic
                    confirmations, reminders, and a complete customer database.
                  </p>
                  <div className="grid sm:grid-cols-3 gap-4 pt-4">
                    {[
                      { icon: Calendar, label: 'Real-time Availability' },
                      { icon: Zap, label: 'Instant Confirmations' },
                      { icon: Users, label: 'Customer Management' },
                    ].map(item => (
                      <div
                        key={item.label}
                        className="flex items-center gap-3 p-4 bg-background/50 rounded-xl border border-border"
                      >
                        <item.icon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Clean Grid with Hover Effects */}
      <section id="features" className="py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Everything you need, nothing you don&#39;t
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Purpose-built for service professionals who want control over their presence
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-card rounded-2xl p-8 border border-border hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

                <div className="relative space-y-4">
                  <div className="p-3 rounded-xl bg-primary/10 w-fit group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Timeline Style */}
      <section id="how-it-works" className="py-32 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">From idea to live in 15 minutes</h2>
            <p className="text-xl text-muted-foreground">No technical skills required</p>
          </div>

          <div className="space-y-12">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-8 items-start group">
                {/* Number badge */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                    {index + 1}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pt-2">
                  <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Connecting line (except last) */}
                {index < steps.length - 1 && (
                  <div className="absolute left-8 top-20 w-0.5 h-12 bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Card Stack Style */}
      <section className="py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Professionals who own their presence
            </h2>
            <p className="text-xl text-muted-foreground">Real results from real businesses</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="group bg-card rounded-2xl p-8 border border-border hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-amber-400 text-amber-400 group-hover:scale-110 transition-transform"
                      style={{ transitionDelay: `${i * 50}ms` }}
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  &quot;{testimonial.quote}&quot;
                </p>

                {/* Author */}
                <div className="flex items-center gap-4 pt-6 border-t border-border">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center font-bold text-primary-foreground text-lg">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing - Side by Side Cards */}
      <section id="pricing" className="py-32 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Start free. Grow when you&#39;re ready.
            </h2>
            <p className="text-xl text-muted-foreground">
              No credit card required. Premium features when you need them.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="relative bg-card rounded-3xl p-10 border-2 border-border hover:shadow-2xl transition-all group">
              <div className="space-y-8">
                <div>
                  <h3 className="text-3xl font-bold mb-2">Free</h3>
                  <p className="text-muted-foreground">Perfect to get started</p>
                </div>

                <div>
                  <div className="text-5xl font-bold mb-2">$0</div>
                  <p className="text-sm text-muted-foreground">Forever free</p>
                </div>

                <ul className="space-y-4">
                  {[
                    'Your onprez.com/your-handle',
                    'Customizable presence page',
                    'Photo gallery (up to 5 images)',
                    '30 bookings per month',
                    'Basic calendar management',
                    'Email notifications',
                    'Customer database',
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button size="lg" variant="outline" className="w-full text-lg border-2">
                  Claim Your Handle Free
                </Button>
              </div>
            </div>

            {/* Premium Plan */}
            <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent backdrop-blur-sm rounded-3xl p-10 border-2 border-primary hover:shadow-2xl hover:shadow-primary/20 transition-all group">
              {/* Popular badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="px-6 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-full shadow-lg">
                  Most Popular
                </span>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="text-3xl font-bold mb-2">Premium</h3>
                  <p className="text-muted-foreground">For growing businesses</p>
                </div>

                <div>
                  <div className="text-5xl font-bold mb-2">
                    $29<span className="text-2xl text-muted-foreground">/mo</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Billed monthly</p>
                </div>

                <ul className="space-y-4">
                  {[
                    { text: 'Everything in Free, plus:', bold: true },
                    { text: 'Unlimited gallery images', bold: false },
                    { text: 'Advanced analytics & insights', bold: false },
                    { text: 'Automated SMS reminders', bold: false },
                    { text: 'Team member accounts', bold: false },
                    { text: 'Priority support', bold: false },
                    { text: 'Remove OnPrez branding', bold: false },
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className={feature.bold ? 'font-semibold' : 'text-muted-foreground'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button size="lg" className="w-full text-lg shadow-lg shadow-primary/20">
                  Start Premium Free for 14 Days
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Sophisticated */}
      <section className="relative py-32 px-4 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80" />

        {/* Pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1a_1px,transparent_1px)] bg-[size:4rem_4rem]" />

        {/* Ambient glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

        <div className="max-w-4xl mx-auto text-center relative">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-primary-foreground">
            Ready to own your online presence?
          </h2>
          <p className="text-xl mb-12 text-primary-foreground/90">
            Join thousands of professionals who&#39;ve claimed their handle and built a presence
            clients love to explore and book from.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8 shadow-2xl hover:scale-105 hover:bg-primary-foreground/5 transition-transform group"
            >
              Claim Your Handle Free
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 border-2 border-primary-foreground/20 text-primary hover:bg-primary-foreground/10 group"
            >
              <Eye className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              See Live Examples
            </Button>
          </div>
          <p className="mt-8 text-primary-foreground/75 text-sm">
            Free forever • No credit card required • 2 minutes to get started
          </p>
        </div>
      </section>
    </div>
  )
}

const features = [
  {
    icon: Layout,
    title: 'Drag & Drop Builder',
    description:
      'Rearrange sections, add content blocks, and customize layouts without touching code.',
  },
  {
    icon: Image,
    title: 'Unlimited Galleries',
    description:
      'Showcase your best work with photo and video galleries that load fast and look stunning.',
  },
  {
    icon: Palette,
    title: 'Brand Customization',
    description:
      'Match your colors, fonts, and style. Make it uniquely yours, not another template.',
  },
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description:
      'Set availability once. System prevents double-bookings and handles time zones automatically.',
  },
  {
    icon: Users,
    title: 'Customer Insights',
    description:
      'Automatically build your client database with booking history, preferences, and notes.',
  },
  {
    icon: BarChart3,
    title: 'Performance Analytics',
    description:
      'Track profile visits, booking conversions, and popular services to grow strategically.',
  },
  {
    icon: Share2,
    title: 'Built for Sharing',
    description: 'One clean link for Instagram, business cards, email—everywhere your clients are.',
  },
  {
    icon: TrendingUp,
    title: 'SEO Optimized',
    description:
      'Your presence gets found on Google. Built-in SEO so clients discover you organically.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Optimized for speed. Your page loads instantly on any device, anywhere.',
  },
]

const steps = [
  {
    title: 'Claim Your Handle',
    description:
      'Choose your onprez.com/yourname handle. This becomes your online presence—permanent and memorable.',
  },
  {
    title: 'Build Your Presence',
    description:
      'Customize your page with your branding, add galleries, services, testimonials, and tell your story. Make it uniquely yours.',
  },
  {
    title: 'Share & Book',
    description:
      'Put your handle everywhere—Instagram, business cards, email. Clients discover you, explore your work, and book instantly.',
  },
]

const testimonials = [
  {
    quote:
      "My OnPrez page isn't just for booking—it's where clients fall in love with my work before they even message me. The gallery section has been a game-changer.",
    name: 'Sarah Mitchell',
    role: 'Hair Stylist, Los Angeles',
  },
  {
    quote:
      'I customized everything to match my gym branding. Clients say my page looks more professional than my competitors who spend thousands on websites.',
    name: 'Marcus Thompson',
    role: 'Personal Trainer, Miami',
  },
  {
    quote:
      'Having one link that shows my services, gallery, testimonials AND lets people book has simplified everything. I put it everywhere and bookings just come in.',
    name: 'Emma Rodriguez',
    role: 'Massage Therapist, Austin',
  },
]
