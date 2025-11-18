'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { Logo } from '@/components/navigation'
import { Search, Home, UserPlus } from 'lucide-react'

export default function HandleNotFound() {
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
          {/* Animated Icon */}
          <motion.div
            className="relative mb-8 flex items-center justify-center"
            style={{
              x: mousePosition.x * 0.5,
              y: mousePosition.y * 0.5,
            }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="relative"
            >
              {/* Large Search Icon with glow */}
              <div className="relative">
                <motion.div
                  className="absolute inset-0 bg-white/20 rounded-full blur-2xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                <div className="relative w-32 h-32 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/20">
                  <Search className="w-16 h-16 text-white" strokeWidth={1.5} />
                </div>
              </div>
            </motion.div>

            {/* Floating elements */}
            <motion.div
              className="absolute top-0 right-0 w-12 h-12 bg-white/20 rounded-full"
              animate={{
                y: [0, -20, 0],
                x: [0, 10, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-8 h-8 bg-white/15 rounded-lg"
              animate={{
                y: [0, 15, 0],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 5,
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
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Business Page Not Found
            </h2>
            <p className="text-xl text-white/80 mb-2 max-w-md mx-auto">
              This OnPrez page doesn&apos;t exist or hasn&apos;t been published yet.
            </p>
            <p className="text-base text-white/60 mb-8 max-w-md mx-auto">
              Double-check the URL or contact the business owner.
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/">
                <Button
                  variant="primary"
                  size="lg"
                  className="min-w-[200px] bg-white text-onprez-blue hover:bg-white/90"
                >
                  <Home className="w-5 h-5 mr-2" />
                  Go to Homepage
                </Button>
              </Link>
              <Link href="/signup">
                <Button
                  variant="secondary"
                  size="lg"
                  className="min-w-[200px] bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Create Your Page
                </Button>
              </Link>
            </div>

            {/* Info box */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-12 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 max-w-lg mx-auto"
            >
              <h3 className="text-white font-semibold mb-2">Want your own OnPrez page?</h3>
              <p className="text-white/70 text-sm mb-4">
                Create your professional online presence in minutes. No coding required.
              </p>
              <Link href="/signup">
                <span className="text-white hover:underline text-sm font-medium">
                  Get started for free →
                </span>
              </Link>
            </motion.div>
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
        <p className="text-white/40 text-sm">
          Error code: 404 • Business page not found or unpublished
        </p>
      </motion.div>
    </div>
  )
}
