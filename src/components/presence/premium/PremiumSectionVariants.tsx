'use client'

import Link from 'next/link'
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock3,
  Instagram,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react'
import type { ReactNode } from 'react'

interface ActionProps {
  label: string
  href: string
}

interface HeroProps {
  eyebrow?: string
  title: string
  description?: string
  imageUrl: string
  imageAlt: string
  primaryAction: ActionProps
  secondaryAction?: ActionProps
}

function ActionLink({ action, secondary = false }: { action: ActionProps; secondary?: boolean }) {
  return (
    <Link
      href={action.href}
      className={
        secondary
          ? 'inline-flex min-h-12 items-center justify-center rounded-full border border-current px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-75'
          : 'inline-flex min-h-12 items-center justify-center rounded-full bg-current px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5'
      }
    >
      <span className={secondary ? '' : 'text-[var(--theme-primary-contrast,#fff)]'}>
        {action.label}
      </span>
    </Link>
  )
}

export function FullBleedHero({
  eyebrow,
  title,
  description,
  imageUrl,
  imageAlt,
  primaryAction,
  secondaryAction,
}: HeroProps) {
  return (
    <section className="relative isolate flex min-h-[78svh] items-end overflow-hidden">
      <div
        role="img"
        aria-label={imageAlt}
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
      <div className="mx-auto w-full max-w-7xl px-5 pb-16 pt-32 text-white sm:px-8 md:pb-24">
        <div className="max-w-3xl">
          {eyebrow && <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em]">{eyebrow}</p>}
          <h1 className="text-5xl font-semibold leading-[0.95] sm:text-6xl lg:text-7xl">{title}</h1>
          {description && <p className="mt-6 max-w-2xl text-lg text-white/85 sm:text-xl">{description}</p>}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ActionLink action={primaryAction} />
            {secondaryAction && <ActionLink action={secondaryAction} secondary />}
          </div>
        </div>
      </div>
    </section>
  )
}

export function SplitHero({
  eyebrow,
  title,
  description,
  imageUrl,
  imageAlt,
  primaryAction,
  secondaryAction,
}: HeroProps) {
  return (
    <section className="grid min-h-[680px] bg-[var(--theme-background,#fff)] lg:grid-cols-2">
      <div className="flex items-center px-5 py-16 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-xl lg:mx-0">
          {eyebrow && (
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--theme-primary)]">
              {eyebrow}
            </p>
          )}
          <h1 className="text-5xl font-semibold leading-[0.98] text-[var(--theme-text,#18181b)] sm:text-6xl">
            {title}
          </h1>
          {description && (
            <p className="mt-6 text-lg leading-8 text-[var(--theme-muted-text,#52525b)]">{description}</p>
          )}
          <div className="mt-8 flex flex-col gap-3 text-[var(--theme-primary)] sm:flex-row">
            <ActionLink action={primaryAction} />
            {secondaryAction && <ActionLink action={secondaryAction} secondary />}
          </div>
        </div>
      </div>
      <div
        role="img"
        aria-label={imageAlt}
        className="min-h-[420px] bg-cover bg-center lg:min-h-full"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
    </section>
  )
}

export function EditorialIntroduction({
  eyebrow,
  title,
  body,
}: {
  eyebrow?: string
  title: string
  body: string
}) {
  return (
    <section className="px-5 py-20 sm:px-8 md:py-28">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
        <div>
          {eyebrow && (
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--theme-primary)]">
              {eyebrow}
            </p>
          )}
          <h2 className="mt-4 text-4xl font-semibold leading-tight text-[var(--theme-text,#18181b)] sm:text-5xl">
            {title}
          </h2>
        </div>
        <p className="text-lg leading-8 text-[var(--theme-muted-text,#52525b)] sm:text-xl">{body}</p>
      </div>
    </section>
  )
}

export function PractitionerProfile({
  name,
  role,
  biography,
  imageUrl,
  imageAlt,
  credentials = [],
}: {
  name: string
  role: string
  biography: string
  imageUrl: string
  imageAlt: string
  credentials?: string[]
}) {
  return (
    <section className="px-5 py-20 sm:px-8 md:py-28">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] bg-[var(--theme-surface,#f4f4f5)] lg:grid-cols-2">
        <div
          role="img"
          aria-label={imageAlt}
          className="min-h-[420px] bg-cover bg-center"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
        <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--theme-primary)]">{role}</p>
          <h2 className="mt-3 text-4xl font-semibold text-[var(--theme-text,#18181b)]">{name}</h2>
          <p className="mt-6 text-lg leading-8 text-[var(--theme-muted-text,#52525b)]">{biography}</p>
          {credentials.length > 0 && (
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {credentials.map(credential => (
                <li key={credential} className="flex items-start gap-2 text-sm font-medium">
                  <Award className="mt-0.5 h-4 w-4 shrink-0 text-[var(--theme-primary)]" />
                  {credential}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}

export interface PremiumServiceItem {
  id: string
  name: string
  description?: string
  duration: string
  price: string
  imageUrl?: string
  imageAlt?: string
  bookingHref: string
}

export function ImageServiceCards({ title, services }: { title: string; services: PremiumServiceItem[] }) {
  return (
    <section className="px-5 py-20 sm:px-8 md:py-28">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-4xl font-semibold text-[var(--theme-text,#18181b)] sm:text-5xl">{title}</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {services.map(service => (
            <article key={service.id} className="overflow-hidden rounded-[1.5rem] border bg-white shadow-sm">
              {service.imageUrl && (
                <div
                  role="img"
                  aria-label={service.imageAlt || service.name}
                  className="aspect-[4/3] bg-cover bg-center"
                  style={{ backgroundImage: `url(${service.imageUrl})` }}
                />
              )}
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-2xl font-semibold">{service.name}</h3>
                  <span className="font-semibold text-[var(--theme-primary)]">{service.price}</span>
                </div>
                {service.description && <p className="mt-3 text-sm leading-6 text-zinc-600">{service.description}</p>}
                <div className="mt-5 flex items-center justify-between gap-4">
                  <span className="inline-flex items-center gap-2 text-sm text-zinc-600">
                    <Clock3 className="h-4 w-4" /> {service.duration}
                  </span>
                  <Link href={service.bookingHref} className="font-semibold text-[var(--theme-primary)]">
                    Book now
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function CompactServiceList({ title, services }: { title: string; services: PremiumServiceItem[] }) {
  return (
    <section className="px-5 py-20 sm:px-8 md:py-28">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-4xl font-semibold text-[var(--theme-text,#18181b)] sm:text-5xl">{title}</h2>
        <div className="mt-10 divide-y border-y">
          {services.map(service => (
            <article key={service.id} className="grid gap-4 py-6 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <h3 className="text-xl font-semibold">{service.name}</h3>
                  <span className="text-sm text-zinc-500">{service.duration}</span>
                </div>
                {service.description && <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">{service.description}</p>}
              </div>
              <div className="flex items-center justify-between gap-5 sm:justify-end">
                <span className="font-semibold">{service.price}</span>
                <Link href={service.bookingHref} className="rounded-full bg-[var(--theme-primary)] px-5 py-2.5 text-sm font-semibold text-white">
                  Book
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function FullWidthGallery({
  images,
}: {
  images: Array<{ url: string; alt: string }>
}) {
  return (
    <section className="grid grid-cols-2 gap-1 sm:grid-cols-4">
      {images.map((image, index) => (
        <div
          key={`${image.url}-${index}`}
          role="img"
          aria-label={image.alt}
          className="aspect-square bg-cover bg-center first:col-span-2 first:row-span-2"
          style={{ backgroundImage: `url(${image.url})` }}
        />
      ))}
    </section>
  )
}

export function TestimonialFeature({
  quote,
  name,
  detail,
  rating,
}: {
  quote: string
  name: string
  detail?: string
  rating?: number
}) {
  return (
    <section className="px-5 py-20 sm:px-8 md:py-28">
      <figure className="mx-auto max-w-5xl text-center">
        {rating && (
          <div className="mb-7 flex justify-center gap-1" aria-label={`${rating} out of 5 stars`}>
            {Array.from({ length: rating }, (_, index) => (
              <Star key={index} className="h-5 w-5 fill-current text-[var(--theme-primary)]" />
            ))}
          </div>
        )}
        <blockquote className="text-3xl font-medium leading-tight text-[var(--theme-text,#18181b)] sm:text-5xl">
          “{quote}”
        </blockquote>
        <figcaption className="mt-8 text-sm font-semibold uppercase tracking-[0.16em]">
          {name}
          {detail && <span className="font-normal text-zinc-500"> · {detail}</span>}
        </figcaption>
      </figure>
    </section>
  )
}

export function TrustStrip({ items }: { items: Array<{ label: string; icon?: ReactNode }> }) {
  return (
    <section className="border-y bg-[var(--theme-surface,#fafafa)] px-5 py-6 sm:px-8">
      <ul className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(item => (
          <li key={item.label} className="flex items-center justify-center gap-3 text-center text-sm font-semibold">
            {item.icon || <ShieldCheck className="h-5 w-5 text-[var(--theme-primary)]" />}
            {item.label}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function LocationHoursPanel({
  address,
  directionsHref,
  hours,
}: {
  address: string
  directionsHref?: string
  hours: Array<{ day: string; time: string }>
}) {
  return (
    <section className="px-5 py-20 sm:px-8 md:py-28">
      <div className="mx-auto grid max-w-5xl gap-8 rounded-[2rem] bg-[var(--theme-surface,#f4f4f5)] p-8 sm:p-12 md:grid-cols-2">
        <div>
          <MapPin className="h-7 w-7 text-[var(--theme-primary)]" />
          <h2 className="mt-5 text-3xl font-semibold">Visit us</h2>
          <p className="mt-4 leading-7 text-zinc-600">{address}</p>
          {directionsHref && (
            <Link href={directionsHref} className="mt-6 inline-flex font-semibold text-[var(--theme-primary)]">
              Get directions
            </Link>
          )}
        </div>
        <div>
          <Clock3 className="h-7 w-7 text-[var(--theme-primary)]" />
          <h2 className="mt-5 text-3xl font-semibold">Opening hours</h2>
          <dl className="mt-4 divide-y">
            {hours.map(item => (
              <div key={item.day} className="flex justify-between gap-4 py-3 text-sm">
                <dt className="font-medium">{item.day}</dt>
                <dd className="text-right text-zinc-600">{item.time}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

export function PremiumFaqAccordion({
  title,
  items,
}: {
  title: string
  items: Array<{ id: string; question: string; answer: string }>
}) {
  return (
    <section className="px-5 py-20 sm:px-8 md:py-28">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-4xl font-semibold sm:text-5xl">{title}</h2>
        <div className="mt-10 divide-y border-y">
          {items.map(item => (
            <details key={item.id} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                {item.question}
                <span className="text-2xl font-light transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="max-w-3xl pb-2 pt-4 leading-7 text-zinc-600">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

export function BookingCtaBanner({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action: ActionProps
}) {
  return (
    <section className="px-5 py-16 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 rounded-[2rem] bg-[var(--theme-primary)] p-8 text-white sm:p-12 lg:flex-row lg:items-center">
        <div className="max-w-3xl">
          {eyebrow && <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">{eyebrow}</p>}
          <h2 className="mt-3 text-4xl font-semibold sm:text-5xl">{title}</h2>
          {description && <p className="mt-4 text-lg text-white/80">{description}</p>}
        </div>
        <Link href={action.href} className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-[var(--theme-primary)]">
          <Calendar className="h-5 w-5" /> {action.label}
        </Link>
      </div>
    </section>
  )
}

export function StickyMobileBookingCta({ action }: { action: ActionProps }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
      <Link href={action.href} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--theme-primary)] px-5 py-3 font-semibold text-white">
        <Calendar className="h-5 w-5" /> {action.label}
      </Link>
    </div>
  )
}

export function InstagramSocialSection({
  handle,
  href,
  description,
  images = [],
}: {
  handle: string
  href: string
  description?: string
  images?: Array<{ url: string; alt: string }>
}) {
  return (
    <section className="px-5 py-20 sm:px-8 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-3 text-[var(--theme-primary)]">
              <Instagram className="h-6 w-6" />
              <span className="text-sm font-semibold uppercase tracking-[0.16em]">Instagram</span>
            </div>
            <h2 className="mt-4 text-4xl font-semibold sm:text-5xl">{handle}</h2>
            {description && <p className="mt-3 max-w-2xl text-zinc-600">{description}</p>}
          </div>
          <Link href={href} className="inline-flex items-center gap-2 font-semibold text-[var(--theme-primary)]">
            Follow on Instagram <Sparkles className="h-4 w-4" />
          </Link>
        </div>
        {images.length > 0 && (
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((image, index) => (
              <div
                key={`${image.url}-${index}`}
                role="img"
                aria-label={image.alt}
                className="aspect-square rounded-2xl bg-cover bg-center"
                style={{ backgroundImage: `url(${image.url})` }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export const defaultTrustItems = [
  { label: 'Qualified professional', icon: <Award className="h-5 w-5 text-[var(--theme-primary)]" /> },
  { label: 'Easy online booking', icon: <Calendar className="h-5 w-5 text-[var(--theme-primary)]" /> },
  { label: 'Clear service information', icon: <CheckCircle2 className="h-5 w-5 text-[var(--theme-primary)]" /> },
  { label: 'Customer-first care', icon: <ShieldCheck className="h-5 w-5 text-[var(--theme-primary)]" /> },
]
