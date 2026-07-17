import type { Metadata } from 'next'
import { Footer, Header, ScrollProgressEnhanced } from '@/components/navigation'
import { TemplateGallery } from '@/components/templates/TemplateGallery'

export const metadata: Metadata = {
  title: 'Presence Page Templates | OnPrez',
  description:
    'Browse fully designed OnPrez presence page templates for wellness, beauty, fitness, professional, creative, and education businesses.',
}

export default function TemplatesPage() {
  return (
    <>
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>

      <Header />
      <ScrollProgressEnhanced interactive={true} />

      <main id="main-content" className="min-h-screen overflow-hidden bg-white pt-16 md:pt-20">
        <section className="relative border-b border-gray-100 px-5 pb-20 pt-16 sm:px-8 md:pb-28 md:pt-24">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-32 top-12 h-80 w-80 rounded-full bg-onprez-blue/10 blur-3xl" />
            <div className="absolute -right-24 top-0 h-96 w-96 rounded-full bg-onprez-purple/10 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-onprez-blue">
                OnPrez presence templates
              </p>
              <h1 className="mt-5 text-5xl font-bold leading-[1.05] text-gray-900 sm:text-6xl md:text-7xl">
                Start with a presence that already feels like your brand.
              </h1>
              <p className="mt-7 max-w-3xl text-lg leading-8 text-gray-600 sm:text-xl">
                Explore complete starting points for your business page, personalise the preview, and
                carry your chosen design directly into OnPrez signup.
              </p>
            </div>

            <div className="mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
              {[
                ['Preview freely', 'Explore every design before creating an account.'],
                ['Make it yours', 'See your real business name throughout the preview.'],
                ['Keep editing', 'Your selected design begins as an unpublished draft.'],
              ].map(([title, description]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-gray-200/80 bg-white/80 p-5 shadow-sm backdrop-blur"
                >
                  <p className="font-semibold text-gray-900">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
                </div>
              ))}
            </div>

            <p className="mt-8 max-w-3xl text-sm leading-6 text-gray-500">
              Business names, services, prices, testimonials, locations, and imagery shown in template
              previews are demonstration content unless explicitly stated otherwise.
            </p>
          </div>
        </section>

        <section className="bg-gray-50 px-5 py-16 sm:px-8 md:py-24">
          <div className="mx-auto max-w-7xl">
            <TemplateGallery />
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
