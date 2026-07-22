'use client'

import { HeroSection as HeroSectionType } from '@/types/page-sections'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
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
  compact: 'min-h-[480px]',
  standard: 'min-h-[600px]',
  viewport: 'min-h-[calc(100svh-4rem)]',
}

const imageFocalClasses = {
  top: 'object-top',
  center: 'object-center',
  bottom: 'object-bottom',
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
  } = section.data

  const resolvedCtaLink = resolveCtaLink(ctaLink, bookingHref)
  const resolvedSecondaryCtaLink = resolveCtaLink(secondaryCtaLink, bookingHref)
  const accentColor = getAccentColor(section.appearance)
  const explicitTextColor =
    section.appearance?.textColor ||
    (textColor === 'custom' ? customTextColor : textColor === 'light' ? '#FFFFFF' : '#111827')

  const textShadowStyle = textShadow
    ? { textShadow: '0 2px 4px rgba(0,0,0,0.14), 0 8px 24px rgba(0,0,0,0.12)' }
    : undefined

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
        return { background: `linear-gradient(135deg, ${colorWithOpacity} 0%, transparent 100%)` }
      default:
        return { backgroundColor: colorWithOpacity }
    }
  }

  const eyebrowElement = eyebrow ? (
    <p
      className="text-xs font-semibold uppercase tracking-[0.28em] sm:text-sm"
      style={{ color: layout === 'cover' ? explicitTextColor : accentColor }}
    >
      {eyebrow}
    </p>
  ) : null

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
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="theme-button-primary inline-flex min-h-12 items-center gap-2 px-6 py-3 text-base font-semibold"
          >
            {ctaText} <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </motion.a>
        )}

        {secondaryCtaText && resolvedSecondaryCtaLink && (
          <motion.a
            href={resolvedSecondaryCtaLink}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="theme-button-outline inline-flex min-h-12 items-center gap-2 px-6 py-3 text-base font-semibold"
          >
            {secondaryCtaText}
          </motion.a>
        )}
      </div>
    ) : null

  if (layout === 'cover') {
    return (
      <section
        id={section.id}
        className={cn(
          'relative flex items-center justify-center overflow-hidden',
          heightClasses[minHeight]
        )}
        style={getSectionStyle(section.appearance)}
      >
        {backgroundImage && (
          <div className="absolute inset-0 z-0">
            <Image
              src={backgroundImage}
              alt=""
              fill
              priority
              sizes="100vw"
              className={cn('object-cover', imageFocalClasses[imageFocalPoint])}
            />
          </div>
        )}

        {overlay && <div className="absolute inset-0 z-10" style={getOverlayStyle()} />}

        <div
          className={cn(
            'relative z-20 mx-auto w-full px-4 sm:px-6 lg:px-8',
            getContentWidth(section.appearance)
          )}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className={cn('mx-auto flex max-w-4xl flex-col gap-6', alignmentClasses[alignment])}
            style={{ color: explicitTextColor, ...textShadowStyle }}
          >
            {eyebrowElement}
            <h1 className="text-4xl font-bold leading-[1.03] sm:text-5xl md:text-6xl lg:text-7xl">
              {title}
            </h1>
            {subtitle && (
              <p className="max-w-2xl text-lg opacity-90 sm:text-xl md:text-2xl">{subtitle}</p>
            )}
            {actions}
          </motion.div>
        </div>
      </section>
    )
  }

  const isEditorial = layout === 'editorial'
  const imageFirst = imagePosition === 'left'

  return (
    <section
      id={section.id}
      className={cn(
        'relative flex items-center overflow-hidden',
        heightClasses[minHeight],
        getSectionSpacing(section.appearance)
      )}
      style={getSectionStyle(section.appearance, isEditorial ? '#F6F0E8' : '#FFFFFF', '#111827')}
    >
      {isEditorial && (
        <div
          className="pointer-events-none absolute inset-y-0 left-0 hidden w-2 lg:block"
          style={{ backgroundColor: accentColor }}
          aria-hidden="true"
        />
      )}

      <div
        className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', getContentWidth(section.appearance))}
      >
        <div
          className={cn(
            'grid items-center gap-10 lg:grid-cols-2 lg:gap-16',
            isEditorial && 'lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]'
          )}
        >
          <motion.div
            initial={{ opacity: 0, x: imageFirst ? 28 : -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className={cn(
              'flex flex-col gap-6',
              alignmentClasses[alignment],
              imageFirst && 'lg:order-2'
            )}
            style={{ color: explicitTextColor }}
          >
            {eyebrowElement}
            <h1
              className={cn(
                'font-bold leading-[0.98] tracking-[-0.035em]',
                isEditorial
                  ? 'text-5xl sm:text-6xl lg:text-7xl xl:text-8xl'
                  : 'text-4xl sm:text-5xl lg:text-6xl'
              )}
              style={{ fontFamily: 'var(--theme-font-heading)' }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="max-w-xl text-lg leading-relaxed opacity-80 sm:text-xl">{subtitle}</p>
            )}
            {actions}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.75 }}
            className={cn(
              'relative overflow-hidden bg-black/5',
              isEditorial ? 'aspect-[4/5] min-h-[440px]' : 'aspect-[5/4] min-h-[360px]',
              imageFirst && 'lg:order-1'
            )}
            style={{ borderRadius: isEditorial ? '0' : 'var(--theme-radius)' }}
          >
            {backgroundImage ? (
              <Image
                src={backgroundImage}
                alt={title}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className={cn('object-cover', imageFocalClasses[imageFocalPoint])}
              />
            ) : (
              <div className="flex h-full items-center justify-center px-8 text-center text-sm opacity-60">
                Add a hero image in the editor to complete this composition.
              </div>
            )}

            {isEditorial && (
              <div
                className="absolute bottom-0 left-0 h-24 w-24 -translate-x-1/3 translate-y-1/3 border"
                style={{ borderColor: accentColor }}
                aria-hidden="true"
              />
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
