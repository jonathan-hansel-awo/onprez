'use client'

import { HeroSection as HeroSectionType } from '@/types/page-sections'
import { motion } from 'framer-motion'
import { ArrowDown, ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import Image from 'next/image'
import {
  getAccentColor,
  getContentWidth,
  getSectionSpacing,
  getSectionStyle,
} from './section-style'

interface HeroSectionProps {
  section: HeroSectionType
  bookingHref?: string
}

const alignmentClasses = {
  left: 'text-left items-start',
  center: 'text-center items-center',
  right: 'text-right items-end',
}

const heightClasses = {
  compact: 'min-h-[520px]',
  standard: 'min-h-[680px]',
  viewport: 'min-h-[calc(100svh-4rem)]',
}

const imageFocalClasses = {
  top: 'object-top',
  center: 'object-center',
  bottom: 'object-bottom',
}

const imageTreatmentClasses = {
  full: 'rounded-none',
  frame: 'rounded-[2rem] border border-current/15 p-3',
  arch: 'rounded-t-[999px] rounded-b-[2.5rem] border border-current/15 p-2',
  offset: 'rounded-[1.25rem] border border-current/15 p-2',
  collage: 'rounded-none border border-current/15 p-2',
}

function resolveCtaLink(link: string | undefined, bookingHref?: string) {
  if (!link) return undefined

  const normalized = link.trim().toLowerCase()
  const bookingAliases = new Set(['#contact', '#booking', '#book', '/book'])

  return bookingHref && (bookingAliases.has(normalized) || normalized.endsWith('/book'))
    ? bookingHref
    : link
}

export function HeroSection({ section, bookingHref }: HeroSectionProps) {
  const {
    title,
    subtitle,
    eyebrow,
    ctaText,
    ctaLink,
    secondaryCtaText,
    secondaryCtaLink,
    backgroundImage,
    layout = 'cover',
    imagePosition = 'right',
    imageFocalPoint = 'center',
    minHeight = 'standard',
    alignment = layout === 'cover' ? 'center' : 'left',
    overlay = true,
    overlayColor = '#000000',
    overlayOpacity = 50,
    overlayStyle = 'solid',
    textColor = layout === 'cover' ? 'light' : 'dark',
    customTextColor,
    textShadow = layout === 'cover',
    variant = 'classic',
    imageTreatment = layout === 'editorial' ? 'frame' : 'full',
    floatingCard,
    meta = [],
    decorativeText,
    showScrollCue = false,
  } = section.data

  const resolvedCtaLink = resolveCtaLink(ctaLink, bookingHref)
  const resolvedSecondaryCtaLink = resolveCtaLink(secondaryCtaLink, bookingHref)
  const accentColor = getAccentColor(section.appearance)
  const explicitTextColor =
    section.appearance?.textColor ||
    (textColor === 'custom' ? customTextColor : textColor === 'light' ? '#FFFFFF' : '#111827')
  const textShadowStyle = textShadow
    ? { textShadow: '0 2px 4px rgba(0,0,0,0.16), 0 12px 34px rgba(0,0,0,0.18)' }
    : undefined
  const isEditorial = layout === 'editorial'
  const isImageLeft = imagePosition === 'left'
  const isStatement = variant === 'bold' || variant === 'creative'
  const isRefined = variant === 'luxury' || variant === 'editorial'

  function getOverlayStyle() {
    const opacityHex = Math.round((overlayOpacity / 100) * 255)
      .toString(16)
      .padStart(2, '0')
    const colorWithOpacity = `${overlayColor}${opacityHex}`

    switch (overlayStyle) {
      case 'gradient-vertical':
        return {
          background: `linear-gradient(to bottom, ${colorWithOpacity} 0%, transparent 100%)`,
        }
      case 'gradient-diagonal':
        return {
          background: `linear-gradient(110deg, ${colorWithOpacity} 0%, ${colorWithOpacity} 42%, transparent 82%)`,
        }
      default:
        return { backgroundColor: colorWithOpacity }
    }
  }

  const eyebrowElement = eyebrow ? (
    <div className="flex items-center gap-3">
      <span className="h-px w-8" style={{ backgroundColor: accentColor }} aria-hidden="true" />
      <p
        className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] sm:text-xs"
        style={{ color: layout === 'cover' ? explicitTextColor : accentColor }}
      >
        {eyebrow}
      </p>
    </div>
  ) : null

  const metaElement = meta.length > 0 && (
    <div
      className={cn(
        'flex flex-wrap gap-2 pt-1 text-xs font-semibold uppercase tracking-[0.12em]',
        alignment === 'center' && 'justify-center',
        alignment === 'right' && 'justify-end'
      )}
    >
      {meta.map(item => (
        <span
          key={item}
          className="rounded-full border border-current/20 bg-white/10 px-3 py-2 backdrop-blur-sm"
        >
          {item}
        </span>
      ))}
    </div>
  )

  const actions =
    (ctaText && resolvedCtaLink) || (secondaryCtaText && resolvedSecondaryCtaLink) ? (
      <div
        className={cn(
          'flex flex-wrap gap-3 pt-2',
          alignment === 'center' && 'justify-center',
          alignment === 'right' && 'justify-end'
        )}
      >
        {ctaText && resolvedCtaLink && (
          <motion.a
            href={resolvedCtaLink}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.98 }}
            className="theme-button-primary inline-flex min-h-12 items-center gap-2 px-6 py-3 text-base font-semibold shadow-[0_16px_45px_rgba(0,0,0,0.16)]"
          >
            {ctaText} <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </motion.a>
        )}

        {secondaryCtaText && resolvedSecondaryCtaLink && (
          <motion.a
            href={resolvedSecondaryCtaLink}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex min-h-12 items-center gap-2 border border-current/25 bg-white/5 px-6 py-3 text-base font-semibold backdrop-blur-sm transition-colors hover:bg-white/10"
            style={{ borderRadius: 'var(--theme-radius)' }}
          >
            {secondaryCtaText}
          </motion.a>
        )}
      </div>
    ) : null

  const floatingCardElement = floatingCard ? (
    <motion.aside
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.6 }}
      className="relative overflow-hidden border border-white/35 bg-white/88 p-5 text-gray-950 shadow-[0_24px_80px_rgba(0,0,0,0.2)] backdrop-blur-xl"
      style={{ borderRadius: 'calc(var(--theme-radius) + 0.75rem)' }}
    >
      <Sparkles className="mb-4 h-5 w-5" style={{ color: accentColor }} aria-hidden="true" />
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] opacity-55">
        {floatingCard.eyebrow}
      </p>
      <p
        className="mt-2 text-xl font-bold leading-tight"
        style={{ fontFamily: 'var(--theme-font-heading)' }}
      >
        {floatingCard.title}
      </p>
      {floatingCard.description && (
        <p className="mt-2 text-sm leading-relaxed text-gray-600">{floatingCard.description}</p>
      )}
    </motion.aside>
  ) : null

  if (layout === 'cover') {
    return (
      <section
        id={section.id}
        className={cn(
          'relative isolate flex items-center overflow-hidden',
          heightClasses[minHeight]
        )}
        style={getSectionStyle(section.appearance)}
      >
        {backgroundImage && (
          <div className="absolute inset-0 -z-30">
            <Image
              src={backgroundImage}
              alt=""
              fill
              priority
              sizes="100vw"
              className={cn(
                'object-cover transition-transform duration-[1400ms]',
                imageFocalClasses[imageFocalPoint],
                variant === 'luxury' && 'scale-[1.02]'
              )}
            />
          </div>
        )}

        {overlay && <div className="absolute inset-0 -z-20" style={getOverlayStyle()} />}

        <div
          className="absolute -left-32 top-12 -z-10 h-80 w-80 rounded-full blur-3xl"
          style={{ backgroundColor: `${accentColor}30` }}
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-44 right-0 -z-10 h-[34rem] w-[34rem] rounded-full blur-3xl"
          style={{ backgroundColor: `${accentColor}24` }}
          aria-hidden="true"
        />

        {decorativeText && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-[-0.14em] -z-10 hidden select-none whitespace-nowrap text-center text-[17vw] font-bold leading-none opacity-[0.07] lg:block"
            style={{ fontFamily: 'var(--theme-font-heading)', color: explicitTextColor }}
            aria-hidden="true"
          >
            {decorativeText}
          </div>
        )}

        <div
          className={cn(
            'mx-auto grid w-full gap-10 px-4 py-20 sm:px-6 lg:px-8',
            getContentWidth(section.appearance),
            floatingCard && 'lg:grid-cols-[minmax(0,1fr)_310px] lg:items-end'
          )}
        >
          <motion.div
            initial={{ opacity: 0, y: 34 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75 }}
            className={cn(
              'flex max-w-5xl flex-col gap-6',
              alignmentClasses[alignment],
              alignment === 'center' && 'mx-auto',
              alignment === 'right' && 'ml-auto'
            )}
            style={{ color: explicitTextColor, ...textShadowStyle }}
          >
            {eyebrowElement}
            <h1
              className={cn(
                'font-bold leading-[0.94] tracking-[-0.045em]',
                isStatement
                  ? 'max-w-5xl text-5xl uppercase sm:text-7xl lg:text-[6.8rem]'
                  : isRefined
                    ? 'max-w-4xl text-5xl sm:text-7xl lg:text-[6.3rem]'
                    : 'max-w-4xl text-4xl sm:text-6xl lg:text-7xl'
              )}
              style={{ fontFamily: 'var(--theme-font-heading)' }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="max-w-2xl text-lg leading-relaxed opacity-90 sm:text-xl md:text-2xl">
                {subtitle}
              </p>
            )}
            {metaElement}
            {actions}
          </motion.div>

          {floatingCard && <div className="hidden lg:block">{floatingCardElement}</div>}
        </div>

        {showScrollCue && (
          <a
            href={`#${section.id}-next`}
            className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.22em] opacity-60 lg:flex"
            style={{ color: explicitTextColor }}
            aria-label="Continue to the next section"
          >
            Explore <ArrowDown className="h-4 w-4" aria-hidden="true" />
          </a>
        )}
      </section>
    )
  }

  return (
    <section
      id={section.id}
      className={cn(
        'relative isolate flex items-center overflow-hidden',
        heightClasses[minHeight],
        getSectionSpacing(section.appearance)
      )}
      style={getSectionStyle(section.appearance, isEditorial ? '#F6F0E8' : '#FFFFFF', '#111827')}
    >
      <div
        className="absolute right-[-12rem] top-[-12rem] -z-10 h-[30rem] w-[30rem] rounded-full blur-3xl"
        style={{ backgroundColor: `${accentColor}20` }}
        aria-hidden="true"
      />

      {decorativeText && (
        <div
          className="pointer-events-none absolute -left-4 bottom-2 -z-10 hidden select-none text-[11vw] font-bold uppercase leading-none opacity-[0.05] lg:block"
          style={{ fontFamily: 'var(--theme-font-heading)' }}
          aria-hidden="true"
        >
          {decorativeText}
        </div>
      )}

      <div
        className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', getContentWidth(section.appearance))}
      >
        <div
          className={cn(
            'grid items-center gap-12 lg:grid-cols-2 lg:gap-20',
            isEditorial && 'lg:grid-cols-[minmax(0,0.88fr)_minmax(440px,1.12fr)]'
          )}
        >
          <motion.div
            initial={{ opacity: 0, x: isImageLeft ? 28 : -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.75 }}
            className={cn(
              'flex flex-col gap-6',
              alignmentClasses[alignment],
              isImageLeft && 'lg:order-2'
            )}
            style={{ color: explicitTextColor }}
          >
            {eyebrowElement}
            <h1
              className={cn(
                'font-bold leading-[0.94] tracking-[-0.045em]',
                isStatement
                  ? 'text-5xl uppercase sm:text-7xl lg:text-[6rem]'
                  : isEditorial || isRefined
                    ? 'text-5xl sm:text-7xl lg:text-[5.8rem]'
                    : 'text-4xl sm:text-6xl lg:text-7xl'
              )}
              style={{ fontFamily: 'var(--theme-font-heading)' }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="max-w-xl text-lg leading-relaxed opacity-80 sm:text-xl">{subtitle}</p>
            )}
            {metaElement}
            {actions}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, x: isImageLeft ? -18 : 18 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className={cn('relative', isImageLeft && 'lg:order-1')}
          >
            {imageTreatment === 'offset' && (
              <div
                className="absolute -bottom-5 -right-5 h-full w-full border"
                style={{ borderColor: accentColor }}
                aria-hidden="true"
              />
            )}
            {imageTreatment === 'collage' && backgroundImage && (
              <div
                className="absolute -bottom-8 -left-8 z-20 hidden aspect-[4/5] w-36 overflow-hidden border-8 border-white shadow-2xl sm:block"
                style={{ transform: 'rotate(-5deg)' }}
                aria-hidden="true"
              >
                <Image
                  src={backgroundImage}
                  alt=""
                  fill
                  sizes="144px"
                  className={cn('object-cover', imageFocalClasses[imageFocalPoint])}
                />
              </div>
            )}

            <div
              className={cn(
                'relative overflow-hidden bg-black/5',
                isEditorial ? 'aspect-[4/5] min-h-[480px]' : 'aspect-[5/4] min-h-[390px]',
                imageTreatmentClasses[imageTreatment]
              )}
              style={{ color: accentColor }}
            >
              <div
                className="relative h-full w-full overflow-hidden"
                style={{ borderRadius: 'inherit' }}
              >
                {backgroundImage ? (
                  <Image
                    src={backgroundImage}
                    alt={title}
                    fill
                    priority
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className={cn(
                      'object-cover transition-transform duration-700 hover:scale-[1.025]',
                      imageFocalClasses[imageFocalPoint]
                    )}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-8 text-center text-sm opacity-60">
                    Add a hero image in the editor to complete this composition.
                  </div>
                )}
              </div>
            </div>

            {floatingCard && (
              <div className="absolute -bottom-8 right-4 z-30 w-[min(82%,310px)] sm:right-8">
                {floatingCardElement}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
