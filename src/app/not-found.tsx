'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { Logo } from '@/components/navigation'

export default function NotFound() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-onprez-blue via-onprez-purple to-onprez-blue">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Logo */}
      <div className="absolute top-8 left-8 z-10">
        <Logo variant="white" />
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-2xl mx-auto text-center">
          {/* 404 Number with parallax */}
          <motion.div
            className="relative mb-8"
            style={{
              x: mousePosition.x,
              y: mousePosition.y,
            }}
          >
            <motion.h1
              className="text-[200px] sm:text-[280px] font-bold text-white/10 leading-none select-none"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              404
            </motion.h1>

            {/* Floating elements around 404 */}
            <motion.div
              className="absolute top-1/4 left-1/4 w-16 h-16 bg-white/20 rounded-full"
              animate={{
                y: [0, -20, 0],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="absolute bottom-1/4 right-1/3 w-12 h-12 bg-white/15 rounded-lg"
              animate={{
                y: [0, 20, 0],
                rotate: [0, -180, -360],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="absolute top-1/2 right-1/4 w-8 h-8 bg-white/20"
              style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}
              animate={{
                y: [0, -15, 0],
                rotate: [0, 120, 240, 360],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>

          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative z-20"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">Page not found</h2>
            <p className="text-xl text-white/80 mb-8 max-w-md mx-auto">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/">
                <Button variant="primary" className="min-w-[200px]">
                  Go to Homepage
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="secondary"
                  className="min-w-[200px] bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Search suggestion */}
            {/* <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-12"
            >
              <p className="text-white/60 text-sm mb-4">Looking for something specific?</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {[
                  { label: 'Features', href: '/#features' },
                  { label: 'Pricing', href: '/#pricing' },
                  { label: 'Examples', href: '/#examples' },
                  { label: 'Help Center', href: '/help' },
                ].map((link, index) => (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                  >
                    <Link
                      href={link.href}
                      className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white/90 hover:bg-white/20 transition-colors text-sm border border-white/20"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div> */}
          </motion.div>

          {/* Decorative element */}
          <motion.div
            className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>
      </div>

      {/* Footer hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-0 right-0 text-center"
      >
        <p className="text-white/40 text-sm">Error code: 404 • Page not found</p>
      </motion.div>
    </div>
  )
}
