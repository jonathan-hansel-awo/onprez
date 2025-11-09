'use client'

import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { Logo } from '@/components/navigation'
import { UserMenu } from '@/components/navigation/UserMenu'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { scrollY } = useScroll()
  const { user, loading } = useAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  useMotionValueEvent(scrollY, 'change', latest => {
    setIsScrolled(latest > 50)
  })

  // Prevent scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen])

  const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#pricing', label: 'Pricing' },
    { href: '#examples', label: 'Examples' },
  ]

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled || !mounted ? 'bg-white/80 backdrop-blur-lg shadow-sm' : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Logo />

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-gray-700 hover:text-onprez-blue font-medium transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Desktop CTA Buttons / User Menu */}
            <div className="hidden md:flex items-center gap-4">
              {!loading && (
                <>
                  {user ? (
                    <UserMenu />
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="text-gray-700 hover:text-onprez-blue font-medium transition-colors"
                      >
                        Sign In
                      </Link>
                      <motion.a
                        className="bg-gradient-to-r from-onprez-blue to-onprez-purple text-white px-6 py-2 rounded-lg font-semibold shadow-lg"
                        href="/signup"
                        whileHover={{
                          scale: 1.05,
                          boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)',
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Get Started
                      </motion.a>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-700 hover:text-onprez-blue"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      {mounted && (
        <motion.div
          className="fixed inset-0 z-30 md:hidden"
          initial={{ opacity: 0, x: '100%' }}
          animate={{
            opacity: isMenuOpen ? 1 : 0,
            x: isMenuOpen ? 0 : '100%',
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          style={{ pointerEvents: isMenuOpen ? 'auto' : 'none' }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu Content */}
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-white shadow-2xl p-6">
            <nav className="flex flex-col gap-6 mt-16">
              {navLinks.map((link, index) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  className="text-gray-700 hover:text-onprez-blue font-medium text-lg"
                  onClick={() => setIsMenuOpen(false)}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {link.label}
                </motion.a>
              ))}

              <div className="pt-6 border-t border-gray-200 space-y-4">
                {user ? (
                  <>
                    <div className="px-4 py-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/account/security"
                      className="block w-full text-gray-700 hover:text-onprez-blue font-medium text-lg text-left"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Account
                    </Link>
                    <Link
                      href="/dashboard"
                      className="block w-full text-gray-700 hover:text-onprez-blue font-medium text-lg text-left"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="block w-full text-gray-700 hover:text-onprez-blue font-medium text-lg text-left"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      className="block w-full bg-gradient-to-r from-onprez-blue to-onprez-purple text-white px-6 py-3 rounded-lg font-semibold shadow-lg text-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        </motion.div>
      )}
    </>
  )
}
