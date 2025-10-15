'use client'

import { motion, useAnimation } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'
import { ActivityCard } from './activity-card'
import { activities } from '@/data/activities'
import { useScrollPosition } from '@/lib/hooks/use-scroll-position'
import { useInView } from 'framer-motion'

export function SocialProofStream() {
  const [isPaused, setIsPaused] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const scrollPosition = useScrollPosition()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, amount: 0.3 })

  // Duplicate activities for seamless loop
  const duplicatedActivities = [...activities, ...activities, ...activities]

  // Calculate scroll speed multiplier based on page scroll
  const getScrollSpeedMultiplier = () => {
    // Speed increases slightly as you scroll down
    const maxScroll = 2000 // Adjust based on your page height
    const scrollRatio = Math.min(scrollPosition / maxScroll, 1)
    return 1 + scrollRatio * 0.3 // 1x to 1.3x speed
  }

  const baseDuration = 60 // Base duration in seconds
  const currentDuration = baseDuration / getScrollSpeedMultiplier()

  return (
    <section
      ref={ref}
      className="relative py-16 overflow-hidden bg-gradient-to-b from-white via-gray-50 to-white"
    >
      {/* Background Decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-onprez-blue/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-onprez-purple/5 rounded-full blur-3xl" />
      </div>

      {/* Section Header */}
      <motion.div
        className="container mx-auto px-4 mb-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Join Thousands of Professionals
        </h2>
        <p className="text-gray-600 text-lg">Real activity happening right now</p>
      </motion.div>

      {/* Marquee Container */}
      <div className="relative">
        {/* Gradient Overlays for Fade Effect */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white via-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white via-white to-transparent z-10 pointer-events-none" />

        {/* Scrolling Track */}
        <div className="flex gap-4 py-4">
          <motion.div
            className="flex gap-4"
            animate={{
              x: isPaused ? undefined : [0, -1920], // Adjust based on content width
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: 'loop',
                duration: isPaused ? 0 : currentDuration,
                ease: 'linear',
              },
            }}
            onHoverStart={() => setIsPaused(true)}
            onHoverEnd={() => {
              setIsPaused(false)
              setHoveredCard(null)
            }}
          >
            {duplicatedActivities.map((activity, index) => (
              <div
                key={`${activity.id}-${index}`}
                onMouseEnter={() => setHoveredCard(`${activity.id}-${index}`)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <ActivityCard
                  activity={activity}
                  isPaused={hoveredCard === `${activity.id}-${index}`}
                />
              </div>
            ))}
          </motion.div>
        </div>

        {/* Speed Indicator (Optional - for debugging) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded">
            Speed: {getScrollSpeedMultiplier().toFixed(2)}x
          </div>
        )}
      </div>

      {/* Bottom Text */}
      <motion.div
        className="container mx-auto px-4 mt-8 text-center"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <p className="text-sm text-gray-500">
          <span className="inline-flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-onprez-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-onprez-green"></span>
            </span>
            Live activity from professionals worldwide
          </span>
        </p>
      </motion.div>
    </section>
  )
}
