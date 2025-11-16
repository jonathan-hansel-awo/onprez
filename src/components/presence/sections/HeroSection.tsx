'use client'

import { HeroSection as HeroSectionType } from '@/types/page-sections'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

interface HeroSectionProps {
  section: HeroSectionType
}

export function HeroSection({ section }: HeroSectionProps) {
  const { title, subtitle, backgroundImage, ctaText, ctaLink, overlay, alignment } = section.data

  const alignmentClasses = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  }

  return (
    <section className="relative min-h-[500px] md:min-h-[600px] flex items-center justify-center overflow-hidden theme-section-spacing">
      {/* Background Image */}
      {backgroundImage && (
        <div className="absolute inset-0 z-0">
          <Image
            src={backgroundImage}
            alt={title}
            fill
            className="object-cover"
            priority
            quality={90}
          />
          {overlay && <div className="absolute inset-0 bg-black/50" />}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={`flex flex-col gap-6 max-w-4xl mx-auto ${alignmentClasses[alignment || 'center']}`}
        >
          <h1
            className={`text-4xl md:text-5xl lg:text-6xl font-bold theme-heading ${
              backgroundImage ? 'text-white' : ''
            }`}
            style={{
              fontFamily: backgroundImage ? undefined : 'var(--theme-font-heading)',
            }}
          >
            {title}
          </h1>

          {subtitle && (
            <p
              className={`text-lg md:text-xl lg:text-2xl theme-body-text ${
                backgroundImage ? 'text-white/90' : ''
              }`}
              style={{
                fontFamily: backgroundImage ? undefined : 'var(--theme-font-body)',
              }}
            >
              {subtitle}
            </p>
          )}

          {ctaText && ctaLink && (
            <div className="mt-4">
              <Link href={ctaLink}>
                <button
                  className="theme-button-primary px-6 py-3 font-semibold text-lg"
                  style={{
                    fontFamily: 'var(--theme-font-body)',
                  }}
                >
                  {ctaText}
                </button>
              </Link>
            </div>
          )}
        </motion.div>
      </div>

      {/* Gradient overlay at bottom */}
      {backgroundImage && (
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent z-5" />
      )}
    </section>
  )
}
