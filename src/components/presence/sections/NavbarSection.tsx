'use client'

import { NavbarSection as NavbarSectionType } from '@/types/page-sections'
import { useState, useEffect } from 'react'
import { Menu, X, ExternalLink, ArrowUpRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { cn } from '@/lib/utils/cn'

interface NavbarSectionProps {
  section: NavbarSectionType
  businessName?: string
  bookingHref?: string
}

export function NavbarSection({ section, businessName, bookingHref }: NavbarSectionProps) {
  const {
    logo,
    logoText,
    showLogo = true,
    showLogoText = true,
    links = [],
    ctaText,
    ctaLink,
    showCta = true,
    style = 'solid',
    position = 'sticky',
    backgroundColor,
    textColor = 'dark',
    variant = 'standard',
    showDivider = true,
    monogram,
    announcement,
  } = section.data

  const isBookingCta =
    /book|appointment|availability/i.test(ctaText || '') ||
    ctaLink === '#contact' ||
    ctaLink === '#services'
  const resolvedCtaLink = bookingHref && isBookingCta ? bookingHref : ctaLink
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const displayLogoText = logoText || businessName || 'Business'
  const resolvedMonogram = monogram || displayLogoText.slice(0, 1).toUpperCase()
  const foreground = textColor === 'light' ? '#FFFFFF' : '#111827'
  const isFloating = variant === 'floating'
  const isEditorial = variant === 'editorial'

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 28)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  function getBackgroundStyle() {
    if (style === 'transparent' && !scrolled) return { backgroundColor: 'transparent' }
    if (style === 'gradient') {
      return {
        background:
          'linear-gradient(135deg, var(--theme-primary, #3b82f6) 0%, var(--theme-secondary, #8b5cf6) 100%)',
      }
    }
    return { backgroundColor: backgroundColor || '#ffffff' }
  }

  const shellStyle = isFloating
    ? {
        background: `color-mix(in srgb, ${backgroundColor || '#ffffff'} 88%, transparent)`,
        color: foreground,
      }
    : { ...getBackgroundStyle(), color: foreground }

  return (
    <nav
      id={section.id}
      className={cn(
        'z-50 w-full transition-all duration-300',
        position === 'fixed' && 'fixed inset-x-0 top-0',
        position === 'sticky' && 'sticky top-0',
        position === 'static' && 'relative',
        isFloating && 'px-3 pt-3 sm:px-5',
        !isFloating && scrolled && 'shadow-sm'
      )}
      style={!isFloating ? getBackgroundStyle() : undefined}
    >
      {announcement && !scrolled && (
        <div
          className="hidden border-b border-current/10 px-4 py-2 text-center text-[0.68rem] font-semibold uppercase tracking-[0.2em] md:block"
          style={{ color: foreground, backgroundColor: backgroundColor || '#ffffff' }}
        >
          {announcement}
        </div>
      )}

      <div
        className={cn(
          'mx-auto max-w-[90rem] transition-all duration-300',
          isFloating &&
            'border border-current/10 shadow-[0_18px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl',
          isFloating && (scrolled ? 'rounded-2xl' : 'rounded-[1.5rem]'),
          !isFloating && showDivider && 'border-b border-current/10'
        )}
        style={shellStyle}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div
            className={cn(
              'flex items-center justify-between',
              isEditorial ? 'h-20 md:h-24' : 'h-16 md:h-20'
            )}
          >
            <a
              href="#"
              className="flex min-w-0 items-center gap-3"
              aria-label={`${displayLogoText} home`}
            >
              {showLogo && logo ? (
                <div className="relative h-10 w-10 shrink-0 md:h-12 md:w-12">
                  <Image src={logo} alt={displayLogoText} fill className="object-contain" />
                </div>
              ) : showLogo ? (
                <span
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center border border-current/20 text-sm font-bold',
                    isEditorial ? 'rounded-none' : 'rounded-full'
                  )}
                  style={{ fontFamily: 'var(--theme-font-heading)' }}
                  aria-hidden="true"
                >
                  {resolvedMonogram}
                </span>
              ) : null}

              {showLogoText && (
                <span
                  className={cn(
                    'truncate font-bold tracking-[-0.025em]',
                    isEditorial
                      ? 'text-xl uppercase tracking-[0.08em] md:text-2xl'
                      : 'text-lg md:text-xl'
                  )}
                  style={{ fontFamily: 'var(--theme-font-heading)' }}
                >
                  {displayLogoText}
                </span>
              )}
            </a>

            <div className="hidden items-center gap-7 md:flex lg:gap-9">
              {links.map(link => (
                <a
                  key={link.id}
                  href={link.href}
                  target={link.isExternal ? '_blank' : undefined}
                  rel={link.isExternal ? 'noopener noreferrer' : undefined}
                  className="group flex items-center gap-1 text-sm font-medium opacity-75 transition-opacity hover:opacity-100"
                  style={{ fontFamily: 'var(--theme-font-body)' }}
                >
                  <span className="relative">
                    {link.label}
                    <span className="absolute inset-x-0 -bottom-1 h-px origin-left scale-x-0 bg-current transition-transform group-hover:scale-x-100" />
                  </span>
                  {link.isExternal && <ExternalLink className="h-3 w-3" />}
                </a>
              ))}

              {showCta && ctaText && resolvedCtaLink && (
                <motion.a
                  href={resolvedCtaLink}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="theme-button-primary inline-flex min-h-11 items-center gap-2 px-5 py-2.5 text-sm font-semibold shadow-[0_10px_30px_rgba(0,0,0,0.13)]"
                >
                  {ctaText}
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </motion.a>
              )}
            </div>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-current/15 md:hidden"
              aria-label="Toggle menu"
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden border-t border-current/10 md:hidden"
            >
              <div className="space-y-1 px-4 py-5 sm:px-6">
                {links.map(link => (
                  <a
                    key={link.id}
                    href={link.href}
                    target={link.isExternal ? '_blank' : undefined}
                    rel={link.isExternal ? 'noopener noreferrer' : undefined}
                    onClick={() => setIsOpen(false)}
                    className="flex min-h-11 items-center justify-between border-b border-current/10 py-3 font-medium last:border-b-0"
                  >
                    {link.label}
                    {link.isExternal && <ExternalLink className="h-4 w-4" />}
                  </a>
                ))}

                {showCta && ctaText && resolvedCtaLink && (
                  <a
                    href={resolvedCtaLink}
                    onClick={() => setIsOpen(false)}
                    className="theme-button-primary mt-4 flex min-h-12 w-full items-center justify-center gap-2 px-5 py-3 font-semibold"
                  >
                    {ctaText}
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}
