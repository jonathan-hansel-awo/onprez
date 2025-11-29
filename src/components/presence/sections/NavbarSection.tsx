'use client'

import { NavbarSection as NavbarSectionType } from '@/types/page-sections'
import { useState, useEffect } from 'react'
import { Menu, X, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

interface NavbarSectionProps {
  section: NavbarSectionType
  businessName?: string
}

export function NavbarSection({ section, businessName }: NavbarSectionProps) {
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
  } = section.data

  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Handle scroll for transparent navbar
  useEffect(() => {
    if (style !== 'transparent') return

    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [style])

  // Determine text color class
  const getTextColorClass = () => {
    if (style === 'transparent' && !scrolled) {
      return textColor === 'light' ? 'text-white' : 'text-gray-900'
    }
    return textColor === 'light' ? 'text-white' : 'text-gray-900'
  }

  // Determine background style
  const getBackgroundStyle = () => {
    if (style === 'transparent' && !scrolled) {
      return { backgroundColor: 'transparent' }
    }

    if (backgroundColor) {
      return { backgroundColor }
    }

    if (style === 'gradient') {
      return {
        background:
          'linear-gradient(135deg, var(--theme-primary, #3b82f6) 0%, var(--theme-secondary, #8b5cf6) 100%)',
      }
    }

    return { backgroundColor: '#ffffff' }
  }

  const displayLogoText = logoText || businessName || 'Business'

  return (
    <nav
      id={section.id}
      className={cn(
        'w-full z-50 transition-all duration-300',
        position === 'fixed' && 'fixed top-0 left-0 right-0',
        position === 'sticky' && 'sticky top-0',
        position === 'static' && 'relative',
        style === 'transparent' && scrolled && 'shadow-md',
        style !== 'transparent' && 'shadow-sm'
      )}
      style={getBackgroundStyle()}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo Area */}
          <div className="flex items-center gap-3">
            {showLogo && logo && (
              <div className="relative w-10 h-10 md:w-12 md:h-12 flex-shrink-0">
                <Image src={logo} alt={displayLogoText} fill className="object-contain" />
              </div>
            )}
            {showLogoText && (
              <span
                className={cn('font-bold text-lg md:text-xl', getTextColorClass())}
                style={{ fontFamily: 'var(--theme-font-heading, inherit)' }}
              >
                {displayLogoText}
              </span>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {links.map(link => (
              <a
                key={link.id}
                href={link.href}
                target={link.isExternal ? '_blank' : undefined}
                rel={link.isExternal ? 'noopener noreferrer' : undefined}
                className={cn(
                  'text-sm font-medium transition-colors hover:opacity-80 flex items-center gap-1',
                  getTextColorClass()
                )}
                style={{ fontFamily: 'var(--theme-font-body, inherit)' }}
              >
                {link.label}
                {link.isExternal && <ExternalLink className="w-3 h-3" />}
              </a>
            ))}

            {showCta && ctaText && ctaLink && (
              <a
                href={ctaLink}
                className="px-5 py-2.5 rounded-lg theme-button-primary font-semibold text-sm transition-all hover:scale-105"
                style={{
                  borderRadius: 'var(--theme-radius, 0.5rem)',
                  fontFamily: 'var(--theme-font-body, inherit)',
                }}
              >
                {ctaText}
              </a>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn('md:hidden p-2 rounded-lg theme-button-primary', getTextColorClass())}
            aria-label="Toggle menu"
            style={{
              fontFamily: 'var(--theme-font-body)',
            }}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-gray-200/20 bg-white"
          >
            <div className="container mx-auto px-4 py-4 space-y-3">
              {links.map(link => (
                <a
                  key={link.id}
                  href={link.href}
                  target={link.isExternal ? '_blank' : undefined}
                  rel={link.isExternal ? 'noopener noreferrer' : undefined}
                  onClick={() => setIsOpen(false)}
                  className="block py-2 text-gray-900 font-medium hover:text-gray-600 transition-colors"
                >
                  {link.label}
                  {link.isExternal && <ExternalLink className="w-3 h-3 inline-block ml-1" />}
                </a>
              ))}

              {showCta && ctaText && ctaLink && (
                <a
                  href={ctaLink}
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center px-5 py-3 rounded-lg font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors mt-4"
                >
                  {ctaText}
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
