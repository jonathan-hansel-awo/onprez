'use client'

import { AboutSection as AboutSectionType } from '@/types/page-sections'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Check } from 'lucide-react'
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
  } = section.data

  const accentColor = getAccentColor(section.appearance)
  const sectionTextColor = section.appearance?.textColor || '#111827'
  const sanitizedContent = sanitizeHtml(content)

  if (layout === 'centered') {
    return (
      <section
        id={section.id}
        className={getSectionSpacing(section.appearance)}
        style={getSectionStyle(section.appearance, '#FFFFFF', '#111827')}
      >
        <div
          className={cn(
            'mx-auto px-4 text-center sm:px-6 lg:px-8',
            getContentWidth({ ...section.appearance, contentWidth: section.appearance?.contentWidth || 'narrow' })
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
              className="mb-8 text-4xl font-bold leading-tight sm:text-5xl md:text-6xl"
              style={{ fontFamily: 'var(--theme-font-heading)', color: sectionTextColor }}
            >
              {title}
            </h2>
            <div
              className="prose prose-lg mx-auto max-w-none text-left theme-body-text"
              style={{ fontFamily: 'var(--theme-font-body)', color: sectionTextColor }}
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
          </motion.div>

          {highlights.length > 0 && (
            <div className="mt-10 grid gap-3 text-left sm:grid-cols-2">
              {highlights.map((highlight, index) => (
                <div key={`${highlight}-${index}`} className="flex items-start gap-3 border-t py-4">
                  <Check className="mt-0.5 h-5 w-5 shrink-0" style={{ color: accentColor }} />
                  <span className="font-medium">{highlight}</span>
                </div>
              ))}
            </div>
          )}

          {image && (
            <div className="relative mt-12 aspect-[16/9] overflow-hidden" style={{ borderRadius: 'var(--theme-radius)' }}>
              <Image src={image} alt={title} fill sizes="(min-width: 1024px) 900px, 100vw" className="object-cover" />
            </div>
          )}
        </div>
      </section>
    )
  }

  const isEditorial = layout === 'editorial'
  const isImageLeft = imagePosition === 'left'

  return (
    <section
      id={section.id}
      className={cn('overflow-hidden', getSectionSpacing(section.appearance))}
      style={getSectionStyle(section.appearance, isEditorial ? '#FBF8F3' : '#FFFFFF', '#111827')}
    >
      <div
        className={cn(
          'mx-auto px-4 sm:px-6 lg:px-8',
          getContentWidth(section.appearance)
        )}
      >
        <div
          className={cn(
            'grid items-center gap-10 md:grid-cols-2 lg:gap-16',
            isEditorial && 'md:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]'
          )}
        >
          <motion.div
            initial={{ opacity: 0, x: isImageLeft ? 24 : -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={cn(isImageLeft && 'md:order-2')}
            style={{ color: sectionTextColor }}
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
              className={cn(
                'mb-6 font-bold leading-[1.02] tracking-[-0.025em]',
                isEditorial ? 'text-5xl sm:text-6xl lg:text-7xl' : 'text-3xl md:text-4xl'
              )}
              style={{ fontFamily: 'var(--theme-font-heading)' }}
            >
              {title}
            </h2>

            <div
              className="prose prose-lg max-w-none theme-body-text"
              style={{ fontFamily: 'var(--theme-font-body)', color: sectionTextColor }}
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />

            {highlights.length > 0 && (
              <div className="mt-8 grid gap-x-6 sm:grid-cols-2">
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
            )}
          </motion.div>

          {image && (
            <motion.div
              initial={{ opacity: 0, x: isImageLeft ? -24 : 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className={cn(
                'relative overflow-hidden bg-black/5',
                imageShapeClasses[imageShape],
                isImageLeft && 'md:order-1'
              )}
              style={{ borderRadius: isEditorial ? '0' : 'var(--theme-radius)' }}
            >
              <Image
                src={image}
                alt={title}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
              {isEditorial && (
                <div
                  className="absolute right-0 top-0 h-24 w-1/3"
                  style={{ backgroundColor: accentColor, opacity: 0.8 }}
                  aria-hidden="true"
                />
              )}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
}
