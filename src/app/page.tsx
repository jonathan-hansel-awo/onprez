import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DarkModeToggle } from '@/components/dark-mode-toggle'
import {
  Calendar,
  Sparkles,
  Users,
  Zap,
  ArrowRight,
  Globe,
  Share2,
  Star,
  Heart,
  Palette,
  Rocket,
  TrendingUp,
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Super Creative Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Vibrant gradient mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-purple-50 to-cyan-100 dark:from-purple-950/30 dark:via-pink-950/20 dark:to-cyan-950/30" />

        {/* Floating colorful blobs */}
        <div className="absolute top-0 -left-20 w-[500px] h-[500px] bg-gradient-to-br from-pink-400 to-rose-600 dark:from-pink-600/40 dark:to-rose-800/40 rounded-full blur-3xl animate-blob opacity-70" />
        <div className="absolute top-1/4 -right-20 w-[600px] h-[600px] bg-gradient-to-br from-purple-400 to-indigo-600 dark:from-purple-600/40 dark:to-indigo-800/40 rounded-full blur-3xl animate-blob animation-delay-2000 opacity-70" />
        <div className="absolute -bottom-20 left-1/3 w-[500px] h-[500px] bg-gradient-to-br from-cyan-400 to-blue-600 dark:from-cyan-600/40 dark:to-blue-800/40 rounded-full blur-3xl animate-blob animation-delay-4000 opacity-70" />
        <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-gradient-to-br from-yellow-400 to-orange-500 dark:from-yellow-600/30 dark:to-orange-700/30 rounded-full blur-3xl animate-blob animation-delay-6000 opacity-60" />

        {/* Decorative shapes */}
        <div className="absolute top-20 left-10 w-20 h-20 border-4 border-pink-400/30 dark:border-pink-500/20 rounded-xl rotate-12 animate-float" />
        <div className="absolute bottom-40 right-20 w-16 h-16 border-4 border-purple-400/30 dark:border-purple-500/20 rounded-full animate-float animation-delay-2000" />
        <div className="absolute top-1/3 right-1/4 w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 dark:from-cyan-500/30 dark:to-blue-600/30 rounded-lg rotate-45 animate-float animation-delay-4000 opacity-50" />
      </div>

      {/* Header */}
      <header className="sticky px-12 top-0 z-50 w-full border-b border-white/20 dark:border-white/10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl shadow-lg shadow-purple-500/5">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl blur-md opacity-75 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg group-hover:scale-110 transition-transform">
                  <Sparkles className="h-5 w-5 text-white animate-pulse" />
                </div>
              </div>
              <span className="text-xl font-black bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-600 dark:from-pink-400 dark:via-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
                OnPrez
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-sm font-semibold text-purple-700 dark:text-purple-300 hover:text-pink-600 dark:hover:text-pink-400 transition-all duration-200 hover:scale-110"
              >
                Features <span className="preserve-emoji">✨</span>
              </a>
              <a
                href="#how-it-works"
                className="text-sm font-semibold text-purple-700 dark:text-purple-300 hover:text-pink-600 dark:hover:text-pink-400 transition-all duration-200 hover:scale-110"
              >
                How It Works <span className="preserve-emoji">🚀</span>
              </a>
              <a
                href="#testimonials"
                className="text-sm font-semibold text-purple-700 dark:text-purple-300 hover:text-pink-600 dark:hover:text-pink-400 transition-all duration-200 hover:scale-110"
              >
                Love <span className="preserve-emoji">💖</span>
              </a>
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <DarkModeToggle />
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-300 transition-all"
              >
                Sign In
              </Button>
              <Button
                size="sm"
                className="font-bold bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/60 hover:scale-105 transition-all"
              >
                Start Free <span className="preserve-emoji">✨</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-5xl mx-auto">
            <Badge className="mb-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:scale-105 transition-all px-4 py-2 text-sm font-bold animate-bounce-slow">
              <Sparkles className="mr-2 h-4 w-4 animate-spin-slow" />
              Your Digital Identity, Supercharged!
              <Rocket className="ml-2 h-4 w-4" />
            </Badge>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight">
              <span className="inline-block animate-slide-up bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 dark:from-white dark:via-purple-200 dark:to-white bg-clip-text text-transparent">
                Own Your
              </span>
              <br />
              <span className="inline-block animate-slide-up-delay-2 bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 dark:from-white dark:via-purple-200 dark:to-white bg-clip-text text-transparent">
                Online Presence!
              </span>
              <span className="preserve-emoji">🎉</span>
            </h1>

            <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto text-gray-700 dark:text-gray-300 leading-relaxed animate-fade-in font-medium">
              Get your own{' '}
              <span className="relative inline-block">
                <span className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-500 blur-lg opacity-50" />
                <span className="relative font-black text-purple-700 dark:text-purple-300 px-3 py-1 bg-white/80 dark:bg-gray-900/80 rounded-lg border-2 border-purple-400 dark:border-purple-500">
                  onprez.com/yourname
                </span>
              </span>{' '}
              handle and create a stunning presence where clients can discover, explore, and book
              your services instantly! <span className="preserve-emoji">💫</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-slide-up-delay-2">
              <Button
                size="lg"
                className="text-lg font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-600 hover:from-pink-700 hover:via-purple-700 hover:to-cyan-700 text-white shadow-2xl shadow-purple-500/50 hover:shadow-3xl hover:shadow-purple-500/60 hover:scale-110 transition-all group border-2 border-white/20 px-8 py-6"
              >
                <Heart className="mr-2 h-5 w-5 group-hover:scale-125 transition-transform" />
                Create Your Presence
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg font-bold border-3 border-purple-600 dark:border-purple-400 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 shadow-xl hover:shadow-2xl hover:scale-110 transition-all group px-8 py-6"
              >
                <Globe className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                See Examples
              </Button>
            </div>

            {/* Social Proof - More Vibrant */}
            <div className="flex flex-wrap items-center justify-center gap-6 animate-fade-in-delay">
              <div className="flex items-center gap-3 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 px-6 py-3 rounded-full border-2 border-pink-300/50 dark:border-pink-700/50 shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                <div className="flex -space-x-3">
                  {[
                    'from-pink-500 to-rose-600',
                    'from-purple-500 to-indigo-600',
                    'from-cyan-500 to-blue-600',
                    'from-yellow-500 to-orange-600',
                  ].map((gradient, i) => (
                    <div
                      key={i}
                      className={`h-10 w-10 rounded-full border-3 border-white dark:border-gray-900 bg-gradient-to-br ${gradient} shadow-lg hover:scale-125 hover:z-10 transition-transform cursor-pointer`}
                    />
                  ))}
                </div>
                <span className="font-bold text-purple-700 dark:text-purple-300">
                  500+ Happy Creators! <span className="preserve-emoji">🎨</span>
                </span>
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 px-6 py-3 rounded-full border-2 border-yellow-300/50 dark:border-yellow-700/50 shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-yellow-500 text-yellow-500 animate-pulse"
                    style={{ animationDelay: `${i * 100}ms` }}
                  />
                ))}
                <span className="ml-1 font-bold text-orange-700 dark:text-orange-300">
                  Rated Amazing!
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Super Colorful */}
      <section id="features" className="py-20 md:py-32 relative">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-6xl">
              <span className="font-black mb-4 bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                Everything You Need
              </span>{' '}
              <span className="preserve-emoji">🎁</span>
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto font-semibold">
              All the tools to build your empire, wrapped in one beautiful package
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className={`relative overflow-hidden border-3 ${feature.borderColor} hover:scale-105 transition-all duration-300 hover:shadow-2xl group bg-white/90 dark:bg-gray-900/90 backdrop-blur animate-slide-up`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-5 group-hover:opacity-10 transition-opacity`}
                />
                <CardContent className="pt-8 relative">
                  <div
                    className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all`}
                  >
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-black mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                    {feature.description}
                  </p>
                  <div
                    className={`absolute -bottom-2 -right-2 w-24 h-24 bg-gradient-to-br ${feature.gradient} rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity`}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Fun & Colorful */}
      <section
        id="how-it-works"
        className="py-20 md:py-32 relative bg-gradient-to-b from-transparent via-purple-50/50 to-transparent dark:via-purple-950/20"
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-6xl ">
              <span className="font-black mb-4 bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                3 Steps to Glory{' '}
              </span>
              <span className="preserve-emoji">🌟</span>
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto font-semibold">
              Go from zero to hero in under 15 minutes!
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative group animate-slide-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-full w-full h-1 bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 dark:from-pink-600 dark:via-purple-600 dark:to-cyan-600 z-0 -translate-x-1/2" />
                )}
                <div className="relative text-center">
                  <div
                    className={`mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br ${step.gradient} text-3xl font-black text-white shadow-2xl group-hover:scale-125 group-hover:rotate-12 transition-all preserve-emoji`}
                  >
                    {step.emoji}
                  </div>
                  <h3 className="text-2xl font-black mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Vibrant */}
      <section id="testimonials" className="py-20 md:py-32 relative">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-6xl">
              <span className="font-black mb-4 bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                People Love Us!{' '}
              </span>
              <span className="preserve-emoji">💖</span>
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto font-semibold">
              Don&apos;t just take our word for it - hear from the community
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className={`border-3 ${testimonial.borderColor} hover:scale-105 transition-all duration-300 hover:shadow-2xl group bg-white/90 dark:bg-gray-900/90 backdrop-blur relative overflow-hidden animate-slide-up`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${testimonial.gradient} opacity-5 group-hover:opacity-10 transition-opacity`}
                />
                <CardContent className="pt-6 relative">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 fill-yellow-500 text-yellow-500 group-hover:scale-125 transition-transform"
                        style={{ transitionDelay: `${i * 50}ms` }}
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed font-medium italic text-lg">
                    &quot;{testimonial.quote}&quot;{' '}
                    <span className="preserve-emoji">{testimonial.quoteEmoji}</span>
                  </p>
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-14 w-14 rounded-full bg-gradient-to-br ${testimonial.avatarGradient} shadow-lg group-hover:scale-110 transition-transform flex items-center justify-center text-2xl preserve-emoji`}
                    >
                      {testimonial.emoji}
                    </div>
                    <div>
                      <p className="font-black text-lg group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {testimonial.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Bold & Fun */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-600 via-purple-600 to-cyan-600" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMiIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />

        {/* Floating elements */}
        <div className="absolute top-10 left-10 w-20 h-20 border-4 border-white/30 rounded-full animate-float" />
        <div className="absolute bottom-20 right-20 w-16 h-16 border-4 border-white/30 rounded-xl rotate-45 animate-float animation-delay-2000" />

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-black mb-6 text-white animate-bounce-slow">
              Ready to Shine? <span className="preserve-emoji">✨</span>
            </h2>
            <p className="text-xl md:text-2xl mb-10 text-white/95 leading-relaxed font-bold">
              Join hundreds of amazing professionals creating their digital empires right now!
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="text-xl font-black shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-125 group px-10 py-8 bg-white text-purple-600 hover:bg-yellow-300"
            >
              <Rocket className="mr-2 h-6 w-6 group-hover:translate-y-[-4px] transition-transform" />
              Start Creating Now!
              <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-2 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer - Colorful */}
      <footer className="border-t-4 border-purple-300 dark:border-purple-700 py-12 md:py-16 bg-gradient-to-b from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-950/30">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-4 group cursor-pointer">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl blur-md opacity-75" />
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg group-hover:scale-110 transition-transform">
                    <Sparkles className="h-6 w-6 text-white animate-pulse" />
                  </div>
                </div>
                <span className="text-2xl font-black bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                  OnPrez
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 max-w-xs leading-relaxed font-semibold">
                Your digital identity platform with booking superpowers!{' '}
                <span className="preserve-emoji">🚀</span>
              </p>
            </div>

            <div>
              <h4 className="font-black mb-4 text-purple-700 dark:text-purple-300 text-lg">
                Product <span className="preserve-emoji">✨</span>
              </h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400 font-semibold">
                <li>
                  <a
                    href="#"
                    className="hover:text-pink-600 dark:hover:text-pink-400 transition-all hover:translate-x-2 inline-block"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-pink-600 dark:hover:text-pink-400 transition-all hover:translate-x-2 inline-block"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-pink-600 dark:hover:text-pink-400 transition-all hover:translate-x-2 inline-block"
                  >
                    Examples
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-black mb-4 text-purple-700 dark:text-purple-300 text-lg">
                Company <span className="preserve-emoji">🏢</span>
              </h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400 font-semibold">
                <li>
                  <a
                    href="#"
                    className="hover:text-pink-600 dark:hover:text-pink-400 transition-all hover:translate-x-2 inline-block"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-pink-600 dark:hover:text-pink-400 transition-all hover:translate-x-2 inline-block"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-pink-600 dark:hover:text-pink-400 transition-all hover:translate-x-2 inline-block"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t-2 border-purple-300 dark:border-purple-700 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-600 dark:text-gray-400 font-semibold">
            <p>
              © 2025 OnPrez. Made with <span className="preserve-emoji">💖</span> and{' '}
              <span className="preserve-emoji">✨</span>
            </p>
            <div className="flex gap-6">
              <a
                href="#"
                className="hover:text-purple-600 dark:hover:text-purple-400 transition-all hover:scale-110"
              >
                Privacy
              </a>
              <a
                href="#"
                className="hover:text-purple-600 dark:hover:text-purple-400 transition-all hover:scale-110"
              >
                Terms
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
    icon: Palette,
    title: 'Your Canvas',
    description:
      'Create a stunning presence that screams YOU with our super-easy customization tools!',
    gradient: 'from-pink-500 to-rose-600',
    borderColor: 'border-pink-300 dark:border-pink-700',
  },
  {
    icon: Calendar,
    title: 'Book Like Magic',
    description: 'Clients book instantly right from your page - no more endless message ping-pong!',
    gradient: 'from-purple-500 to-indigo-600',
    borderColor: 'border-purple-300 dark:border-purple-700',
  },
  {
    icon: Share2,
    title: 'Share Everywhere',
    description: 'One link to rule them all - Instagram, TikTok, business cards, you name it!',
    gradient: 'from-cyan-500 to-blue-600',
    borderColor: 'border-cyan-300 dark:border-cyan-700',
  },
  {
    icon: TrendingUp,
    title: 'Growth Insights',
    description: 'Watch your presence grow with beautiful analytics that actually make sense!',
    gradient: 'from-yellow-500 to-orange-600',
    borderColor: 'border-yellow-300 dark:border-yellow-700',
  },
  {
    icon: Users,
    title: 'Client Love',
    description: 'Build your tribe! Automatically save client info and keep everyone happy!',
    gradient: 'from-green-500 to-emerald-600',
    borderColor: 'border-green-300 dark:border-green-700',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: "Set up in minutes, not hours. Seriously, grab a coffee and you're done!",
    gradient: 'from-violet-500 to-purple-600',
    borderColor: 'border-violet-300 dark:border-violet-700',
  },
]

const steps = [
  {
    title: 'Claim Your Handle',
    description: 'Pick your perfect onprez.com/yourname and make it yours forever!',
    emoji: '🎯',
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    title: 'Make It Pop',
    description: 'Add your magic - services, photos, your story. Show the world who you are!',
    emoji: '🎨',
    gradient: 'from-purple-500 to-indigo-600',
  },
  {
    title: 'Share & Shine',
    description: 'Drop that link everywhere and watch the bookings roll in like confetti!',
    emoji: '🚀',
    gradient: 'from-cyan-500 to-blue-600',
  },
]

const testimonials = [
  {
    quote:
      'OnPrez is literally the best thing that happened to my business! My clients are obsessed with how easy booking is now!',
    quoteEmoji: '🎉',
    name: 'Sarah ✨',
    role: 'Salon Owner',
    emoji: '💇‍♀️',
    gradient: 'from-pink-500 to-rose-600',
    avatarGradient: 'from-pink-500 to-rose-600',
    borderColor: 'border-pink-300 dark:border-pink-700',
  },
  {
    quote:
      'I set this up during my lunch break and already got 3 bookings that afternoon. This is WILD!',
    quoteEmoji: '🔥',
    name: 'Mike 💪',
    role: 'Personal Trainer',
    emoji: '🏋️',
    gradient: 'from-purple-500 to-indigo-600',
    avatarGradient: 'from-purple-500 to-indigo-600',
    borderColor: 'border-purple-300 dark:border-purple-700',
  },
  {
    quote:
      "Finally, a tool that's actually FUN to use! My page looks like a million bucks and cost me nothing!",
    quoteEmoji: '💎',
    name: 'Emma 🌟',
    role: 'Spa Therapist',
    emoji: '💆‍♀️',
    gradient: 'from-cyan-500 to-blue-600',
    avatarGradient: 'from-cyan-500 to-blue-600',
    borderColor: 'border-cyan-300 dark:border-cyan-700',
  },
]
