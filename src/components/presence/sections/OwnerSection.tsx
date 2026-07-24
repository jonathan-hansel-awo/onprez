'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, Award, Quote } from 'lucide-react'
import type { OwnerSection as OwnerSectionType } from '@/types/page-sections'
import { sanitizeHtml } from '@/lib/utils/sanitize-html'
import { cn } from '@/lib/utils/cn'
import {
  getAccentColor,
  getContentWidth,
  getSectionSpacing,
  getSectionStyle,
} from './section-style'

interface OwnerSectionProps {
  section: OwnerSectionType
  bookingHref?: string
}

function resolveCtaLink(link: string | undefined, bookingHref?: string) {
  if (!link) return undefined
  const normalized = link.trim().toLowerCase()
  return bookingHref && ['#book', '#booking', '/book'].includes(normalized) ? bookingHref : link
}

export function OwnerSection({ section, bookingHref }: OwnerSectionProps) {
  const {
    eyebrow,
    name,
    role,
    biography,
    image,
    imagePosition = 'left',
    layout = 'portrait',
    credentials = [],
    quote,
    signature,
    ctaText,
    ctaLink,
  } = section.data

  const accentColor = getAccentColor(section.appearance)
  const resolvedCtaLink = resolveCtaLink(ctaLink, bookingHref)
  const sanitizedBiography = sanitizeHtml(biography)
  const imageFirst = imagePosition === 'left'

  const portrait = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn('relative', !imageFirst && 'md:order-2')}
    >
      <div
        className={cn(
          'relative mx-auto aspect-[4/5] w-full max-w-[34rem] overflow-hidden bg-black/5',
          layout === 'editorial' ? 'rounded-t-[45%] rounded-b-[1.75rem]' : 'rounded-[1.75rem]'
        )}
      >
        {image ? (
          <Image
            src={image}
            alt={`${name}${role ? `, ${role}` : ''}`}
            fill
            sizes="(min-width: 768px) 46vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-8 text-center text-sm opacity-60">
            Add an owner portrait in the editor.
          </div>
        )}
      </div>

      {signature && (
        <p
          className="absolute -bottom-4 right-3 rotate-[-4deg] text-3xl italic sm:right-8 sm:text-4xl"
          style={{ color: accentColor, fontFamily: 'var(--theme-font-heading)' }}
          aria-label={`Signed ${signature}`}
        >
          {signature}
        </p>
      )}
    </motion.div>
  )

  const story = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(!imageFirst && 'md:order-1')}
    >
      {eyebrow && (
        <div className="mb-5 flex items-center gap-3">
          <span className="h-px w-9" style={{ backgroundColor: accentColor }} aria-hidden="true" />
          <p
            className="text-xs font-semibold uppercase tracking-[0.26em]"
            style={{ color: accentColor }}
          >
            {eyebrow}
          </p>
        </div>
      )}

      <h2
        className="text-[clamp(2.75rem,12vw,5rem)] font-bold leading-[0.94] tracking-[-0.045em]"
        style={{ fontFamily: 'var(--theme-font-heading)' }}
      >
        {name}
      </h2>

      {role && (
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] opacity-65">{role}</p>
      )}

      <div
        className="prose prose-lg mt-7 max-w-none leading-relaxed theme-body-text"
        dangerouslySetInnerHTML={{ __html: sanitizedBiography }}
      />

      {quote && (
        <blockquote
          className="relative mt-8 border-l-2 pl-6 text-xl font-medium italic leading-relaxed sm:text-2xl"
          style={{ borderColor: accentColor, fontFamily: 'var(--theme-font-heading)' }}
        >
          <Quote
            className="absolute -left-3 -top-4 h-7 w-7 bg-inherit p-1 opacity-30"
            style={{ color: accentColor }}
            aria-hidden="true"
          />
          “{quote}”
        </blockquote>
      )}

      {credentials.length > 0 && (
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {credentials.map((credential, index) => (
            <div
              key={`${credential}-${index}`}
              className="flex items-start gap-3 border-t border-current/15 py-4 text-sm font-semibold"
            >
              <Award className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accentColor }} />
              <span>{credential}</span>
            </div>
          ))}
        </div>
      )}

      {ctaText && resolvedCtaLink && (
        <a
          href={resolvedCtaLink}
          className="theme-button-primary mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 px-6 py-3 font-semibold sm:w-auto"
        >
          {ctaText}
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </a>
      )}
    </motion.div>
  )

  if (layout === 'profile-card') {
    return (
      <section
        id={section.id}
        className={getSectionSpacing(section.appearance)}
        style={getSectionStyle(section.appearance, '#F7F4EF', '#1F2933')}
      >
        <div className={cn('mx-auto px-4 sm:px-6 lg:px-8', getContentWidth(section.appearance))}>
          <div
            className="mx-auto grid max-w-5xl gap-10 overflow-hidden border border-current/10 bg-white/70 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.12)] backdrop-blur md:grid-cols-[0.8fr_1.2fr] md:items-center md:p-10"
            style={{ borderRadius: 'var(--theme-radius)' }}
          >
            {portrait}
            {story}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      id={section.id}
      className={cn('relative isolate overflow-hidden', getSectionSpacing(section.appearance))}
      style={getSectionStyle(section.appearance, '#FFFFFF', '#1F2933')}
    >
      <div
        className="absolute -right-40 top-16 -z-10 h-96 w-96 rounded-full blur-3xl"
        style={{ backgroundColor: `${accentColor}18` }}
        aria-hidden="true"
      />
      <div className={cn('mx-auto px-4 sm:px-6 lg:px-8', getContentWidth(section.appearance))}>
        <div
          className={cn(
            'grid items-center gap-12 md:grid-cols-2 lg:gap-20',
            layout === 'editorial' && 'md:grid-cols-[minmax(340px,0.85fr)_minmax(0,1.15fr)]'
          )}
        >
          {portrait}
          {story}
        </div>
      </div>
    </section>
  )
}
