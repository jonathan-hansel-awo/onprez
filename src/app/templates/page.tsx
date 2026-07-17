import type { Metadata } from 'next'
import Link from 'next/link'
import { TemplateGallery } from '@/components/templates/TemplateGallery'

export const metadata: Metadata = {
  title: 'Presence Page Templates | OnPrez',
  description:
    'Browse fully designed OnPrez presence page templates for wellness, beauty, fitness, professional, creative, and education businesses.',
}

export default function TemplatesPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="text-xl font-black tracking-tight text-gray-900">
            OnPrez
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Create your presence
          </Link>
        </div>
      </header>

      <section className="px-5 py-16 sm:px-8 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-onprez-blue">
              Presence templates
            </p>
            <h1 className="mt-4 text-5xl font-bold leading-tight text-gray-900 sm:text-6xl">
              Start with a page you will be proud to share.
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 sm:text-xl">
              Every template is a fully designed starting point, not just a colour preset. Browse
              freely, preview the complete page, and choose one when you are ready.
            </p>
            <p className="mt-4 text-sm font-medium text-gray-500">
              All businesses, services, prices, testimonials, and imagery shown here are clearly
              marked demonstration content.
            </p>
          </div>

          <div className="mt-14">
            <TemplateGallery />
          </div>
        </div>
      </section>
    </main>
  )
}
