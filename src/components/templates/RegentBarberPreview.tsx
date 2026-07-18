'use client'

/* eslint-disable @next/next/no-img-element -- Remote editorial images are temporary demo placeholders. */

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { TemplateCatalogueItem } from '@/data/presence-template-catalogue'

interface BarberService {
  id: string
  name: string
  price: string
  duration: string
}

interface RegentBarberPreviewProps {
  template: TemplateCatalogueItem
  businessName: string
  businessNameInput: string
  setBusinessNameInput: Dispatch<SetStateAction<string>>
  signupHref: string
  initialClientView?: boolean
}

const images = {
  hero: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1800&q=85',
  cut: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1200&q=85',
  beard: 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=1200&q=85',
  shop: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1400&q=85',
}

export function RegentBarberPreview({
  template,
  businessName,
  businessNameInput,
  setBusinessNameInput,
  signupHref,
  initialClientView = false,
}: RegentBarberPreviewProps) {
  const [services, setServices] = useState<BarberService[]>([
    { id: 'signature-cut', name: 'Signature Cut', price: '£28', duration: '45 min' },
    { id: 'skin-fade', name: 'Skin Fade', price: '£32', duration: '50 min' },
    { id: 'cut-beard', name: 'Cut & Beard', price: '£42', duration: '70 min' },
  ])
  const [selectedServiceId, setSelectedServiceId] = useState('signature-cut')
  const [selectedTime, setSelectedTime] = useState('Friday · 17:30')
  const [bookingStep, setBookingStep] = useState(1)
  const [isBookingOpen, setIsBookingOpen] = useState(false)
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
    <main className="min-h-screen bg-[#11110f] text-[#f5f0e8]">
      {!isClientView && (
        <>
          <div className="sticky top-0 z-[70] border-b border-[#c87941]/25 bg-[#11110f]/95 px-4 py-3 backdrop-blur-xl">
            <div className="mx-auto flex max-w-[1440px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#d48a55]">
                  Premium barber flagship · temporary preview
                </p>
                <p className="text-lg font-bold text-white">{template.name}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/templates" className="text-sm font-semibold text-[#e4c2a8]">
                  All templates
                </Link>
                <button
                  type="button"
                  onClick={() => setIsClientView(true)}
                  className="rounded-full border border-[#c87941]/40 px-5 py-2.5 text-sm font-bold text-[#f4d5bd]"
                >
                  Client view
                </button>
                <Link
                  href={signupHref}
                  className="rounded-full bg-[#c87941] px-5 py-2.5 text-sm font-bold text-white"
                >
                  Use this template
                </Link>
              </div>
            </div>
          </div>

          <section className="border-b border-white/10 bg-[#191916] px-5 py-5 sm:px-8">
            <div className="mx-auto grid max-w-[1440px] gap-5 lg:grid-cols-[0.7fr_1.3fr]">
              <div>
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-[#d48a55]">
                  Business name
                </label>
                <input
                  value={businessNameInput}
                  onChange={event => setBusinessNameInput(event.target.value)}
                  maxLength={80}
                  className="mt-2 min-h-12 w-full rounded-full border border-white/15 bg-[#11110f] px-5 text-white outline-none focus:ring-2 focus:ring-[#c87941]"
                />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d48a55]">
                  Demo services and prices
                </p>
                <div className="mt-2 grid gap-3 md:grid-cols-3">
                  {services.map(service => (
                    <div key={service.id} className="rounded-2xl border border-white/10 bg-[#11110f] p-3">
                      <input
                        value={service.name}
                        onChange={event => updateService(service.id, 'name', event.target.value)}
                        className="w-full bg-transparent font-semibold text-white outline-none"
                      />
                      <input
                        value={service.price}
                        onChange={event => updateService(service.id, 'price', event.target.value)}
                        className="mt-1 w-full bg-transparent text-sm text-[#d48a55] outline-none"
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
          className="fixed right-4 top-4 z-[90] rounded-full border border-white/15 bg-[#11110f]/90 px-4 py-2 text-xs font-bold text-white shadow-lg backdrop-blur"
        >
          Exit client view
        </button>
      )}

      <section className="relative min-h-[760px] overflow-hidden">
        <img src={images.hero} alt="Premium barber shop interior" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/20" />
        <div className="relative mx-auto flex min-h-[760px] max-w-[1440px] items-center px-6 py-24 sm:px-10 lg:px-16">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.34em] text-[#d48a55]">
              Precision · craft · confidence
            </p>
            <h1 className="mt-7 max-w-3xl text-6xl font-black uppercase leading-[0.9] tracking-[-0.04em] text-white sm:text-7xl lg:text-[7rem]">
              {businessName}
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-[#ded7cf] sm:text-xl">
              Sharp cuts, considered detail, and an appointment built around your style.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => openBooking()}
                className="rounded-full bg-[#c87941] px-7 py-3.5 font-bold text-white shadow-xl"
              >
                Book a chair
              </button>
              <a
                href="#services"
                className="rounded-full border border-white/25 bg-black/30 px-7 py-3.5 font-semibold text-white"
              >
                View services
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#191916] px-5 py-8 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 text-center sm:grid-cols-3">
          {['Appointment-led service', 'Modern cuts & classic craft', 'Easy mobile booking'].map(item => (
            <p key={item} className="text-sm font-bold uppercase tracking-[0.16em] text-[#e8d9cd]">
              {item}
            </p>
          ))}
        </div>
      </section>

      <section id="services" className="bg-[#f1ece5] px-5 py-24 text-[#181713] sm:px-8 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#a95e2f]">The menu</p>
            <h2 className="mt-5 text-5xl font-black uppercase leading-none sm:text-6xl">
              Built for a sharper finish.
            </h2>
          </div>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {services.map((service, index) => (
              <article key={service.id} className="overflow-hidden rounded-[2rem] bg-white shadow-xl">
                <img
                  src={index === 0 ? images.cut : index === 1 ? images.hero : images.beard}
                  alt={`${service.name} placeholder`}
                  className="h-64 w-full object-cover grayscale"
                />
                <div className="p-7">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-2xl font-black uppercase">{service.name}</h3>
                    <p className="shrink-0 text-lg font-black text-[#a95e2f]">{service.price}</p>
                  </div>
                  <p className="mt-3 text-sm text-gray-600">{service.duration}</p>
                  <button
                    type="button"
                    onClick={() => openBooking(service.id)}
                    className="mt-7 w-full rounded-full bg-[#181713] px-5 py-3 font-bold text-white"
                  >
                    Book this service
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grid bg-[#11110f] lg:grid-cols-2">
        <img src={images.shop} alt="Contemporary barber shop" className="h-full min-h-[520px] w-full object-cover" />
        <div className="flex items-center px-7 py-20 sm:px-12 lg:px-16">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#d48a55]">The standard</p>
            <h2 className="mt-6 text-5xl font-black uppercase leading-none text-white sm:text-6xl">
              No rush. No guesswork. Just a cut that fits.
            </h2>
            <p className="mt-7 text-lg leading-8 text-[#cfc6be]">
              A premium barber experience with clear appointment times, careful consultation, and consistent attention to detail.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#c87941] px-5 py-24 text-center sm:px-8">
        <h2 className="mx-auto max-w-4xl text-5xl font-black uppercase leading-none text-white sm:text-6xl">
          Your next cut starts here.
        </h2>
        <button
          type="button"
          onClick={() => openBooking()}
          className="mt-9 rounded-full bg-[#11110f] px-8 py-4 font-bold text-white"
        >
          Choose an appointment
        </button>
      </section>

      {!isClientView && (
        <footer className="bg-[#11110f] px-5 py-8 text-center text-xs leading-6 text-[#bdb5ad]">
          Images, services, prices, availability, and claims are demonstration placeholders.
        </footer>
      )}

      {isBookingOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-label="Booking">
          <div className="w-full max-w-xl rounded-[2rem] bg-[#f7f3ee] p-6 text-[#181713] shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                {!isClientView && (
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a95e2f]">
                    Mock booking · step {bookingStep} of 3
                  </p>
                )}
                <h2 className="mt-2 text-3xl font-black uppercase">{selectedService.name}</h2>
              </div>
              <button type="button" onClick={() => setIsBookingOpen(false)} className="rounded-full border px-3 py-1.5 text-sm">
                Close
              </button>
            </div>

            {bookingStep === 1 && (
              <div className="mt-8 space-y-6">
                <div>
                  <label htmlFor="barber-service" className="text-sm font-semibold">Select a service</label>
                  <select
                    id="barber-service"
                    value={selectedServiceId}
                    onChange={event => setSelectedServiceId(event.target.value)}
                    className="mt-2 min-h-12 w-full rounded-2xl border border-gray-300 bg-white px-4 font-semibold"
                  >
                    {services.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name} · {service.duration} · {service.price}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {['Friday · 17:30', 'Saturday · 09:00', 'Saturday · 13:30', 'Monday · 18:00'].map(time => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`rounded-2xl border p-4 text-left font-semibold ${selectedTime === time ? 'border-[#a95e2f] bg-[#f5dfcf]' : 'border-gray-300'}`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => setBookingStep(2)} className="w-full rounded-full bg-[#181713] px-6 py-3 font-bold text-white">
                  Continue
                </button>
              </div>
            )}

            {bookingStep === 2 && (
              <div className="mt-8">
                <p>Enter your contact details.</p>
                <div className="mt-5 grid gap-4">
                  <input placeholder="Your name" className="min-h-12 rounded-2xl border border-gray-300 px-4" />
                  <input placeholder="Email address" type="email" className="min-h-12 rounded-2xl border border-gray-300 px-4" />
                  <input placeholder="Optional note" className="min-h-12 rounded-2xl border border-gray-300 px-4" />
                </div>
                <div className="mt-7 flex gap-3">
                  <button type="button" onClick={() => setBookingStep(1)} className="flex-1 rounded-full border px-6 py-3 font-bold">Back</button>
                  <button type="button" onClick={() => setBookingStep(3)} className="flex-1 rounded-full bg-[#181713] px-6 py-3 font-bold text-white">Review</button>
                </div>
              </div>
            )}

            {bookingStep === 3 && (
              <div className="mt-8">
                <dl className="space-y-3 rounded-2xl bg-white p-5 text-sm">
                  <div className="flex justify-between gap-4"><dt>Business</dt><dd className="font-semibold">{businessName}</dd></div>
                  <div className="flex justify-between gap-4"><dt>Service</dt><dd className="font-semibold">{selectedService.name}</dd></div>
                  <div className="flex justify-between gap-4"><dt>Time</dt><dd className="font-semibold">{selectedTime}</dd></div>
                  <div className="flex justify-between gap-4"><dt>Price</dt><dd className="font-semibold">{selectedService.price}</dd></div>
                </dl>
                {!isClientView && (
                  <p className="mt-5 text-sm leading-6 text-gray-600">
                    Confirming this demonstration takes you to signup and creates no appointment or payment.
                  </p>
                )}
                <div className="mt-7 flex gap-3">
                  <button type="button" onClick={() => setBookingStep(2)} className="flex-1 rounded-full border px-6 py-3 font-bold">Back</button>
                  <Link href={confirmHref} className="flex-1 rounded-full bg-[#c87941] px-6 py-3 text-center font-bold text-white">Confirm booking</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
