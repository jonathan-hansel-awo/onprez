'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  CalendarCheck2,
  Check,
  CheckCircle2,
  Clock3,
  Instagram,
  Link2,
  MapPin,
  MessageCircle,
} from 'lucide-react'
import { OnPrezMark } from '@/components/brand/onprez-mark'
import { homepagePositioning } from './homepage-positioning'

const servicePreview = [
  { name: 'Soft Glam', detail: '90 min', price: '£65' },
  { name: 'Silk Press', detail: '2 hours', price: '£55' },
]

function normaliseHandle(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function Hero() {
  const router = useRouter()
  const [handle, setHandle] = useState('')

  const claimHandle = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const requestedHandle = normaliseHandle(handle)
    router.push(
      requestedHandle ? `/signup?handle=${encodeURIComponent(requestedHandle)}` : '/signup'
    )
  }

  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="relative isolate overflow-x-clip bg-[#f7f6f1] pt-28 sm:pt-32"
    >
      <div
        className="pointer-events-none absolute inset-0 -z-20 opacity-60"
        style={{
          backgroundImage:
            'linear-gradient(rgba(15,23,42,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.035) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'linear-gradient(to bottom, black, transparent 78%)',
        }}
      />
      <div className="pointer-events-none absolute -left-24 top-24 -z-10 h-72 w-72 rounded-full bg-amber-200/45 blur-3xl sm:h-96 sm:w-96" />
      <div className="pointer-events-none absolute -right-24 top-52 -z-10 h-80 w-80 rounded-full bg-blue-200/50 blur-3xl sm:h-[28rem] sm:w-[28rem]" />

      <div className="container mx-auto px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8 lg:pb-28">
        <div className="grid items-center gap-14 lg:grid-cols-[0.88fr_1.12fr] lg:gap-10 xl:gap-16">
          <motion.div
            className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/75 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-700 shadow-sm backdrop-blur sm:text-sm">
              <OnPrezMark className="h-4 w-4" />
              {homepagePositioning.badge}
            </p>

            <h1
              id="hero-heading"
              className="mt-7 text-balance text-5xl font-semibold leading-[0.96] tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-[4.5rem] xl:text-[5.25rem]"
            >
              <span className="block">{homepagePositioning.headlineLines[0]}</span>
              <span className="mt-2 block font-serif font-normal italic text-blue-700">
                {homepagePositioning.headlineLines[1]}
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl lg:mx-0">
              {homepagePositioning.summary}
            </p>

            <form
              onSubmit={claimHandle}
              className="mx-auto mt-8 max-w-xl rounded-[1.4rem] border border-slate-900/10 bg-white p-2 shadow-[0_18px_60px_-28px_rgba(15,23,42,0.45)] lg:mx-0"
            >
              <label htmlFor="hero-handle" className="sr-only">
                Choose your OnPrez handle
              </label>
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                <div className="flex min-w-0 flex-1 items-center rounded-xl bg-slate-50 px-4 py-3.5 text-left ring-1 ring-inset ring-slate-200 focus-within:ring-2 focus-within:ring-blue-500">
                  <span className="shrink-0 text-sm font-medium text-slate-500">onprez.com/</span>
                  <input
                    id="hero-handle"
                    name="handle"
                    value={handle}
                    onChange={event => setHandle(event.target.value)}
                    placeholder="yourbusiness"
                    autoComplete="off"
                    spellCheck={false}
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:font-medium placeholder:text-slate-400"
                  />
                </div>
                <button
                  type="submit"
                  className="group inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                >
                  {homepagePositioning.primaryCta}
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </button>
              </div>
            </form>

            <div className="mt-4 flex flex-col items-center justify-center gap-3 text-sm sm:flex-row lg:justify-start">
              <p className="inline-flex items-center gap-1.5 font-medium text-slate-600">
                <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                Free to start. No card required.
              </p>
              <span className="hidden text-slate-300 sm:inline" aria-hidden="true">
                •
              </span>
              <Link
                href="/examples"
                className="font-semibold text-blue-700 underline decoration-blue-200 decoration-2 underline-offset-4 transition hover:decoration-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                {homepagePositioning.secondaryCta}
              </Link>
            </div>

            <ul className="mt-8 grid gap-2.5 text-left sm:grid-cols-3">
              {homepagePositioning.outcomes.map(outcome => (
                <li
                  key={outcome.title}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-900/8 bg-white/60 px-3 py-3 text-sm font-semibold text-slate-700"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  {outcome.title}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            className="relative mx-auto w-full max-w-[43rem]"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: 0.15,
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div className="absolute inset-x-10 bottom-2 top-14 -z-10 rounded-[3rem] bg-blue-600/15 blur-3xl" />

            <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-900/10 bg-white shadow-[0_32px_90px_-30px_rgba(15,23,42,0.45)] sm:rounded-[2rem]">
              <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
                <div className="hidden gap-1.5 sm:flex" aria-hidden="true">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 sm:justify-start">
                  <Link2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">onprez.com/crown-and-canvas</span>
                </div>
                <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-emerald-800 sm:inline">
                  Taking bookings
                </span>
              </div>

              <div className="bg-[#f5eee6] p-3 sm:p-5">
                <div className="overflow-hidden rounded-[1.35rem] bg-[#201b1a] text-white sm:rounded-[1.6rem]">
                  <div className="grid min-h-[15rem] sm:grid-cols-[1.08fr_0.92fr]">
                    <div className="flex flex-col justify-between p-5 sm:p-7">
                      <div>
                        <p className="text-[0.65rem] font-bold uppercase tracking-[0.24em] text-rose-200">
                          Hair &amp; makeup studio
                        </p>
                        <h2 className="mt-4 max-w-xs font-serif text-4xl leading-[0.92] sm:text-5xl">
                          Crown &amp; Canvas
                        </h2>
                        <p className="mt-4 max-w-sm text-sm leading-6 text-stone-300">
                          Polished, personal beauty for everyday confidence and landmark moments.
                        </p>
                      </div>
                      <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs text-stone-300">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-rose-300" aria-hidden="true" />
                          Manchester
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 className="h-3.5 w-3.5 text-rose-300" aria-hidden="true" />
                          Tue–Sat
                        </span>
                      </div>
                    </div>

                    <div className="relative hidden min-h-[15rem] overflow-hidden bg-[linear-gradient(145deg,#f8c9bd_0%,#c9988b_45%,#5d3d38_100%)] sm:block">
                      <div className="absolute -bottom-12 left-1/2 h-56 w-44 -translate-x-1/2 rounded-t-[48%] bg-[#2b1b19]/80" />
                      <div className="absolute left-1/2 top-10 h-24 w-24 -translate-x-1/2 rounded-full bg-[#8f5f52] shadow-[0_0_0_16px_rgba(57,32,28,0.82)]" />
                      <div className="absolute inset-x-5 bottom-5 rounded-full border border-white/20 bg-black/20 px-3 py-2 text-center text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
                        Your brand, your way
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/10 bg-white p-4 text-slate-950 sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-rose-700">
                          Popular services
                        </p>
                        <h3 className="mt-1 text-lg font-bold">Choose your appointment</h3>
                      </div>
                      <span className="hidden text-xs font-semibold text-slate-500 sm:inline">
                        View all services
                      </span>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {servicePreview.map(service => (
                        <div
                          key={service.name}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3"
                        >
                          <div>
                            <p className="text-sm font-bold">{service.name}</p>
                            <p className="mt-0.5 text-xs text-slate-600">{service.detail}</p>
                          </div>
                          <p className="text-sm font-bold text-rose-700">{service.price}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-slate-950 px-4 py-3 text-white">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="rounded-lg bg-emerald-400/15 p-2 text-emerald-300">
                          <CalendarCheck2 className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[0.65rem] font-medium text-slate-400">
                            Next available
                          </p>
                          <p className="truncate text-sm font-bold">Friday at 2:30 PM</p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-950">
                        Book
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <motion.div
              className="absolute -left-7 top-20 hidden items-center gap-3 rounded-2xl border border-slate-900/10 bg-white/95 p-3 shadow-xl backdrop-blur sm:flex lg:-left-12"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="rounded-xl bg-gradient-to-br from-fuchsia-500 to-amber-400 p-2 text-white">
                <Instagram className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[0.65rem] font-medium text-slate-500">
                  One link, shared anywhere
                </p>
                <p className="text-xs font-bold text-slate-900">Client opened your page</p>
              </div>
            </motion.div>

            <motion.div
              className="absolute -bottom-7 -right-3 hidden items-center gap-3 rounded-2xl bg-emerald-300 p-3.5 text-slate-950 shadow-xl sm:flex lg:-right-8"
              animate={{ y: [0, 5, 0] }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.4,
              }}
            >
              <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-[0.65rem] font-medium">Booking confirmed</p>
                <p className="text-xs font-bold">Friday, 2:30 PM</p>
              </div>
            </motion.div>

            <div className="mt-3 grid gap-2 sm:hidden">
              <div className="flex items-center gap-3 rounded-xl border border-slate-900/10 bg-white/90 p-3 shadow-sm">
                <span className="rounded-lg bg-gradient-to-br from-fuchsia-500 to-amber-400 p-2 text-white">
                  <Instagram className="h-4 w-4" aria-hidden="true" />
                </span>
                <p className="text-xs font-semibold text-slate-700">
                  Share one memorable link anywhere
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-emerald-300 p-3 text-slate-950 shadow-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <p className="text-xs font-bold">Booking confirmed for Friday at 2:30 PM</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 border-t border-slate-900/10 pt-6 text-xs font-semibold text-slate-600 sm:text-sm lg:mt-16">
          <span>Made for the places clients already find you:</span>
          <span className="inline-flex items-center gap-1.5 text-slate-700">
            <Instagram className="h-4 w-4" aria-hidden="true" />
            Instagram
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-700">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            WhatsApp
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-700">
            <Link2 className="h-4 w-4" aria-hidden="true" />
            Google profile
          </span>
        </div>
      </div>
    </section>
  )
}
