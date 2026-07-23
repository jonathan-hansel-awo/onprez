'use client'

import { AboutSection as AboutSectionType } from '@/types/page-sections'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Check, Quote } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { sanitizeHtml } from '@/lib/utils/sanitize-html'
import {
  getAccentColor,
  getContentWidth,
  getSectionSpacing,
  getSectionStyle,
} from './section-style'

interface AboutSectionProps {
  section: AboutSectionType
}

const imageShapeClasses = {
  portrait: 'aspect-[4/5]',
  landscape: 'aspect-[4/3]',
  square: 'aspect-square',
}

const imageTreatmentClasses = {
  classic: '',
  arch: 'rounded-t-[999px] rounded-b-[2.25rem]',
  stacked: 'rounded-[1.5rem]',
  framed: 'border border-current/15 p-3',
  polaroid: 'border-[12px] border-white shadow-2xl',
}

export function AboutSection({ section }: AboutSectionProps) {
  const {
    title,
    content,
    eyebrow,
    image,
    imagePosition = 'right',
    layout = 'split',
    imageShape = 'portrait',
    highlights = [],
    variant = 'classic',
    quote,
    stats = [],
    imageTreatment = variant === 'atelier' ? 'stacked' : 'classic',
    secondaryImage,
  } = section.data

  const accentColor = getAccentColor(section.appearance)
  const sectionTextColor = section.appearance?.textColor || '#111827'
  const sanitizedContent = sanitizeHtml(content)
  const isEditorial = layout === 'editorial'
  const isImageLeft = imagePosition === 'left'
  const isStory = variant === 'story' || variant === 'atelier'
  const isCredentials = variant === 'credentials'

  const statsElement = stats.length > 0 && (
    <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {stats.map(stat => (
        <div
          key={`${stat.value}-${stat.label}`}
          className="border-t pt-4"
          style={{ borderColor: `${accentColor}55` }}
        >
          <strong
            className="block text-2xl leading-none sm:text-3xl"
            style={{ fontFamily: 'var(--theme-font-heading)' }}
          >
            {stat.value}
          </strong>
          <span className="mt-2 block text-xs font-semibold uppercase tracking-[0.14em] opacity-60">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  )

  const quoteElement = quote && (
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
  )

  const highlightsElement = highlights.length > 0 && (
    <div className={cn('mt-8 grid gap-x-6', isCredentials ? 'sm:grid-cols-1' : 'sm:grid-cols-2')}>
      {highlights.map((highlight, index) => (
        <div
          key={`${highlight}-${index}`}
          className="flex items-start gap-3 border-t py-4 text-sm font-semibold"
          style={{ borderColor: `${accentColor}55` }}
        >
          <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accentColor }} />
          <span>{highlight}</span>
        </div>
      ))}
    </div>
  )

  if (layout === 'centered') {
    return (
      <section
        id={section.id}
        className={cn('relative isolate overflow-hidden', getSectionSpacing(section.appearance))}
        style={getSectionStyle(section.appearance, '#FFFFFF', '#111827')}
      >
        <div
          className="absolute left-1/2 top-1/2 -z-10 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{ backgroundColor: `${accentColor}18` }}
          aria-hidden="true"
        />
        <div
          className={cn(
            'mx-auto px-4 text-center sm:px-6 lg:px-8',
            getContentWidth({
              ...section.appearance,
              contentWidth: section.appearance?.contentWidth || 'narrow',
            })
          )}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {eyebrow && (
              <p
                className="mb-4 text-xs font-semibold uppercase tracking-[0.25em]"
                style={{ color: accentColor }}
              >
                {eyebrow}
              </p>
            )}
            <h2
              className="mb-8 text-4xl font-bold leading-[0.98] tracking-[-0.035em] sm:text-6xl md:text-7xl"
              style={{ fontFamily: 'var(--theme-font-heading)', color: sectionTextColor }}
            >
              {title}
            </h2>
            <div
              className="prose prose-lg mx-auto max-w-3xl text-left theme-body-text"
              style={{ fontFamily: 'var(--theme-font-body)', color: sectionTextColor }}
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
            <div className="mx-auto max-w-3xl text-left">
              {quoteElement}
              {statsElement}
              {highlightsElement}
            </div>
          </motion.div>

          {image && (
            <div
              className="relative mt-14 aspect-[16/9] overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.18)]"
              style={{ borderRadius: 'calc(var(--theme-radius) + 1rem)' }}
            >
              <Image
                src={image}
                alt={title}
                fill
                sizes="(min-width: 1024px) 1000px, 100vw"
                className="object-cover"
              />
            </div>
          )}
        </div>
      </section>
    )
  }

  return (
    <section
      id={section.id}
      className={cn('relative isolate overflow-hidden', getSectionSpacing(section.appearance))}
      style={getSectionStyle(section.appearance, isEditorial ? '#FBF8F3' : '#FFFFFF', '#111827')}
    >
      <div
        className="absolute -left-44 bottom-[-14rem] -z-10 h-[30rem] w-[30rem] rounded-full blur-3xl"
        style={{ backgroundColor: `${accentColor}18` }}
        aria-hidden="true"
      />

      <div className={cn('mx-auto px-4 sm:px-6 lg:px-8', getContentWidth(section.appearance))}>
        <div
          className={cn(
            'grid items-center gap-12 md:grid-cols-2 lg:gap-20',
            isEditorial && 'md:grid-cols-[minmax(0,1.02fr)_minmax(360px,0.98fr)]',
            isStory && 'md:items-start'
          )}
        >
          <motion.div
            initial={{ opacity: 0, x: isImageLeft ? 24 : -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
            className={cn(isImageLeft && 'md:order-2')}
            style={{ color: sectionTextColor }}
          >
            {eyebrow && (
              <div className="mb-5 flex items-center gap-3">
                <span
                  className="h-px w-8"
                  style={{ backgroundColor: accentColor }}
                  aria-hidden="true"
                />
                <p
                  className="text-xs font-semibold uppercase tracking-[0.25em]"
                  style={{ color: accentColor }}
                >
                  {eyebrow}
                </p>
              </div>
            )}

            <h2
              className={cn(
                'mb-7 font-bold leading-[0.98] tracking-[-0.04em]',
                isEditorial || isStory ? 'text-5xl sm:text-6xl lg:text-7xl' : 'text-3xl md:text-4xl'
              )}
              style={{ fontFamily: 'var(--theme-font-heading)' }}
            >
              {title}
            </h2>

            <div
              className="prose prose-lg max-w-none leading-relaxed theme-body-text"
              style={{ fontFamily: 'var(--theme-font-body)', color: sectionTextColor }}
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />

            {quoteElement}
            {statsElement}
            {highlightsElement}
          </motion.div>

          {image && (
            <motion.div
              initial={{ opacity: 0, x: isImageLeft ? -24 : 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65 }}
              className={cn('relative pb-10', isImageLeft && 'md:order-1')}
              style={{ color: accentColor }}
            >
              {imageTreatment === 'stacked' && (
                <div
                  className="absolute -right-5 top-7 h-[84%] w-[88%] border"
                  style={{ borderColor: accentColor }}
                  aria-hidden="true"
                />
              )}

              <div
                className={cn(
                  'relative overflow-hidden bg-black/5',
                  imageShapeClasses[imageShape],
                  imageTreatmentClasses[imageTreatment]
                )}
                style={{
                  borderRadius: imageTreatment === 'classic' ? 'var(--theme-radius)' : undefined,
                }}
              >
                <div
                  className="relative h-full w-full overflow-hidden"
                  style={{ borderRadius: 'inherit' }}
                >
                  <Image
                    src={image}
                    alt={title}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 hover:scale-[1.025]"
                  />
                </div>
              </div>

              {secondaryImage && (
                <div
                  className="absolute -bottom-2 -left-5 aspect-square w-32 overflow-hidden border-[8px] border-white shadow-2xl sm:w-40"
                  style={{ transform: variant === 'atelier' ? 'rotate(-4deg)' : undefined }}
                >
                  <Image src={secondaryImage} alt="" fill sizes="160px" className="object-cover" />
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
}
