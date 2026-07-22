import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Footer, Header } from '@/components/navigation'

interface LegalPageProps {
  title: string
  description: string
  lastUpdated: string
  children: ReactNode
}

export function LegalPage({ title, description, lastUpdated, children }: LegalPageProps) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-blue-50/60 via-white to-white px-4 pb-20 pt-28 sm:pt-32">
        <article className="mx-auto max-w-4xl">
          <Link
            href="/"
            className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-onprez-blue hover:bg-blue-50"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to OnPrez
          </Link>

          <header className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-onprez-blue">
              Legal information
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-gray-600">{description}</p>
            <p className="mt-5 text-sm text-gray-500">Last updated: {lastUpdated}</p>
          </header>

          <div className="legal-content mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
            {children}
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
