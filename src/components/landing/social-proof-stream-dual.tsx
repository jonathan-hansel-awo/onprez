'use client'

import { motion } from 'framer-motion'
import { useState, useRef } from 'react'
import { ActivityCard } from './activity-card'
import { activities } from '@/data/activities'
import { useScrollPosition } from '@/lib/hooks/use-scroll-position'
import { useInView } from 'framer-motion'

export function SocialProofStreamDual() {
  const [isPausedTop, setIsPausedTop] = useState(false)
  const [isPausedBottom, setIsPausedBottom] = useState(false)
  const scrollPosition = useScrollPosition()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, amount: 0.3 })

  // Split activities into two groups
  const firstHalf = activities.slice(0, 6)
  const secondHalf = activities.slice(6, 12)

  // Duplicate for seamless loop
  const topActivities = [...firstHalf, ...firstHalf, ...firstHalf]
  const bottomActivities = [...secondHalf, ...secondHalf, ...secondHalf]

  const getScrollSpeedMultiplier = () => {
    const maxScroll = 2000
    const scrollRatio = Math.min(scrollPosition / maxScroll, 1)
    return 1 + scrollRatio * 0.3
  }

  const baseDuration = 40
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

      <div className="space-y-4">
        {/* Top Track - Left to Right */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white via-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white via-white to-transparent z-10 pointer-events-none" />

          <div className="flex gap-4 py-2">
            <motion.div
              className="flex gap-4"
              animate={{
                x: isPausedTop ? undefined : [0, -1280],
              }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: 'loop',
                  duration: isPausedTop ? 0 : currentDuration,
                  ease: 'linear',
                },
              }}
              onHoverStart={() => setIsPausedTop(true)}
              onHoverEnd={() => setIsPausedTop(false)}
            >
              {topActivities.map((activity, index) => (
                <ActivityCard
                  key={`top-${activity.id}-${index}`}
                  activity={activity}
                  isPaused={isPausedTop}
                />
              ))}
            </motion.div>
          </div>
        </div>

        {/* Bottom Track - Right to Left */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white via-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white via-white to-transparent z-10 pointer-events-none" />

          <div className="flex gap-4 py-2">
            <motion.div
              className="flex gap-4"
              animate={{
                x: isPausedBottom ? undefined : [-1280, 0],
              }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: 'loop',
                  duration: isPausedBottom ? 0 : currentDuration * 1.1,
                  ease: 'linear',
                },
              }}
              onHoverStart={() => setIsPausedBottom(true)}
              onHoverEnd={() => setIsPausedBottom(false)}
            >
              {bottomActivities.map((activity, index) => (
                <ActivityCard
                  key={`bottom-${activity.id}-${index}`}
                  activity={activity}
                  isPaused={isPausedBottom}
                />
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Live Indicator */}
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
