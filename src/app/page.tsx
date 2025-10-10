import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DarkModeToggle } from '@/components/dark-mode-toggle'
import {
  Calendar,
  Sparkles,
  Users,
  BarChart3,
  Zap,
  Check,
  ArrowRight,
  Globe,
  Share2,
  Star,
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">OnPrez</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
              How It Works
            </a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <DarkModeToggle />
            <Button variant="ghost" size="sm" className="hidden md:inline-flex">
              Sign In
            </Button>
            <Button size="sm">Get Started</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />

        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="mr-1 h-3 w-3" />
              Your Digital Identity Platform
            </Badge>

            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl mb-6">
              Your Own Digital
              <span className="bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
                {' '}
                Presence
              </span>
              <br />
              With Built-In Booking
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Get your unique handle like{' '}
              <span className="font-semibold text-foreground">onprez.com/yourname</span>. Create a
              stunning presence page where clients can discover, explore, and book your services—all in one
              place.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="text-base">
                Create Your Presence
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="text-base">
                See Examples
                <Globe className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-8 w-8 rounded-full border-2 border-background bg-gradient-to-br from-primary to-chart-1"
                    />
                  ))}
                </div>
                <span>500+ professionals</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                <span className="ml-1">5.0 rating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything You Need</h2>
            <p className="text-lg text-muted-foreground">
              One platform for your complete digital identity and booking management
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 hover:border-primary/50 transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 md:py-32 bg-muted/50">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">
              Get your digital presence up and running in under 15 minutes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-border -translate-x-1/2 z-0" />
                )}
                <div className="relative z-10 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 md:py-32">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Loved by Professionals</h2>
            <p className="text-lg text-muted-foreground">
              See what service professionals are saying about OnPrez
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-2">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-chart-1" />
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-primary text-primary-foreground">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Create Your Digital Identity?
            </h2>
            <p className="text-lg mb-8 text-primary-foreground/90">
              Join hundreds of professionals who have already transformed their online presence with OnPrez
            </p>
            <Button size="lg" variant="secondary" className="text-base">
              Get Started for Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 md:py-16">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">OnPrez</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                Your digital identity platform with integrated booking for service professionals.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Examples
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© 2025 OnPrez. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    icon: Globe,
    title: 'Your Digital Presence',
    description:
      'Create a beautiful, customizable presence page that reflects your brand and showcases your work.',
  },
  {
    icon: Calendar,
    title: 'Integrated Booking',
    description:
      'Let clients book appointments directly from your presence page. No more back-and-forth messages.',
  },
  {
    icon: Share2,
    title: 'Easy Sharing',
    description:
      'Share your unique handle everywhere—Instagram bio, business cards, email signature.',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Insights',
    description:
      'Track page visits, booking conversions, and understand how clients discover you.',
  },
  {
    icon: Users,
    title: 'Customer Management',
    description:
      'Build your client database automatically with every booking and keep detailed notes.',
  },
  {
    icon: Zap,
    title: 'Setup in Minutes',
    description:
      'Get your presence live in under 15 minutes. No technical knowledge required.',
  },
]

const steps = [
  {
    title: 'Choose Your Handle',
    description: 'Pick your unique handle like onprez.com/yourname and claim your digital identity.',
  },
  {
    title: 'Customize Your Presence',
    description: 'Add your services, photos, and story. Make it uniquely yours with our easy editor.',
  },
  {
    title: 'Share & Accept Bookings',
    description: 'Share your handle everywhere and start accepting bookings instantly.',
  },
]

const testimonials = [
  {
    quote: 'OnPrez transformed how I manage my salon. My clients love being able to browse and book instantly!',
    name: 'Sarah Johnson',
    role: 'Salon Owner',
  },
  {
    quote: 'I get so many compliments on my OnPrez page. It looks professional and makes booking a breeze.',
    name: 'Mike Chen',
    role: 'Personal Trainer',
  },
  {
    quote: 'Setting up took less than 10 minutes. Now I have my entire business in one shareable link.',
    name: 'Emma Williams',
    role: 'Spa Therapist',
  },
]          <ul className="text-left space-y-2">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              Next.js 14 with App Router
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              TypeScript configured
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              Tailwind CSS ready
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              Shadcn/ui components
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              Dark mode support
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              Ready for development
            </li>
          </ul>
        </div>

        <div className="mt-8">
          <Button size="lg" className="mr-4">
            Get Started
          </Button>
          <Button variant="outline" size="lg">
            Learn More
          </Button>
        </div>
      </div>
    </main>
  )
}
