'use client'

import { TestimonialsSection as TestimonialsSectionType } from '@/types/page-sections'
import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils/cn'
import {
  getAccentColor,
  getContentWidth,
  getSectionSpacing,
  getSectionStyle,
} from './section-style'

interface TestimonialsSectionProps {
  section: TestimonialsSectionType
}

function Rating({ rating, size = 'small' }: { rating?: number; size?: 'small' | 'large' }) {
  if (!rating) return null

  return (
    <div className="flex gap-1" aria-label={`${rating} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map(index => (
        <Star
          key={index}
          className={cn(
            size === 'large' ? 'h-5 w-5' : 'h-4 w-4',
            index < rating ? 'fill-amber-400 text-amber-400' : 'text-current opacity-20'
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

export function TestimonialsSection({ section }: TestimonialsSectionProps) {
  const {
    title,
    eyebrow,
    testimonials,
    layout = 'carousel',
    showRatings = true,
  } = section.data
  const [activeIndex, setActiveIndex] = useState(0)
  const accentColor = getAccentColor(section.appearance)

  if (testimonials.length === 0) return null

  const safeActiveIndex = Math.min(activeIndex, testimonials.length - 1)

  const reviewsSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    review: testimonials.map(testimonial => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: testimonial.name,
      },
      reviewRating:
        showRatings && testimonial.rating
          ? {
              '@type': 'Rating',
              ratingValue: testimonial.rating,
              bestRating: 5,
            }
          : undefined,
      reviewBody: testimonial.content,
    })),
  }

  const heading = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn('mb-12', layout === 'editorial' ? 'text-left' : 'text-center')}
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
          'font-bold leading-[1.02] tracking-[-0.025em] theme-heading',
          layout === 'editorial' ? 'text-5xl sm:text-6xl lg:text-7xl' : 'text-3xl md:text-4xl'
        )}
        style={{ fontFamily: 'var(--theme-font-heading)', color: 'inherit' }}
      >
        {title}
      </h2>
    </motion.div>
  )

  if (layout === 'editorial') {
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewsSchema) }}
        />
        <section
          id={section.id}
          className={getSectionSpacing(section.appearance)}
          style={getSectionStyle(section.appearance, '#181411', '#F8F1E7')}
        >
          <div
            className={cn(
              'mx-auto px-4 sm:px-6 lg:px-8',
              getContentWidth(section.appearance)
            )}
          >
            {heading}

            <div className="grid gap-5 lg:grid-cols-12">
              {testimonials.map((testimonial, index) => (
                <motion.article
                  key={testimonial.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(index * 0.08, 0.3) }}
                  className={cn(
                    'relative border border-current/20 p-6 sm:p-8',
                    index === 0 ? 'lg:col-span-7 lg:row-span-2 lg:p-12' : 'lg:col-span-5'
                  )}
                >
                  <Quote
                    className={cn('mb-6 opacity-30', index === 0 ? 'h-14 w-14' : 'h-9 w-9')}
                    style={{ color: accentColor }}
                    aria-hidden="true"
                  />

                  <blockquote
                    className={cn(
                      'font-medium leading-relaxed',
                      index === 0 ? 'text-2xl sm:text-3xl lg:text-4xl' : 'text-lg sm:text-xl'
                    )}
                    style={{ fontFamily: 'var(--theme-font-heading)' }}
                  >
                    “{testimonial.content}”
                  </blockquote>

                  <footer className="mt-8 flex items-center gap-4 border-t border-current/20 pt-5">
                    {testimonial.image && (
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
                        <Image
                          src={testimonial.image}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{testimonial.name}</p>
                      {testimonial.role && <p className="text-sm opacity-65">{testimonial.role}</p>}
                    </div>
                    {showRatings && <Rating rating={testimonial.rating} />}
                  </footer>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewsSchema) }}
      />
      <section
        id={section.id}
        className={getSectionSpacing(section.appearance)}
        style={getSectionStyle(section.appearance, '#F8FAFC', '#111827')}
      >
        <div
          className={cn(
            'mx-auto px-4 sm:px-6 lg:px-8',
            getContentWidth(section.appearance)
          )}
        >
          {heading}

          {layout === 'carousel' ? (
            <div className="mx-auto max-w-4xl">
              <div className="relative">
                <motion.article
                  key={safeActiveIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-2xl bg-white p-8 text-gray-900 shadow-xl md:p-12"
                >
                  <Quote className="mb-6 h-12 w-12 opacity-20" style={{ color: accentColor }} />
                  <blockquote className="mb-8 text-lg italic leading-relaxed md:text-xl">
                    “{testimonials[safeActiveIndex].content}”
                  </blockquote>

                  <footer className="flex flex-wrap items-center gap-4">
                    {testimonials[safeActiveIndex].image && (
                      <div className="relative h-16 w-16 overflow-hidden rounded-full">
                        <Image
                          src={testimonials[safeActiveIndex].image}
                          alt=""
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{testimonials[safeActiveIndex].name}</p>
                      {testimonials[safeActiveIndex].role && (
                        <p className="text-sm text-gray-600">{testimonials[safeActiveIndex].role}</p>
                      )}
                      {showRatings && (
                        <div className="mt-2">
                          <Rating rating={testimonials[safeActiveIndex].rating} size="large" />
                        </div>
                      )}
                    </div>
                  </footer>
                </motion.article>

                {testimonials.length > 1 && (
                  <div className="mt-8 flex justify-center gap-2">
                    {testimonials.map((testimonial, index) => (
                      <button
                        key={testimonial.id}
                        onClick={() => setActiveIndex(index)}
                        className={cn(
                          'h-3 rounded-full transition-all',
                          index === safeActiveIndex ? 'w-8' : 'w-3 bg-black/20'
                        )}
                        style={index === safeActiveIndex ? { backgroundColor: accentColor } : undefined}
                        aria-label={`Show testimonial from ${testimonial.name}`}
                        aria-current={index === safeActiveIndex}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <motion.article
                  key={testimonial.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(index * 0.08, 0.3) }}
                  className="rounded-xl bg-white p-6 text-gray-900 shadow-lg"
                >
                  <Quote className="mb-4 h-8 w-8 opacity-20" style={{ color: accentColor }} />
                  <blockquote className="mb-6 italic leading-relaxed">“{testimonial.content}”</blockquote>
                  <footer className="flex items-center gap-3">
                    {testimonial.image && (
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
                        <Image
                          src={testimonial.image}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{testimonial.name}</p>
                      {testimonial.role && <p className="text-sm text-gray-600">{testimonial.role}</p>}
                      {showRatings && (
                        <div className="mt-1">
                          <Rating rating={testimonial.rating} />
                        </div>
                      )}
                    </div>
                  </footer>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
