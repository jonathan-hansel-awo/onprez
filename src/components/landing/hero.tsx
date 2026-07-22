'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { AnimatedHeadline } from './animated-headline'
import { GradientMesh } from './gradient-mesh'
import { BrowserMockup } from './browser-mockup'
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'
import { HeroMobile } from './hero-mobile'
import { useRouter } from 'next/navigation'
import { homepagePositioning } from './homepage-positioning'

export function Hero() {
  const ref = useRef(null)
  const router = useRouter()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })

  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0])
  const contentScale = useTransform(scrollYProgress, [0, 1], [1, 1.05])
  const mockupY = useTransform(scrollYProgress, [0, 1], ['0%', '20%'])
  const mockupOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.9, 0.3])

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
            className="space-y-7 text-center lg:text-left"
            style={{ y: contentY, opacity: contentOpacity, scale: contentScale }}
          >
            <motion.p
              className="mx-auto inline-flex items-center rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-sm font-semibold text-blue-800 shadow-sm backdrop-blur lg:mx-0"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {homepagePositioning.badge}
            </motion.p>

            <AnimatedHeadline
              lines={homepagePositioning.headlineLines}
              className="text-4xl text-gray-900 sm:text-5xl lg:text-6xl"
            />

            <motion.div
              className="mx-auto max-w-2xl space-y-3 lg:mx-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <p className="text-lg font-medium leading-8 text-gray-700 sm:text-xl">
                {homepagePositioning.summary}
              </p>
              <p className="text-sm leading-6 text-gray-600 sm:text-base">
                {homepagePositioning.audience}
              </p>
            </motion.div>

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
                  {homepagePositioning.primaryCta}
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
                {homepagePositioning.secondaryCta}
                <Sparkles className="ml-2 h-4 w-4 transition-transform group-hover:rotate-12" />
              </Button>
            </motion.div>

            <motion.div
              className="grid gap-3 border-t border-gray-200 pt-6 sm:grid-cols-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3, duration: 0.6 }}
            >
              {homepagePositioning.outcomes.map(outcome => (
                <div
                  key={outcome.title}
                  className="rounded-2xl border border-white/80 bg-white/70 p-4 text-left shadow-sm backdrop-blur"
                >
                  <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-600" aria-hidden="true" />
                  <p className="font-semibold text-gray-900">{outcome.title}</p>
                  <p className="mt-1 text-sm leading-5 text-gray-600">{outcome.description}</p>
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
        <motion.a
          href="#real-world-flow"
          className="group flex flex-col items-center gap-2 text-gray-400"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-xs font-medium transition-colors group-hover:text-gray-600">
            See what clients experience
          </span>
          <svg
            className="h-6 w-6 transition-colors group-hover:text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </motion.a>
      </motion.div>
    </section>
  )
}
