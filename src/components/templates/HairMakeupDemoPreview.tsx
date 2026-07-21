'use client'

/* eslint-disable @next/next/no-img-element -- Remote editorial images are temporary demo placeholders. */

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { TemplateCatalogueItem } from '@/data/presence-template-catalogue'
import {
  hairMakeupDemoBusiness as demo,
  type HairMakeupDemoService,
} from '@/data/hair-makeup-demo-business'

interface HairMakeupDemoPreviewProps {
  template: TemplateCatalogueItem
  businessName: string
  businessNameInput: string
  setBusinessNameInput: Dispatch<SetStateAction<string>>
  signupHref: string
  initialClientView?: boolean
}

export function HairMakeupDemoPreview({
  template,
  businessName,
  businessNameInput,
  setBusinessNameInput,
  signupHref,
  initialClientView = false,
}: HairMakeupDemoPreviewProps) {
  const [services, setServices] = useState<HairMakeupDemoService[]>(demo.services)
  const [selectedServiceId, setSelectedServiceId] = useState(demo.services[0].id)
  const [selectedTime, setSelectedTime] = useState(demo.bookingSlots[0])
  const [bookingStep, setBookingStep] = useState(1)
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [isClientView, setIsClientView] = useState(initialClientView)

  const selectedService = services.find(service => service.id === selectedServiceId) || services[0]
  const confirmHref = useMemo(() => {
    const separator = signupHref.includes('?') ? '&' : '?'
    return `${signupHref}${separator}demoService=${encodeURIComponent(selectedService.name)}`
  }, [selectedService.name, signupHref])

  const openBooking = (serviceId?: string) => {
    if (serviceId) setSelectedServiceId(serviceId)
    setBookingStep(1)
    setIsBookingOpen(true)
  }

  const updateService = (id: string, field: 'name' | 'price', value: string) => {
    setServices(current =>
      current.map(service => (service.id === id ? { ...service, [field]: value } : service))
    )
  }

  return (
    <main className="min-h-screen bg-[#fff8f6] text-[#2f1720]">
      {!isClientView && (
        <>
          <div className="sticky top-0 z-[70] border-b border-[#7e2948]/15 bg-[#fffaf8]/95 px-4 py-3 backdrop-blur-xl">
            <div className="mx-auto flex max-w-[1440px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#a33c63]">
                  Editorial beauty · temporary preview
                </p>
                <p className="text-lg font-semibold">{template.name}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/templates" className="text-sm font-semibold text-[#6f2943]">
                  All templates
                </Link>
                <button
                  type="button"
                  onClick={() => setIsClientView(true)}
                  className="rounded-full border border-[#7e2948]/25 bg-white px-5 py-2.5 text-sm font-bold"
                >
                  Client view
                </button>
                <Link
                  href={signupHref}
                  className="rounded-full bg-[#641b39] px-5 py-2.5 text-sm font-bold text-white shadow-lg"
                >
                  Use this template
                </Link>
              </div>
            </div>
          </div>

          <section className="border-b border-[#7e2948]/15 bg-white px-5 py-5 sm:px-8">
            <div className="mx-auto grid max-w-[1440px] gap-5 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
              <div>
                <label className="text-xs font-bold uppercase tracking-[0.18em] text-[#a33c63]">
                  Business name
                </label>
                <input
                  value={businessNameInput}
                  onChange={event => setBusinessNameInput(event.target.value)}
                  maxLength={80}
                  className="mt-2 min-h-12 w-full rounded-xl border border-[#7e2948]/25 bg-[#fff8f6] px-4 outline-none focus:ring-2 focus:ring-[#a33c63]"
                />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a33c63]">
                  Demo services and prices
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {services.map(service => (
                    <div key={service.id} className="rounded-xl border border-[#7e2948]/15 p-3">
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
                        className="mt-1 w-full bg-transparent text-sm text-[#a33c63] outline-none"
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
          className="fixed right-4 top-4 z-[90] rounded-full bg-white/90 px-4 py-2 text-xs font-bold text-[#641b39] shadow-xl backdrop-blur"
        >
          Exit client view
        </button>
      )}

      <section className="relative min-h-[760px] overflow-hidden bg-[#2f1720] text-white">
        <img
          src={demo.images.hero}
          alt="Hair and makeup studio editorial placeholder"
          className="absolute inset-0 h-full w-full object-cover opacity-65"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#2f1720] via-[#2f1720]/75 to-transparent" />
        <div className="relative mx-auto flex min-h-[760px] max-w-[1440px] items-end px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.34em] text-[#f1a5b9]">
              Hair · makeup · occasion
            </p>
            <h1 className="mt-6 text-6xl font-black leading-[0.9] tracking-[-0.055em] sm:text-7xl lg:text-[7.5rem]">
              {businessName}
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-[#ffe8ee] sm:text-xl">
              {demo.description}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => openBooking()}
                className="rounded-full bg-[#ef8dab] px-7 py-3.5 font-bold text-[#32121f] shadow-xl"
              >
                Find an appointment
              </button>
              <a
                href="#services"
                className="rounded-full border border-white/40 px-7 py-3.5 font-bold"
              >
                Explore services
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8 md:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
          <div className="relative grid grid-cols-2 gap-4">
            <img
              src={demo.images.braids}
              alt="Braided hairstyle placeholder"
              className="mt-16 h-[420px] w-full rounded-[2rem] object-cover"
            />
            <img
              src={demo.images.makeup}
              alt="Makeup artistry placeholder"
              className="h-[420px] w-full rounded-[2rem] object-cover"
            />
          </div>
          <div className="max-w-xl lg:pl-10">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#a33c63]">
              Built around you
            </p>
            <h2 className="mt-5 text-5xl font-black leading-[0.96] tracking-[-0.04em] sm:text-6xl">
              Your texture is not an afterthought.
            </h2>
            <p className="mt-7 text-lg leading-8 text-[#6f4b59]">{demo.owner.biography}</p>
            <p className="mt-5 text-sm font-semibold leading-7 text-[#8b3656]">
              {demo.owner.credentials.join(' · ')}
            </p>
          </div>
        </div>
      </section>

      <section id="services" className="bg-[#f5dbe2] px-5 py-24 sm:px-8 md:py-32">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#8b3656]">
            The appointment menu
          </p>
          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-[-0.04em] sm:text-6xl">
              Looks made to live beyond the chair.
            </h2>
            <p className="max-w-sm leading-7 text-[#6f4b59]">
              Transparent timing, preparation and pricing before you commit.
            </p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map(service => (
              <article
                key={service.id}
                className="overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-[#641b39]/10"
              >
                <img
                  src={demo.images[service.image]}
                  alt={`${service.name} placeholder`}
                  className="h-64 w-full object-cover"
                />
                <div className="p-7">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-2xl font-black leading-tight">{service.name}</h3>
                    <p className="shrink-0 font-bold text-[#a33c63]">{service.price}</p>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[#8b6070]">{service.duration}</p>
                  <p className="mt-4 leading-7 text-[#6f4b59]">{service.description}</p>
                  <p className="mt-4 border-l-2 border-[#e7a1b5] pl-4 text-sm leading-6 text-[#7c5966]">
                    <span className="font-bold">Before you come:</span> {service.preparation}
                  </p>
                  <button
                    type="button"
                    onClick={() => openBooking(service.id)}
                    className="mt-7 w-full rounded-full bg-[#641b39] px-5 py-3 font-bold text-white"
                  >
                    Book this service
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#32121f] px-5 py-24 text-white sm:px-8 md:py-32">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <img
            src={demo.images.owner}
            alt={`${demo.owner.name}, ${demo.owner.role}`}
            className="aspect-[4/5] w-full rounded-[2rem] object-cover shadow-2xl"
          />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#f1a5b9]">
              Meet your artist
            </p>
            <h2 className="mt-5 text-5xl font-black tracking-[-0.04em] sm:text-6xl">
              {demo.owner.name}
            </h2>
            <p className="mt-3 text-lg font-semibold text-[#f1a5b9]">{demo.owner.role}</p>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#f8dce5]">
              {demo.owner.biography}
            </p>
            <button
              type="button"
              onClick={() => openBooking('new-client-consultation')}
              className="mt-9 rounded-full bg-[#ef8dab] px-7 py-3.5 font-bold text-[#32121f]"
            >
              Start with a consultation
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-24 sm:px-8 md:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#a33c63]">
              Plan your visit
            </p>
            <h2 className="mt-5 text-5xl font-black tracking-[-0.04em] sm:text-6xl">
              Good hair days start before the appointment.
            </h2>
            <p className="mt-7 text-lg leading-8 text-[#6f4b59]">
              {demo.location.address}, {demo.location.city}, {demo.location.postcode}
            </p>
            <p className="mt-2 text-[#6f4b59]">
              {demo.contact.phone} · {demo.contact.email} · {demo.contact.instagram}
            </p>
            <ul className="mt-8 space-y-4 rounded-[2rem] bg-[#fff3f5] p-7 text-sm leading-6 text-[#6f4b59]">
              {demo.policies.map(policy => (
                <li key={policy}>— {policy}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-[2rem] border border-[#7e2948]/15 p-7 shadow-lg sm:p-9">
            <h3 className="text-3xl font-black">Studio hours</h3>
            <dl className="mt-6 divide-y divide-[#7e2948]/15">
              {demo.hours.map(({ day, time }) => (
                <div key={day} className="flex justify-between gap-6 py-4">
                  <dt className="font-bold">{day}</dt>
                  <dd className="text-right text-[#6f4b59]">{time}</dd>
                </div>
              ))}
            </dl>
            <button
              type="button"
              onClick={() => openBooking()}
              className="mt-7 w-full rounded-full bg-[#641b39] px-6 py-3 font-bold text-white"
            >
              Check availability
            </button>
          </div>
        </div>
      </section>

      <section className="bg-[#f5dbe2] px-5 py-24 sm:px-8 md:py-32">
        <div className="mx-auto max-w-7xl">
          <h2 className="max-w-3xl text-5xl font-black tracking-[-0.04em] sm:text-6xl">
            Seen, understood, beautifully finished.
          </h2>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {demo.reviews.map(review => (
              <figure key={review.id} className="rounded-[2rem] bg-white p-7 shadow-lg">
                <div aria-label={`${review.rating} out of 5 stars`} className="text-[#a33c63]">
                  {'★'.repeat(review.rating)}
                </div>
                <blockquote className="mt-5 text-lg leading-8">“{review.quote}”</blockquote>
                <figcaption className="mt-6 text-sm text-[#6f4b59]">
                  <strong className="text-[#32121f]">{review.name}</strong> · {review.service}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8 md:py-32">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.28em] text-[#a33c63]">
            Before you book
          </p>
          <h2 className="mt-5 text-center text-5xl font-black tracking-[-0.04em] sm:text-6xl">
            Questions, answered clearly.
          </h2>
          <div className="mt-12 space-y-4">
            {demo.faqs.map(item => (
              <details
                key={item.id}
                className="rounded-2xl border border-[#7e2948]/15 bg-white p-6 open:shadow-lg"
              >
                <summary className="cursor-pointer list-none text-lg font-bold">
                  {item.question}
                </summary>
                <p className="mt-4 leading-7 text-[#6f4b59]">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden px-5 py-28 text-center text-white sm:px-8 md:py-40">
        <img
          src={demo.images.bridal}
          alt="Bridal styling placeholder"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[#32121f]/78" />
        <div className="relative mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#f1a5b9]">
            Your chair is waiting
          </p>
          <h2 className="mt-6 text-6xl font-black leading-[0.95] tracking-[-0.05em] sm:text-7xl">
            Come as you are. Leave fully considered.
          </h2>
          <button
            type="button"
            onClick={() => openBooking()}
            className="mt-10 rounded-full bg-[#ef8dab] px-8 py-4 font-bold text-[#32121f]"
          >
            Book your appointment
          </button>
        </div>
      </section>

      {!isClientView && (
        <footer className="bg-[#32121f] px-5 pb-28 pt-8 text-center text-xs leading-6 text-[#f8dce5] md:pb-8">
          Images, services, prices, availability and reviews are fictional demonstration content. No
          appointment is created from this preview.
        </footer>
      )}

      {isClientView && !isBookingOpen && (
        <div className="fixed inset-x-0 bottom-0 z-[80] border-t border-[#7e2948]/20 bg-[#fffaf8]/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(50,18,31,0.18)] backdrop-blur md:hidden">
          <button
            type="button"
            onClick={() => openBooking()}
            className="min-h-12 w-full rounded-full bg-[#641b39] px-6 py-3 font-bold text-white"
          >
            Book an appointment
          </button>
        </div>
      )}

      {isBookingOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-[#251019]/70 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Booking"
        >
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                {!isClientView && (
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a33c63]">
                    Mock booking · step {bookingStep} of 3
                  </p>
                )}
                <h2 className="mt-2 text-3xl font-black">{selectedService.name}</h2>
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
                <label className="block text-sm font-semibold">
                  Select a service
                  <select
                    value={selectedServiceId}
                    onChange={event => setSelectedServiceId(event.target.value)}
                    className="mt-2 min-h-12 w-full rounded-xl border bg-white px-4 font-semibold"
                  >
                    {services.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name} · {service.duration} · {service.price}
                      </option>
                    ))}
                  </select>
                </label>
                <div>
                  <p className="text-[#6f4b59]">Choose an available time.</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {demo.bookingSlots.map(time => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`rounded-xl border p-4 text-left font-semibold ${selectedTime === time ? 'border-[#a33c63] bg-[#fff0f4]' : 'border-gray-200'}`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setBookingStep(2)}
                  className="w-full rounded-full bg-[#641b39] px-6 py-3 font-bold text-white"
                >
                  Continue
                </button>
              </div>
            )}

            {bookingStep === 2 && (
              <div className="mt-8">
                <p className="text-[#6f4b59]">
                  Tell the studio who is coming and anything they should know.
                </p>
                <div className="mt-5 grid gap-4">
                  <input
                    aria-label="Your name"
                    placeholder="Your name"
                    className="min-h-12 rounded-xl border px-4"
                  />
                  <input
                    aria-label="Email address"
                    placeholder="Email address"
                    type="email"
                    className="min-h-12 rounded-xl border px-4"
                  />
                  <textarea
                    aria-label="Hair history or booking notes"
                    placeholder="Hair history, sensitivities or booking notes"
                    rows={3}
                    className="rounded-xl border px-4 py-3"
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
                    className="flex-1 rounded-full bg-[#641b39] px-6 py-3 font-bold text-white"
                  >
                    Review
                  </button>
                </div>
              </div>
            )}

            {bookingStep === 3 && (
              <div className="mt-8">
                <dl className="space-y-3 rounded-2xl bg-[#fff0f4] p-5 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt>Business</dt>
                    <dd className="text-right font-semibold">{businessName}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Service</dt>
                    <dd className="text-right font-semibold">{selectedService.name}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Time</dt>
                    <dd className="text-right font-semibold">{selectedTime}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Price</dt>
                    <dd className="text-right font-semibold">{selectedService.price}</dd>
                  </div>
                </dl>
                <p className="mt-5 text-sm leading-6 text-[#6f4b59]">
                  {selectedService.preparation}
                </p>
                {!isClientView && (
                  <p className="mt-3 text-sm leading-6 text-[#6f4b59]">
                    This demonstration continues to signup and creates no appointment or charge.
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
                    className="flex-1 rounded-full bg-[#641b39] px-6 py-3 text-center font-bold text-white"
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
