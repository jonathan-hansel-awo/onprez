'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { AvatarStack } from '@/components/ui/avatar-stack'
import { AnimatedHeadline } from './animated-headline'
import { GradientMesh } from './gradient-mesh'
import { BrowserMockup } from './browser-mockup'
import { heroAvatars } from '@/data/avatars'
import { ArrowRight, Sparkles } from 'lucide-react'
import { HeroMobile } from './hero-mobile'
import { useRouter } from 'next/navigation'

export function Hero() {
  const ref = useRef(null)
  const router = useRouter()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })

  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0])
  const contentScale = useTransform(scrollYProgress, [0, 1], [1, 1.1])
  const mockupY = useTransform(scrollYProgress, [0, 1], ['0%', '20%'])
  const mockupOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.9, 0.3])
  const headlineLines = ['Your Handle.', 'Your Brand.', 'Your Bookings.']

  return (
    <section
      ref={ref}
      id="hero"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-white"
    >
      <div className="absolute inset-0 -z-10">
        <GradientMesh />
      </div>
      <div className="container mx-auto px-4 pb-20 pt-32">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            className="space-y-8 text-center lg:text-left"
            style={{ y: contentY, opacity: contentOpacity, scale: contentScale }}
          >
            <AnimatedHeadline
              lines={headlineLines}
              className="text-5xl text-gray-900 sm:text-6xl lg:text-7xl"
            />
            <motion.p
              className="mx-auto max-w-2xl text-lg text-gray-600 sm:text-xl lg:mx-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              Create your complete online presence in 10 minutes. No website needed.
            </motion.p>
            <motion.div
              className="flex flex-col justify-center gap-4 sm:flex-row lg:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
            >
              <Button
                variant="primary"
                size="lg"
                className="group relative overflow-hidden"
                onClick={() => router.push('/signup')}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Claim Your Handle Free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: 'easeInOut',
                  }}
                />
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="group"
                onClick={() => router.push('/examples')}
              >
                See Live Examples
                <Sparkles className="ml-2 h-4 w-4 transition-transform group-hover:rotate-12" />
              </Button>
            </motion.div>
            <motion.div
              className="flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3, duration: 0.6 }}
            >
              <AvatarStack avatars={heroAvatars} max={5} size="md" />
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">Join 2,500+ professionals</p>
                <div className="mt-1 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <motion.svg
                      key={i}
                      className="h-4 w-4 fill-current text-yellow-400"
                      viewBox="0 0 20 20"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.5 + i * 0.1 }}
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </motion.svg>
                  ))}
                  <span className="ml-2 text-xs text-gray-600">4.9/5</span>
                </div>
              </div>
            </motion.div>
            <motion.div
              className="grid grid-cols-3 gap-8 border-t border-gray-200 pt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6, duration: 0.6 }}
            >
              {[
                ['15min', 'To go live'],
                ['45K+', 'Bookings/month'],
                ['Free', 'Forever'],
              ].map(([value, label], index) => (
                <div key={label} className="text-center lg:text-left">
                  <motion.div
                    className="text-3xl font-bold text-gray-900"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.8 + index * 0.1, type: 'spring' }}
                  >
                    {value}
                  </motion.div>
                  <div className="mt-1 text-sm text-gray-600">{label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            className="relative hidden lg:block"
            style={{ y: mockupY, opacity: mockupOpacity }}
            initial={{ opacity: 0, scale: 0.8, rotateY: -20 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ delay: 0.5, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <BrowserMockup />
            <HeroMobile />
          </motion.div>
        </div>
      </div>

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        style={{ opacity: contentOpacity }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.2, duration: 0.6 }}
      >
        <motion.div
          className="group flex cursor-pointer flex-col items-center gap-2 text-gray-400"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-xs font-medium transition-colors group-hover:text-gray-600">
            Scroll to explore
          </span>
          <svg
            className="h-6 w-6 transition-colors group-hover:text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  )
}
