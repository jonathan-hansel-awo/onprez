'use client'

import { HeroSection as HeroSectionType } from '@/types/page-sections'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import Image from 'next/image'

interface HeroSectionProps {
  section: HeroSectionType
}

export function HeroSection({ section }: HeroSectionProps) {
  const {
    title,
    subtitle,
    ctaText,
    ctaLink,
    backgroundImage,
    alignment = 'center',
    overlay = true,
    overlayColor = '#000000',
    overlayOpacity = 50,
    overlayStyle = 'solid',
    textColor = 'light',
    customTextColor,
    textShadow = true,
  } = section.data

  // Alignment classes
  const alignmentClasses = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  }

  // Text color classes
  const textColorClass =
    textColor === 'light'
      ? 'text-white'
      : textColor === 'dark'
        ? 'text-gray-900'
        : customTextColor
          ? ''
          : 'text-white'

  // Text shadow
  const textShadowStyle = textShadow
    ? { textShadow: '0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1)' }
    : {}

  // Overlay gradient styles
  const getOverlayStyle = () => {
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
          background: `linear-gradient(135deg, ${colorWithOpacity} 0%, transparent 100%)`,
        }
      case 'solid':
      default:
        return {
          backgroundColor: colorWithOpacity,
        }
    }
  }

  return (
    <section
      id={section.id}
      className="relative min-h-[600px] flex items-center justify-center overflow-hidden"
    >
      {/* Background Image */}
      {backgroundImage && (
        <div className="absolute inset-0 z-0">
          <Image src={backgroundImage} alt="" fill className="w-full h-full object-cover" />
        </div>
      )}

      {/* Overlay */}
      {overlay && <div className="absolute inset-0 z-10" style={getOverlayStyle()} />}

      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className={cn('flex flex-col gap-6 max-w-4xl mx-auto', alignmentClasses[alignment])}
        >
          {/* Title */}
          <h1
            className={cn(
              'text-4xl sm:text-5xl md:text-6xl font-bold leading-tight',
              textColorClass
            )}
            style={{
              ...textShadowStyle,
              ...(textColor === 'custom' && customTextColor ? { color: customTextColor } : {}),
            }}
          >
            {title}
          </h1>

          {/* Subtitle */}
          {subtitle && (
            <p
              className={cn(
                'text-lg sm:text-xl md:text-2xl max-w-2xl',
                textColorClass,
                textColor === 'light' ? 'text-white/90' : 'text-gray-600'
              )}
              style={{
                ...textShadowStyle,
                ...(textColor === 'custom' && customTextColor
                  ? { color: customTextColor, opacity: 0.9 }
                  : {}),
              }}
            >
              {subtitle}
            </p>
          )}

          {/* CTA Button */}
          {ctaText && ctaLink && (
            <motion.a href={ctaLink} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <button
                className="theme-button-primary inline-flex items-center gap-2 px-6 py-3 font-semibold text-lg"
                style={{
                  fontFamily: 'var(--theme-font-body)',
                }}
              >
                {ctaText} <ArrowRight className="w-5 h-5" />
              </button>
            </motion.a>
          )}
        </motion.div>
      </div>
    </section>
  )
}
