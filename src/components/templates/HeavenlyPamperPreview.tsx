'use client'

/* eslint-disable @next/next/no-img-element -- Remote editorial images are temporary demo placeholders. */

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { TemplateCatalogueItem } from '@/data/presence-template-catalogue'

interface DemoService {
  id: string
  name: string
  price: string
  duration: string
}

interface HeavenlyPamperPreviewProps {
  template: TemplateCatalogueItem
  businessName: string
  businessNameInput: string
  setBusinessNameInput: Dispatch<SetStateAction<string>>
  signupHref: string
}

const images = {
  hero: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1800&q=85',
  treatment:
    'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=1400&q=85',
  facial:
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=85',
  interior:
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1400&q=85',
}

export function HeavenlyPamperPreview({
  template,
  businessName,
  businessNameInput,
  setBusinessNameInput,
  signupHref,
}: HeavenlyPamperPreviewProps) {
  const [services, setServices] = useState<DemoService[]>([
    { id: 'golden-glow', name: 'Golden Glow Ritual', price: '£95', duration: '90 min' },
    { id: 'serenity-massage', name: 'Serenity Massage', price: '£70', duration: '60 min' },
    { id: 'radiance-facial', name: 'Radiance Facial', price: '£65', duration: '60 min' },
  ])
  const [selectedService, setSelectedService] = useState<DemoService | null>(null)
  const [bookingStep, setBookingStep] = useState(1)
  const [selectedTime, setSelectedTime] = useState('Saturday · 11:30')

  const confirmHref = useMemo(() => {
    if (!selectedService) return signupHref
    const separator = signupHref.includes('?') ? '&' : '?'
    return `${signupHref}${separator}demoService=${encodeURIComponent(selectedService.name)}`
  }, [selectedService, signupHref])

  const updateService = (id: string, field: 'name' | 'price', value: string) => {
    setServices(current =>
      current.map(service => (service.id === id ? { ...service, [field]: value } : service))
    )
  }

  const openBooking = (service: DemoService) => {
    setSelectedService(service)
    setBookingStep(1)
  }

  return (
    <main className="min-h-screen bg-[#fffaf0] text-[#342a1f]">
      <div className="sticky top-0 z-[70] border-b border-[#c7a64c]/25 bg-[#fffdf7]/95 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#a47e21]">
              Bright luxury flagship · temporary preview
            </p>
            <p className="font-serif text-lg text-[#4b3820]">{template.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/templates" className="text-sm font-semibold text-[#72551d]">
              All templates
            </Link>
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
              A luminous retreat for calm, confidence, and beautifully considered care.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => openBooking(services[0])}
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
          <div className="relative">
            <div className="absolute -left-5 -top-5 h-28 w-28 rounded-full bg-[#f5dc98]/45 blur-2xl" />
            <p className="relative text-xs font-bold uppercase tracking-[0.28em] text-[#b88a22]">
              The experience
            </p>
            <h2 className="relative mt-6 font-serif text-5xl leading-tight text-[#513b22] sm:text-6xl">
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
                Replace this demonstration copy with your philosophy, expertise, and the feeling you
                want every client to take home.
              </p>
              <div className="mt-10 h-px bg-gradient-to-r from-transparent via-[#c99d32] to-transparent" />
              <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-[#a47e21]">
                Private appointments · Personal attention
              </p>
            </div>
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
            {services.map((service, index) => (
              <article
                key={service.id}
                className="overflow-hidden rounded-[2rem] border border-[#d4ac47]/25 bg-white shadow-xl shadow-[#b88a22]/10"
              >
                <img
                  src={
                    index === 0 ? images.treatment : index === 1 ? images.interior : images.facial
                  }
                  alt={`${service.name} placeholder`}
                  className="h-64 w-full object-cover"
                />
                <div className="p-7">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-serif text-3xl text-[#513b22]">{service.name}</h3>
                    <p className="shrink-0 text-lg font-bold text-[#b18420]">{service.price}</p>
                  </div>
                  <p className="mt-3 text-sm text-[#7a6850]">
                    {service.duration} · personalised demonstration treatment
                  </p>
                  <button
                    type="button"
                    onClick={() => openBooking(service)}
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
            This remains a temporary demonstration until you create an account, add real content,
            and choose to publish.
          </p>
          <button
            type="button"
            onClick={() => openBooking(services[0])}
            className="mt-10 rounded-full bg-gradient-to-r from-[#b88922] to-[#e4c26f] px-8 py-4 font-bold text-white shadow-xl"
          >
            Start a mock booking
          </button>
        </div>
      </section>

      <footer className="bg-[#4b3820] px-5 pb-28 pt-8 text-center text-xs leading-6 text-[#f5e7c5] md:pb-8">
        Images, services, prices, availability, and claims are demonstration placeholders. No
        booking is created from this preview.
      </footer>

      {selectedService && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-[#2d2114]/55 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Mock booking"
        >
          <div className="w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b88a22]">
                  Mock booking · step {bookingStep} of 3
                </p>
                <h2 className="mt-2 font-serif text-3xl text-[#513b22]">{selectedService.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedService(null)}
                className="rounded-full border px-3 py-1.5 text-sm"
              >
                Close
              </button>
            </div>

            {bookingStep === 1 && (
              <div className="mt-8">
                <p className="text-[#725f47]">Choose a demonstration appointment time.</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    'Saturday · 11:30',
                    'Saturday · 14:00',
                    'Monday · 10:00',
                    'Tuesday · 16:30',
                  ].map(time => (
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
                <button
                  type="button"
                  onClick={() => setBookingStep(2)}
                  className="mt-7 w-full rounded-full bg-[#b88a22] px-6 py-3 font-bold text-white"
                >
                  Continue
                </button>
              </div>
            )}

            {bookingStep === 2 && (
              <div className="mt-8">
                <p className="text-[#725f47]">
                  Enter demonstration contact details. Nothing is submitted or stored.
                </p>
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
                <p className="mt-5 text-sm leading-6 text-[#725f47]">
                  Confirming this demonstration takes you to signup. It does not create a real
                  appointment or charge a payment.
                </p>
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
