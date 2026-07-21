'use client'

/* eslint-disable @next/next/no-img-element -- Remote editorial images are temporary demo placeholders. */

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { TemplateCatalogueItem } from '@/data/presence-template-catalogue'
import { realisticDemoBusiness } from '@/data/realistic-demo-business'

interface DemoService {
  id: string
  name: string
  price: string
  duration: string
  description: string
  image: keyof typeof realisticDemoBusiness.images
}

interface HeavenlyPamperPreviewProps {
  template: TemplateCatalogueItem
  businessName: string
  businessNameInput: string
  setBusinessNameInput: Dispatch<SetStateAction<string>>
  signupHref: string
  initialClientView?: boolean
}

const images = realisticDemoBusiness.images

export function HeavenlyPamperPreview({
  template,
  businessName,
  businessNameInput,
  setBusinessNameInput,
  signupHref,
  initialClientView = false,
}: HeavenlyPamperPreviewProps) {
  const [services, setServices] = useState<DemoService[]>(realisticDemoBusiness.services)
  const [selectedServiceId, setSelectedServiceId] = useState('golden-glow')
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [bookingStep, setBookingStep] = useState(1)
  const [selectedTime, setSelectedTime] = useState(realisticDemoBusiness.bookingSlots[0])
  const [isClientView, setIsClientView] = useState(initialClientView)

  const selectedService =
    services.find(service => service.id === selectedServiceId) || services[0]

  const confirmHref = useMemo(() => {
    const separator = signupHref.includes('?') ? '&' : '?'
    return `${signupHref}${separator}demoService=${encodeURIComponent(selectedService.name)}`
  }, [selectedService.name, signupHref])

  const updateService = (id: string, field: 'name' | 'price', value: string) => {
    setServices(current =>
      current.map(service => (service.id === id ? { ...service, [field]: value } : service))
    )
  }

  const openBooking = (serviceId?: string) => {
    if (serviceId) setSelectedServiceId(serviceId)
    setBookingStep(1)
    setIsBookingOpen(true)
  }

  return (
    <main className="min-h-screen bg-[#fffaf0] text-[#342a1f]">
      {!isClientView && (
        <>
          <div className="sticky top-0 z-[70] border-b border-[#c7a64c]/25 bg-[#fffdf7]/95 px-4 py-3 backdrop-blur-xl">
            <div className="mx-auto flex max-w-[1440px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#a47e21]">
                  Bright luxury flagship · temporary preview
                </p>
                <p className="font-serif text-lg text-[#4b3820]">{template.name}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/templates" className="text-sm font-semibold text-[#72551d]">
                  All templates
                </Link>
                <button
                  type="button"
                  onClick={() => setIsClientView(true)}
                  className="rounded-full border border-[#b88a22]/35 bg-white px-5 py-2.5 text-sm font-bold text-[#7b591b]"
                >
                  Client view
                </button>
                <Link
                  href={signupHref}
                  className="rounded-full bg-gradient-to-r from-[#b88a22] to-[#e1bd62] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#b88a22]/20"
                >
                  Use this template
                </Link>
              </div>
            </div>
          </div>

          <section className="border-b border-[#c7a64c]/20 bg-white px-5 py-5 sm:px-8">
            <div className="mx-auto grid max-w-[1440px] gap-5 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
              <div>
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-[#a47e21]">
                  Business name
                </label>
                <input
                  value={businessNameInput}
                  onChange={event => setBusinessNameInput(event.target.value)}
                  maxLength={80}
                  className="mt-2 min-h-12 w-full rounded-full border border-[#c7a64c]/35 bg-[#fffdf8] px-5 outline-none focus:ring-2 focus:ring-[#d7ad47]"
                />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a47e21]">
                  Demo services and prices
                </p>
                <div className="mt-2 grid gap-3 md:grid-cols-3">
                  {services.map(service => (
                    <div
                      key={service.id}
                      className="rounded-2xl border border-[#c7a64c]/25 bg-[#fffdf8] p-3"
                    >
                      <input
                        aria-label={`${service.name} name`}
                        value={service.name}
                        onChange={event => updateService(service.id, 'name', event.target.value)}
                        className="w-full bg-transparent font-semibold outline-none"
                      />
                      <input
                        aria-label={`${service.name} price`}
                        value={service.price}
                        onChange={event => updateService(service.id, 'price', event.target.value)}
                        className="mt-1 w-full bg-transparent text-sm text-[#9c7520] outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {isClientView && (
        <button
          type="button"
          onClick={() => setIsClientView(false)}
          className="fixed right-4 top-4 z-[90] rounded-full border border-white/50 bg-white/90 px-4 py-2 text-xs font-bold text-[#72551d] shadow-lg backdrop-blur"
        >
          Exit client view
        </button>
      )}

      <section className="relative min-h-[760px] overflow-hidden">
        <img
          src={images.hero}
          alt="Bright luxury spa interior placeholder"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/10" />
        <div className="relative mx-auto flex min-h-[760px] max-w-[1440px] items-center px-6 py-24 sm:px-10 lg:px-16">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#b88a22]">
              Cream · gold · serenity
            </p>
            <h1 className="mt-6 font-serif text-6xl leading-[0.96] text-[#513b22] sm:text-7xl lg:text-[7rem]">
              {businessName}
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-[#725f47] sm:text-xl">
              {realisticDemoBusiness.description}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => openBooking()}
                className="rounded-full bg-gradient-to-r from-[#b88922] to-[#e4c26f] px-7 py-3.5 font-bold text-white shadow-xl shadow-[#bb8d2b]/25"
              >
                Book now
              </button>
              <a
                href="#services"
                className="rounded-full border border-[#b88a22]/40 bg-white/80 px-7 py-3.5 font-semibold text-[#76571d]"
              >
                View treatments
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-24 sm:px-8 md:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#b88a22]">
              The experience
            </p>
            <h2 className="mt-6 font-serif text-5xl leading-tight text-[#513b22] sm:text-6xl">
              Serenity, polished with a touch of glamour.
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <img
              src={images.interior}
              alt="Spa treatment room placeholder"
              className="h-[420px] w-full rounded-[2rem] object-cover shadow-2xl"
            />
            <div className="rounded-[2rem] border border-[#d9b85c]/25 bg-gradient-to-br from-[#fffaf0] to-[#f9e9b8] p-8 shadow-xl">
              <p className="font-serif text-3xl text-[#5d4727]">
                Soft light. Thoughtful rituals. Unhurried care.
              </p>
              <p className="mt-6 leading-8 text-[#77654d]">
                Personalised treatments, careful attention, and a peaceful setting designed around
                every client.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-[#4b3820] px-5 py-24 text-[#fff8e8] sm:px-8 md:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-4 rounded-[2.5rem] border border-[#e0bd64]/30" />
            <img
              src={images.owner}
              alt={`${realisticDemoBusiness.owner.name}, ${realisticDemoBusiness.owner.role}`}
              className="relative aspect-[4/5] w-full rounded-[2rem] object-cover shadow-2xl"
            />
            {!isClientView && (
              <span className="absolute bottom-5 left-5 rounded-full bg-white/90 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#72551d] shadow-lg">
                Replaceable owner photo
              </span>
            )}
          </div>
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#e2bf67]">
              Meet the owner
            </p>
            <h2 className="mt-6 font-serif text-5xl leading-tight sm:text-6xl">
              Meet {realisticDemoBusiness.owner.name}.
            </h2>
            <p className="mt-7 text-lg leading-8 text-[#f0dfbd]">
              {realisticDemoBusiness.owner.biography}
            </p>
            <p className="mt-5 leading-8 text-[#d9c49e]">
              {realisticDemoBusiness.owner.credentials.join(' · ')}
            </p>
            <button
              type="button"
              onClick={() => openBooking()}
              className="mt-9 rounded-full bg-gradient-to-r from-[#c89a31] to-[#e4c26f] px-7 py-3.5 font-bold text-white shadow-xl"
            >
              Book an appointment
            </button>
          </div>
        </div>
      </section>

      <section id="services" className="bg-[#fff6dc] px-5 py-24 sm:px-8 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#b88a22]">
              Treatment menu
            </p>
            <h2 className="mt-5 font-serif text-5xl text-[#513b22] sm:text-6xl">
              Choose your moment of calm.
            </h2>
          </div>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {services.map(service => (
              <article
                key={service.id}
                className="overflow-hidden rounded-[2rem] border border-[#d4ac47]/25 bg-white shadow-xl shadow-[#b88a22]/10"
              >
                <img
                  src={images[service.image]}
                  alt={`${service.name} treatment setting`}
                  className="h-64 w-full object-cover"
                />
                <div className="p-7">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-serif text-3xl text-[#513b22]">{service.name}</h3>
                    <p className="shrink-0 text-lg font-bold text-[#b18420]">{service.price}</p>
                  </div>
                  <p className="mt-3 text-sm text-[#7a6850]">{service.duration}</p>
                  <p className="mt-4 min-h-20 leading-7 text-[#725f47]">
                    {service.description}
                  </p>
                  <button
                    type="button"
                    onClick={() => openBooking(service.id)}
                    className="mt-7 w-full rounded-full border border-[#b88a22]/35 px-5 py-3 font-bold text-[#8a6518] transition hover:bg-[#b88a22] hover:text-white"
                  >
                    Book now
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-24 sm:px-8 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#b88a22]">
                Visit the studio
              </p>
              <h2 className="mt-5 font-serif text-5xl text-[#513b22] sm:text-6xl">
                Time set aside for you.
              </h2>
              <p className="mt-7 text-lg leading-8 text-[#725f47]">
                {realisticDemoBusiness.location.address}, {realisticDemoBusiness.location.city},{' '}
                {realisticDemoBusiness.location.postcode}
              </p>
              <p className="mt-3 text-[#725f47]">
                {realisticDemoBusiness.contact.phone} · {realisticDemoBusiness.contact.email}
              </p>
              <div className="mt-8 rounded-[2rem] bg-[#fff7df] p-7">
                <h3 className="font-serif text-2xl text-[#513b22]">Before your appointment</h3>
                <ul className="mt-5 space-y-3 text-sm leading-6 text-[#725f47]">
                  {realisticDemoBusiness.policies.map(policy => (
                    <li key={policy} className="flex gap-3">
                      <span aria-hidden="true" className="text-[#b88a22]">
                        ✦
                      </span>
                      <span>{policy}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="overflow-hidden rounded-[2rem] border border-[#d4ac47]/25 bg-[#fffdf8] p-7 shadow-xl sm:p-9">
              <h3 className="font-serif text-3xl text-[#513b22]">Opening hours</h3>
              <dl className="mt-6 divide-y divide-[#d4ac47]/20">
                {realisticDemoBusiness.hours.map(({ day, time }) => (
                  <div key={day} className="flex justify-between gap-6 py-4">
                    <dt className="font-semibold text-[#513b22]">{day}</dt>
                    <dd className="text-right text-[#725f47]">{time}</dd>
                  </div>
                ))}
              </dl>
              <button
                type="button"
                onClick={() => openBooking()}
                className="mt-7 w-full rounded-full bg-[#b88a22] px-6 py-3 font-bold text-white"
              >
                Check available appointments
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#4b3820] px-5 py-24 text-[#fff8e8] sm:px-8 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#e2bf67]">
              Client notes
            </p>
            <h2 className="mt-5 font-serif text-5xl sm:text-6xl">Care people come back to.</h2>
          </div>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {realisticDemoBusiness.reviews.map(review => (
              <figure key={review.id} className="rounded-[2rem] bg-white/8 p-7 ring-1 ring-white/15">
                <div aria-label={`${review.rating} out of 5 stars`} className="text-[#e2bf67]">
                  {'★'.repeat(review.rating)}
                </div>
                <blockquote className="mt-5 text-lg leading-8">“{review.quote}”</blockquote>
                <figcaption className="mt-6 text-sm text-[#e5d2ad]">
                  <span className="font-bold text-white">{review.name}</span> · {review.treatment}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fffaf0] px-5 py-24 sm:px-8 md:py-32">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.28em] text-[#b88a22]">
            Good to know
          </p>
          <h2 className="mt-5 text-center font-serif text-5xl text-[#513b22] sm:text-6xl">
            Frequently asked questions.
          </h2>
          <div className="mt-12 space-y-4">
            {realisticDemoBusiness.faqs.map(item => (
              <details
                key={item.id}
                className="group rounded-2xl border border-[#d4ac47]/25 bg-white p-6 open:shadow-lg"
              >
                <summary className="cursor-pointer list-none pr-8 text-lg font-bold text-[#513b22]">
                  {item.question}
                </summary>
                <p className="mt-4 max-w-3xl leading-7 text-[#725f47]">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden px-5 py-28 text-center sm:px-8 md:py-40">
        <img
          src={images.facial}
          alt="Luxury facial treatment placeholder"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-white/82 backdrop-blur-[2px]" />
        <div className="relative mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#b88a22]">
            Ready when you are
          </p>
          <h2 className="mt-6 font-serif text-6xl leading-tight text-[#513b22] sm:text-7xl">
            A brighter kind of serenity.
          </h2>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-[#725f47]">
            Choose a treatment and experience the booking journey.
          </p>
          <button
            type="button"
            onClick={() => openBooking()}
            className="mt-10 rounded-full bg-gradient-to-r from-[#b88922] to-[#e4c26f] px-8 py-4 font-bold text-white shadow-xl"
          >
            Book a treatment
          </button>
        </div>
      </section>

      {!isClientView && (
        <footer className="bg-[#4b3820] px-5 pb-28 pt-8 text-center text-xs leading-6 text-[#f5e7c5] md:pb-8">
          Images, services, prices, availability, and claims are demonstration placeholders. No
          booking is created from this preview.
        </footer>
      )}

      {isClientView && !isBookingOpen && (
        <div className="fixed inset-x-0 bottom-0 z-[80] border-t border-[#d4ac47]/30 bg-[#fffdf8]/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(75,56,32,0.16)] backdrop-blur md:hidden">
          <button
            type="button"
            onClick={() => openBooking()}
            className="min-h-12 w-full rounded-full bg-gradient-to-r from-[#b88922] to-[#e4c26f] px-6 py-3 font-bold text-white shadow-lg"
          >
            Book a treatment
          </button>
        </div>
      )}

      {isBookingOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-[#2d2114]/55 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Booking"
        >
          <div className="w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                {!isClientView && (
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b88a22]">
                    Mock booking · step {bookingStep} of 3
                  </p>
                )}
                <h2 className="mt-2 font-serif text-3xl text-[#513b22]">
                  {selectedService.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsBookingOpen(false)}
                className="rounded-full border px-3 py-1.5 text-sm"
              >
                Close
              </button>
            </div>

            {bookingStep === 1 && (
              <div className="mt-8 space-y-6">
                <div>
                  <label
                    htmlFor="booking-service"
                    className="text-sm font-semibold text-[#513b22]"
                  >
                    Select a treatment
                  </label>
                  <select
                    id="booking-service"
                    value={selectedServiceId}
                    onChange={event => setSelectedServiceId(event.target.value)}
                    className="mt-2 min-h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 font-semibold text-[#513b22]"
                  >
                    {services.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name} · {service.duration} · {service.price}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-[#725f47]">Choose an appointment time.</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {realisticDemoBusiness.bookingSlots.map(time => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`rounded-2xl border p-4 text-left font-semibold ${
                          selectedTime === time ? 'border-[#b88a22] bg-[#fff6dc]' : 'border-gray-200'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setBookingStep(2)}
                  className="w-full rounded-full bg-[#b88a22] px-6 py-3 font-bold text-white"
                >
                  Continue
                </button>
              </div>
            )}

            {bookingStep === 2 && (
              <div className="mt-8">
                <p className="text-[#725f47]">Enter your contact details.</p>
                <div className="mt-5 grid gap-4">
                  <input
                    placeholder="Your name"
                    className="min-h-12 rounded-2xl border border-gray-200 px-4"
                  />
                  <input
                    placeholder="Email address"
                    type="email"
                    className="min-h-12 rounded-2xl border border-gray-200 px-4"
                  />
                  <input
                    placeholder="Optional note"
                    className="min-h-12 rounded-2xl border border-gray-200 px-4"
                  />
                </div>
                <div className="mt-7 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setBookingStep(1)}
                    className="flex-1 rounded-full border px-6 py-3 font-bold"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingStep(3)}
                    className="flex-1 rounded-full bg-[#b88a22] px-6 py-3 font-bold text-white"
                  >
                    Review
                  </button>
                </div>
              </div>
            )}

            {bookingStep === 3 && (
              <div className="mt-8">
                <div className="rounded-2xl bg-[#fff7df] p-5">
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt>Business</dt>
                      <dd className="font-semibold">{businessName}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt>Treatment</dt>
                      <dd className="font-semibold">{selectedService.name}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt>Time</dt>
                      <dd className="font-semibold">{selectedTime}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt>Price</dt>
                      <dd className="font-semibold">{selectedService.price}</dd>
                    </div>
                  </dl>
                </div>
                {!isClientView && (
                  <p className="mt-5 text-sm leading-6 text-[#725f47]">
                    Confirming this demonstration takes you to signup. It does not create a real
                    appointment or charge a payment.
                  </p>
                )}
                <div className="mt-7 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setBookingStep(2)}
                    className="flex-1 rounded-full border px-6 py-3 font-bold"
                  >
                    Back
                  </button>
                  <Link
                    href={confirmHref}
                    className="flex-1 rounded-full bg-gradient-to-r from-[#b88922] to-[#e4c26f] px-6 py-3 text-center font-bold text-white"
                  >
                    Confirm booking
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
