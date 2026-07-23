'use client'

import { ContactSection as ContactSectionType } from '@/types/page-sections'
import { motion } from 'framer-motion'
import Image from 'next/image'
import {
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Globe,
  Youtube,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import {
  getAccentColor,
  getContentWidth,
  getSectionSpacing,
  getSectionStyle,
} from './section-style'

interface ContactSectionProps {
  section: ContactSectionType
  bookingHref?: string
  businessData: {
    phone?: string
    email?: string
    address?: string
    city?: string
    zipCode?: string
    website?: string
    socialLinks?: {
      facebook?: string
      instagram?: string
      twitter?: string
      linkedin?: string
      website?: string
      youtube?: string
      tiktok?: string
    }
  }
}

const socialIcons = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  website: Globe,
  youtube: Youtube,
  tiktok: Globe,
}

function resolveCtaLink(link: string | undefined, bookingHref?: string) {
  if (!link) return undefined
  const normalized = link.trim().toLowerCase()
  return bookingHref && ['#book', '#booking', '/book'].includes(normalized) ? bookingHref : link
}

export function ContactSection({ section, businessData, bookingHref }: ContactSectionProps) {
  const {
    title,
    showPhone = true,
    showEmail = true,
    showAddress = true,
    showMap = false,
    showSocialMedia = true,
    mapEmbedUrl,
    eyebrow,
    description,
    ctaText,
    ctaLink,
    secondaryCtaText,
    secondaryCtaLink,
    layout = 'standard',
    backgroundImage,
    note,
  } = section.data

  const fullAddress = [businessData.address, businessData.city, businessData.zipCode]
    .filter(Boolean)
    .join(', ')
  const accentColor = getAccentColor(section.appearance)
  const textColor = layout === 'immersive' ? '#FFFFFF' : section.appearance?.textColor || '#111827'
  const resolvedCtaLink = resolveCtaLink(ctaLink, bookingHref)
  const resolvedSecondaryCtaLink = resolveCtaLink(secondaryCtaLink, bookingHref)
  const socialLinks = Object.entries({
    ...businessData.socialLinks,
    website: businessData.socialLinks?.website || businessData.website,
  }).filter((entry): entry is [string, string] => Boolean(entry[1]))

  const contactItems = [
    showPhone && businessData.phone
      ? {
          label: 'Phone',
          value: businessData.phone,
          href: `tel:${businessData.phone}`,
          Icon: Phone,
        }
      : null,
    showEmail && businessData.email
      ? {
          label: 'Email',
          value: businessData.email,
          href: `mailto:${businessData.email}`,
          Icon: Mail,
        }
      : null,
    showAddress && fullAddress
      ? { label: 'Visit', value: fullAddress, href: undefined, Icon: MapPin }
      : null,
  ].filter(Boolean) as Array<{
    label: string
    value: string
    href?: string
    Icon: typeof Phone
  }>

  const actions =
    (ctaText && resolvedCtaLink) || (secondaryCtaText && resolvedSecondaryCtaLink) ? (
      <div className="flex flex-wrap gap-3 pt-2">
        {ctaText && resolvedCtaLink && (
          <a
            href={resolvedCtaLink}
            className="theme-button-primary inline-flex min-h-12 items-center gap-2 px-6 py-3 font-semibold shadow-[0_16px_45px_rgba(0,0,0,0.16)]"
          >
            {ctaText} <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </a>
        )}
        {secondaryCtaText && resolvedSecondaryCtaLink && (
          <a
            href={resolvedSecondaryCtaLink}
            className="inline-flex min-h-12 items-center border border-current/20 px-6 py-3 font-semibold transition-colors hover:bg-current/5"
            style={{ borderRadius: 'var(--theme-radius)' }}
          >
            {secondaryCtaText}
          </a>
        )}
      </div>
    ) : null

  const socialElement = showSocialMedia && socialLinks.length > 0 && (
    <div className="flex flex-wrap gap-2">
      {socialLinks.map(([platform, url]) => {
        const Icon = socialIcons[platform as keyof typeof socialIcons]
        if (!Icon) return null
        return (
          <a
            key={platform}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-current/15 transition-all hover:-translate-y-1 hover:bg-current/5"
            title={platform}
            aria-label={platform}
          >
            <Icon className="h-4 w-4" />
          </a>
        )
      })}
    </div>
  )

  const contactList = (
    <div className="space-y-1">
      {contactItems.map(({ label, value, href, Icon }) => (
        <div
          key={label}
          className="grid grid-cols-[44px_1fr] gap-4 border-b border-current/10 py-5 last:border-b-0"
        >
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full border border-current/15"
            style={{ color: accentColor }}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] opacity-50">
              {label}
            </p>
            {href ? (
              <a
                href={href}
                className="mt-1 block break-words text-lg font-semibold hover:underline"
              >
                {value}
              </a>
            ) : (
              <p className="mt-1 text-lg font-semibold">{value}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )

  if (layout === 'immersive') {
    return (
      <section
        id={section.id}
        className={cn('relative isolate overflow-hidden', getSectionSpacing(section.appearance))}
        style={getSectionStyle(section.appearance, '#17130F', '#FFFFFF')}
      >
        {backgroundImage && (
          <div className="absolute inset-0 -z-20">
            <Image src={backgroundImage} alt="" fill sizes="100vw" className="object-cover" />
          </div>
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/70 to-black/25" />

        <div className={cn('mx-auto px-4 sm:px-6 lg:px-8', getContentWidth(section.appearance))}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end"
            style={{ color: textColor }}
          >
            <div className="max-w-3xl">
              {eyebrow && (
                <p
                  className="mb-5 text-xs font-semibold uppercase tracking-[0.28em]"
                  style={{ color: accentColor }}
                >
                  {eyebrow}
                </p>
              )}
              <h2
                className="text-5xl font-bold leading-[0.94] tracking-[-0.045em] sm:text-7xl lg:text-[5.7rem]"
                style={{ fontFamily: 'var(--theme-font-heading)' }}
              >
                {title}
              </h2>
              {description && (
                <p className="mt-6 max-w-2xl text-lg leading-relaxed opacity-80 sm:text-xl">
                  {description}
                </p>
              )}
              <div className="mt-8">{actions}</div>
              {note && <p className="mt-5 text-sm opacity-60">{note}</p>}
            </div>

            <aside
              className="border border-white/20 bg-black/35 p-6 backdrop-blur-xl sm:p-8"
              style={{ borderRadius: 'calc(var(--theme-radius) + 0.75rem)' }}
            >
              {contactList}
              <div className="mt-6">{socialElement}</div>
            </aside>
          </motion.div>
        </div>
      </section>
    )
  }

  return (
    <section
      id={section.id}
      className={cn('relative isolate overflow-hidden', getSectionSpacing(section.appearance))}
      style={getSectionStyle(section.appearance, '#F8FAFC', '#111827')}
    >
      <div
        className="absolute -right-32 -top-32 -z-10 h-96 w-96 rounded-full blur-3xl"
        style={{ backgroundColor: `${accentColor}20` }}
        aria-hidden="true"
      />
      <div className={cn('mx-auto px-4 sm:px-6 lg:px-8', getContentWidth(section.appearance))}>
        <div
          className={cn(
            'mx-auto grid gap-12',
            layout === 'panel'
              ? 'max-w-6xl overflow-hidden border border-current/10 p-7 shadow-[0_30px_100px_rgba(0,0,0,0.12)] md:p-12 lg:grid-cols-[minmax(0,1fr)_380px]'
              : 'max-w-5xl md:grid-cols-2'
          )}
          style={
            layout === 'panel'
              ? {
                  borderRadius: 'calc(var(--theme-radius) + 1.25rem)',
                  backgroundColor: `${section.appearance?.backgroundColor || '#ffffff'}dd`,
                }
              : undefined
          }
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            style={{ color: textColor }}
          >
            {eyebrow && (
              <p
                className="mb-5 text-xs font-semibold uppercase tracking-[0.28em]"
                style={{ color: accentColor }}
              >
                {eyebrow}
              </p>
            )}
            <h2
              className="text-4xl font-bold leading-[0.98] tracking-[-0.04em] sm:text-6xl"
              style={{ fontFamily: 'var(--theme-font-heading)' }}
            >
              {title}
            </h2>
            {description && (
              <p className="mt-6 max-w-xl text-lg leading-relaxed opacity-70">{description}</p>
            )}
            <div className="mt-8">{actions}</div>
            {note && <p className="mt-5 text-sm opacity-60">{note}</p>}
            <div className="mt-8">{socialElement}</div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="border-t border-current/10 pt-2 md:border-l md:border-t-0 md:pl-10"
            style={{ color: textColor }}
          >
            {contactList}
          </motion.aside>
        </div>

        {showMap && mapEmbedUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto mt-10 h-[400px] max-w-6xl overflow-hidden shadow-lg"
            style={{ borderRadius: 'calc(var(--theme-radius) + 0.75rem)' }}
          >
            <iframe
              src={mapEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Business location"
            />
          </motion.div>
        )}
      </div>
    </section>
  )
}
