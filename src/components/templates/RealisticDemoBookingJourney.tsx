'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  hairMakeupDemoBusiness,
  type HairMakeupDemoBusiness,
} from '@/data/hair-makeup-demo-business'
import { realisticDemoBusiness, type RealisticDemoBusiness } from '@/data/realistic-demo-business'

type RealisticDemoFixture = RealisticDemoBusiness | HairMakeupDemoBusiness

const realisticDemoFixtures: RealisticDemoFixture[] = [
  realisticDemoBusiness,
  hairMakeupDemoBusiness,
]

export function getRealisticDemoFixture(templateSlug: string) {
  return realisticDemoFixtures.find(demo => demo.templateSlug === templateSlug)
}

interface RealisticDemoBookingJourneyProps {
  templateSlug: string
  signupHref: string
}

export function RealisticDemoBookingJourney({
  templateSlug,
  signupHref,
}: RealisticDemoBookingJourneyProps) {
  const demo = getRealisticDemoFixture(templateSlug)
  const [selectedServiceId, setSelectedServiceId] = useState(demo?.services[0]?.id || '')
  const [selectedSlot, setSelectedSlot] = useState(demo?.bookingSlots[0] || '')
  const [isReviewing, setIsReviewing] = useState(false)

  const selectedService = useMemo(
    () => demo?.services.find(service => service.id === selectedServiceId) || demo?.services[0],
    [demo, selectedServiceId]
  )

  if (!demo || !selectedService) return null

  return (
    <section
      id="demo-booking"
      className="scroll-mt-24 bg-slate-950 px-5 py-20 text-white sm:px-8 md:py-28"
      aria-labelledby="demo-booking-title"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-300">
            Interactive booking example
          </p>
          <h2 id="demo-booking-title" className="mt-4 text-4xl font-bold sm:text-5xl">
            Try the client journey before creating your page.
          </h2>
          <p className="mt-5 text-base leading-7 text-slate-300 sm:text-lg">
            Choose a realistic service and sample appointment time. This is fictional demonstration
            content: no appointment or customer record will be created.
          </p>
        </div>

        <div className="mt-12 grid gap-8 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl sm:p-8">
            {!isReviewing ? (
              <>
                <fieldset>
                  <legend className="text-lg font-bold">1. Choose a service</legend>
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {demo.services.map(service => {
                      const isSelected = service.id === selectedService.id

                      return (
                        <button
                          key={service.id}
                          type="button"
                          aria-pressed={isSelected}
                          aria-label={`${service.name}, ${service.price}, ${service.duration}`}
                          onClick={() => setSelectedServiceId(service.id)}
                          className={`min-h-24 rounded-2xl border p-4 text-left transition ${
                            isSelected
                              ? 'border-amber-300 bg-amber-300 text-slate-950'
                              : 'border-white/15 bg-white/5 text-white hover:border-white/40'
                          }`}
                        >
                          <span className="block font-bold">{service.name}</span>
                          <span
                            className={`mt-2 block text-sm ${isSelected ? 'text-slate-800' : 'text-slate-300'}`}
                          >
                            {service.price} · {service.duration}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </fieldset>

                <fieldset className="mt-9">
                  <legend className="text-lg font-bold">2. Choose a sample time</legend>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {demo.bookingSlots.map(slot => {
                      const isSelected = slot === selectedSlot

                      return (
                        <button
                          key={slot}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setSelectedSlot(slot)}
                          className={`min-h-12 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                            isSelected
                              ? 'border-amber-300 bg-amber-300 text-slate-950'
                              : 'border-white/15 bg-transparent text-white hover:border-white/40'
                          }`}
                        >
                          {slot}
                        </button>
                      )
                    })}
                  </div>
                </fieldset>

                <div className="mt-9 rounded-2xl bg-white/10 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Current selection
                  </p>
                  <p className="mt-2 text-xl font-bold">{selectedService.name}</p>
                  <p className="mt-1 text-slate-300">
                    {selectedService.price} · {selectedService.duration} · {selectedSlot}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsReviewing(true)}
                  className="mt-6 min-h-12 w-full rounded-xl bg-amber-300 px-6 py-3 font-bold text-slate-950 transition hover:bg-amber-200"
                >
                  Review demo booking
                </button>
              </>
            ) : (
              <div role="status" aria-live="polite">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
                  Demo booking ready
                </p>
                <h3 className="mt-4 text-3xl font-bold">{selectedService.name}</h3>
                <dl className="mt-7 space-y-4 rounded-2xl bg-white/10 p-5 text-sm sm:text-base">
                  <div className="flex items-start justify-between gap-5">
                    <dt className="text-slate-400">Business</dt>
                    <dd className="text-right font-semibold">{demo.name}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-5">
                    <dt className="text-slate-400">Appointment</dt>
                    <dd className="text-right font-semibold">{selectedSlot}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-5">
                    <dt className="text-slate-400">Duration</dt>
                    <dd className="text-right font-semibold">{selectedService.duration}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-5">
                    <dt className="text-slate-400">Price</dt>
                    <dd className="text-right font-semibold">{selectedService.price}</dd>
                  </div>
                </dl>
                <p className="mt-6 leading-7 text-slate-300">
                  A real client would continue to their details and confirmation. This preview stops
                  before collecting personal information.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setIsReviewing(false)}
                    className="min-h-12 rounded-xl border border-white/20 px-5 py-3 font-semibold"
                  >
                    Change selection
                  </button>
                  <Link
                    href={signupHref}
                    className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-amber-300 px-5 py-3 text-center font-bold text-slate-950"
                  >
                    Create a page like this
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-6">
            <article className="rounded-[2rem] bg-white p-6 text-slate-950 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Visit information
              </p>
              <h3 className="mt-3 text-2xl font-bold">Opening hours</h3>
              <dl className="mt-5 divide-y divide-slate-200">
                {demo.hours.map(entry => (
                  <div key={entry.day} className="flex justify-between gap-4 py-3 text-sm">
                    <dt className="font-semibold">{entry.day}</dt>
                    <dd className="text-right text-slate-600">{entry.time}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-5 text-sm leading-6 text-slate-600">
                {demo.location.address}, {demo.location.city}, {demo.location.postcode}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {demo.contact.phone} · {demo.contact.email}
              </p>
            </article>

            <article className="rounded-[2rem] border border-white/10 bg-white/5 p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
                Before booking
              </p>
              <h3 className="mt-3 text-2xl font-bold">Policies and preparation</h3>
              <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-300">
                {demo.policies.map(policy => (
                  <li key={policy} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300"
                    />
                    <span>{policy}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}
