import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Footer, Header, ScrollProgressEnhanced } from '@/components/navigation'

export const metadata: Metadata = {
  title: 'Live Examples | OnPrez',
  description:
    'Explore live OnPrez presence-page examples and experience their customer booking journeys.',
}

const examples = [
  {
    name: 'Heavenly Pamper Palace',
    category: 'Luxury wellness and beauty',
    description:
      'A luminous cream-and-gold presence with editable treatments and an interactive customer booking journey.',
    href: '/templates/heavenly-pamper-palace?businessName=Heavenly%20Pamper%20Palace&view=client',
    image:
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=85',
  },
]

export default function ExamplesPage() {
  return (
    <>
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>
      <Header />
      <ScrollProgressEnhanced interactive={true} />

      <main id="main-content" className="min-h-screen bg-white pt-16 md:pt-20">
        <section className="relative overflow-hidden border-b border-gray-100 px-5 py-20 sm:px-8 md:py-28">
          <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-onprez-blue/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 top-0 h-96 w-96 rounded-full bg-onprez-purple/10 blur-3xl" />
          <div className="relative mx-auto max-w-7xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-onprez-blue">
              Live OnPrez examples
            </p>
            <h1 className="mt-5 max-w-4xl text-5xl font-bold leading-[1.05] text-gray-900 sm:text-6xl md:text-7xl">
              See what a polished presence can feel like.
            </h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-gray-600 sm:text-xl">
              Explore customer-facing examples, browse services, and try their booking journeys.
              More industries and visual styles will be added here over time.
            </p>
          </div>
        </section>

        <section className="bg-gray-50 px-5 py-16 sm:px-8 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-2">
              {examples.map(example => (
                <article
                  key={example.name}
                  className="group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={example.image}
                      alt={`${example.name} example preview`}
                      fill
                      className="object-cover transition duration-700 group-hover:scale-[1.03]"
                      sizes="(min-width: 1024px) 50vw, 100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                    <span className="absolute bottom-5 left-5 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-800 backdrop-blur">
                      {example.category}
                    </span>
                  </div>
                  <div className="p-7 sm:p-8">
                    <h2 className="text-3xl font-bold text-gray-900">{example.name}</h2>
                    <p className="mt-4 max-w-2xl leading-7 text-gray-600">
                      {example.description}
                    </p>
                    <div className="mt-7 flex flex-wrap gap-3">
                      <Link
                        href={example.href}
                        className="rounded-xl bg-gradient-to-r from-onprez-blue to-onprez-purple px-6 py-3 font-semibold text-white shadow-lg"
                      >
                        View live example
                      </Link>
                      <Link
                        href="/templates/heavenly-pamper-palace"
                        className="rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-700"
                      >
                        Personalise template
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
