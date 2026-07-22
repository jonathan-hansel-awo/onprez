import Link from 'next/link'
import {
  ArrowUpRight,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Instagram,
  Link2,
  MessageCircle,
} from 'lucide-react'
import { homepageScenario } from './homepage-positioning'

const exampleUrl =
  '/templates/editorial-beauty?businessName=Crown%20%26%20Canvas%20Studio&view=client'

export function HomepageScenario() {
  return (
    <section
      id="real-world-flow"
      aria-labelledby="real-world-flow-heading"
      className="relative overflow-hidden bg-slate-950 py-24 text-white sm:py-28"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.16),transparent_32%)]" />

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-blue-300">
            A realistic client journey
          </p>
          <h2
            id="real-world-flow-heading"
            className="text-4xl font-bold tracking-tight sm:text-5xl"
          >
            Share one link. Let clients take it from there.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            A client can move from discovering your work to choosing a real time and completing
            their booking without waiting for messages back and forth.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white text-slate-900 shadow-2xl">
              <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-100 px-5 py-4">
                <div className="flex gap-2" aria-hidden="true">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs text-slate-600 shadow-sm">
                  <Link2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{homepageScenario.handle}</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-rose-50 via-white to-amber-50 p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">
                      Hair &amp; makeup studio
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">
                      {homepageScenario.businessName}
                    </h3>
                    <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                      Polished services for everyday confidence, special occasions, and bridal
                      moments.
                    </p>
                  </div>
                  <div className="hidden rounded-2xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white sm:block">
                    Book online
                  </div>
                </div>

                <div className="mt-7 space-y-3">
                  {homepageScenario.services.map((service, index) => (
                    <div
                      key={service.name}
                      className={`flex items-center justify-between gap-4 rounded-2xl border p-4 ${
                        index === 0
                          ? 'border-rose-200 bg-white shadow-sm'
                          : 'border-slate-200/80 bg-white/70'
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-slate-950">{service.name}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                          {service.duration}
                        </p>
                      </div>
                      <p className="font-bold text-slate-950">{service.price}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl bg-slate-950 p-4 text-white">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-400/15 p-2 text-emerald-300">
                      <CalendarCheck2 className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-400">Selected appointment</p>
                      <p className="truncate font-semibold">{homepageScenario.selectedSlot}</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-emerald-300" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>

            <div className="relative mx-4 -mt-5 flex items-center gap-3 rounded-2xl border border-emerald-300/30 bg-emerald-300 px-4 py-3 text-slate-950 shadow-xl sm:mx-8">
              <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
              <p className="text-sm font-semibold">
                Booking confirmed for the client and added to the business dashboard.
              </p>
            </div>
          </div>

          <div>
            <div className="mb-8 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                <Instagram className="h-4 w-4" aria-hidden="true" /> Instagram bio
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                <MessageCircle className="h-4 w-4" aria-hidden="true" /> WhatsApp
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                <Link2 className="h-4 w-4" aria-hidden="true" /> Anywhere you share links
              </span>
            </div>

            <ol className="space-y-7">
              {homepageScenario.journey.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-300/30 bg-blue-300/10 text-sm font-bold text-blue-200">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                    <p className="mt-2 leading-7 text-slate-300">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>

            <Link
              href={exampleUrl}
              className="mt-10 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Open the Crown &amp; Canvas example
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
