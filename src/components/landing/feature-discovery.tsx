'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { ClientReaction } from './client-reaction'
import { ScrollingPresencePage } from './scrolling-presence-page'
import { PhoneMockup } from './phone-mockup'
import { useInView } from 'react-intersection-observer'

type Phase = {
  scrollProgress: number
  reaction: 'neutral' | 'interested' | 'impressed' | 'nodding' | 'excited' | 'celebrating'
  caption: string
  duration: number
}

export function FeatureDiscovery() {
  const [currentPhase, setCurrentPhase] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { ref, inView } = useInView({
    threshold: 0.3,
    triggerOnce: false,
  })

  const phases: Phase[] = [
    {
      scrollProgress: 0,
      reaction: 'neutral',
      caption: 'Looking for a massage therapist...',
      duration: 1500,
    },
    {
      scrollProgress: 0.15,
      reaction: 'interested',
      caption: 'First impression matters',
      duration: 2000,
    },
    {
      scrollProgress: 0.35,
      reaction: 'impressed',
      caption: 'They explore your work',
      duration: 2000,
    },
    {
      scrollProgress: 0.5,
      reaction: 'nodding',
      caption: 'They understand your value',
      duration: 2000,
    },
    {
      scrollProgress: 0.7,
      reaction: 'excited',
      caption: 'They trust you',
      duration: 2000,
    },
    {
      scrollProgress: 0.85,
      reaction: 'excited',
      caption: 'Then they book',
      duration: 1500,
    },
    {
      scrollProgress: 1,
      reaction: 'celebrating',
      caption: 'Discovery first. Booking second.',
      duration: 2500,
    },
  ]

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    if (!inView) {
      setIsPlaying(false)
      setCurrentPhase(0)
      return
    }

    setIsPlaying(true)
  }, [inView, mounted])

  useEffect(() => {
    if (!isPlaying) return

    const timer = setTimeout(() => {
      if (currentPhase < phases.length - 1) {
        setCurrentPhase(currentPhase + 1)
      } else {
        // Reset after completion
        setTimeout(() => {
          setCurrentPhase(0)
        }, 1000)
      }
    }, phases[currentPhase].duration)

    return () => clearTimeout(timer)
  }, [currentPhase, isPlaying, phases])

  if (!mounted) {
    return null
  }

  const currentPhaseData = phases[currentPhase]

  return (
    <section
      ref={ref}
      className="py-16 md:py-32 bg-gradient-to-b from-gray-50 via-white to-gray-50"
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          className="text-center mb-8 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-3 md:mb-4">
            Discovery First
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
            Clients don&apos;t just book. They discover, they fall in love, then they book.
          </p>
        </motion.div>

        {/* Split Screen Demo */}
        <div className="grid lg:grid-cols-2 gap-6 md:gap-12 items-center max-w-5xl mx-auto">
          {/* Left Side - Phone with Scrolling Page */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.8 }}
            className="flex justify-center order-2 lg:order-1"
          >
            <div className="relative w-full flex justify-center">
              {/* Label */}
              <motion.div
                className="absolute -top-8 md:-top-10 left-1/2 -translate-x-1/2 bg-gradient-to-r from-onprez-blue to-onprez-purple text-white px-3 md:px-4 py-1 md:py-2 rounded-full text-xs md:text-sm font-semibold shadow-lg whitespace-nowrap z-20"
                initial={{ opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ delay: 0.3 }}
              >
                📱 Client&apos;s View
              </motion.div>

              <PhoneMockup>
                <ScrollingPresencePage scrollProgress={currentPhaseData.scrollProgress} />
              </PhoneMockup>
            </div>
          </motion.div>

          {/* Right Side - Client Reaction */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="order-1 lg:order-2"
          >
            <div className="relative">
              {/* Label */}
              <motion.div
                className="absolute -top-8 md:-top-10 left-1/2 -translate-x-1/2 lg:left-auto lg:right-0 lg:translate-x-0 bg-gradient-to-r from-onprez-purple to-pink-500 text-white px-3 md:px-4 py-1 md:py-2 rounded-full text-xs md:text-sm font-semibold shadow-lg whitespace-nowrap z-20"
                initial={{ opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ delay: 0.5 }}
              >
                😊 Client&apos;s Reaction
              </motion.div>

              <div className="flex items-center justify-center min-h-[300px] md:min-h-[400px] lg:min-h-[560px] mt-4 md:mt-0">
                {inView && (
                  <ClientReaction
                    reaction={currentPhaseData.reaction}
                    caption={currentPhaseData.caption}
                  />
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Phase Indicators */}
        <motion.div
          className="flex justify-center gap-1.5 md:gap-2 mt-8 md:mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.5 }}
        >
          {phases.map((_, index) => (
            <motion.div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentPhase
                  ? 'w-6 md:w-8 bg-onprez-blue'
                  : index < currentPhase
                    ? 'w-2 bg-onprez-blue/50'
                    : 'w-2 bg-gray-300'
              }`}
              animate={index === currentPhase ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          ))}
        </motion.div>

        {/* Bottom Text */}
        <motion.div
          className="text-center mt-8 md:mt-12 px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.7 }}
        >
          <p className="text-gray-600 mb-2 text-sm md:text-base">
            <strong>The journey matters:</strong> Every scroll builds trust and desire
          </p>
          <p className="text-xs md:text-sm text-gray-500">
            Beautiful galleries • Clear services • Social proof • Seamless booking
          </p>
        </motion.div>

        {/* Key Takeaway */}
        <motion.div
          className="max-w-2xl mx-auto mt-8 md:mt-12 bg-gradient-to-r from-onprez-blue/10 to-onprez-purple/10 rounded-xl md:rounded-2xl p-6 md:p-8 border border-onprez-blue/20 mx-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
          transition={{ delay: 0.9 }}
        >
          <div className="text-center">
            <p className="text-lg md:text-2xl font-bold text-gray-900 mb-2">
              Discovery First. Booking Second. Trust Always.
            </p>
            <p className="text-sm md:text-base text-gray-600">
              Your presence page tells your story before clients ever reach the booking button
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
