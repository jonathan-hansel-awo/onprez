'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef, useState } from 'react'
import { ChaoticWindow } from './chaotic-window'
import { CleanPresenceMockup } from './clean-presence-mockup'
import { X } from 'lucide-react'

export function ProblemSolutionSplit() {
  const ref = useRef(null)
  const [isHoveringLeft, setIsHoveringLeft] = useState(false)
  const [isHoveringRight, setIsHoveringRight] = useState(false)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  // Different parallax speeds for each side
  const leftY = useTransform(scrollYProgress, [0, 1], ['0%', '20%'])
  const rightY = useTransform(scrollYProgress, [0, 1], ['0%', '15%'])

  return (
    <section ref={ref} className="relative py-32 overflow-hidden bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Stop Juggling. Start Growing.
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Compare the chaos of managing multiple tools vs. the simplicity of OnPrez
          </p>
        </motion.div>

        {/* Split Screen Container */}
        <div className="relative grid md:grid-cols-2 gap-8 md:gap-0 min-h-[600px]">
          {/* Dividing Line with Energy Effect */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 z-20">
            {/* Static line */}
            <div className="absolute inset-8 flex items-center justify-center bgabsolute gradient-to-b from-red-500/50 via-yellow-500/50 to-green-500/50" />

            {/* Energy particles */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{ left: '-1px' }}
                animate={{
                  y: ['0%', '100%'],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: 'linear',
                }}
              />
            ))}

            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 blur-md bg-gradient-to-b from-red-500/30 via-yellow-500/30 to-green-500/30"
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>

          {/* Left Side - Problem (Chaos) */}
          <motion.div
            className="relative md:pr-8"
            style={{ y: leftY }}
            onHoverStart={() => setIsHoveringLeft(true)}
            onHoverEnd={() => setIsHoveringLeft(false)}
          >
            {/* Dark background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl -z-10" />

            {/* Content */}
            <div className="relative min-h-[500px] p-8">
              {/* Title */}
              <motion.div
                className="mb-8 text-center md:text-left"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Managing Your Online Presence
                </h3>
                <p className="text-gray-400">...shouldn&apos;t feel like this</p>
              </motion.div>

              {/* Chaotic Windows */}
              <div className="relative h-80 md:h-96">
                {/* Position windows in chaotic arrangement */}
                <div className="absolute top-0 left-0">
                  <ChaoticWindow type="social media" delay={0.2} />
                </div>
                <div className="absolute top-8 right-36">
                  <ChaoticWindow type="calendar" delay={0.4} />
                </div>
                <div className="absolute bottom-32 left-8">
                  <ChaoticWindow type="spreadsheet" delay={0.6} />
                </div>
                <div className="absolute bottom-36 right-24">
                  <ChaoticWindow type="website" delay={0.8} />
                </div>

                {/* X marks and frustrated annotations */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1.2, type: 'spring' }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                  <div className="relative">
                    <X className="w-24 h-24 text-red-500" strokeWidth={3} />
                    <motion.div
                      className="absolute inset-0"
                      animate={
                        isHoveringLeft
                          ? {
                              rotate: [0, -10, 10, -10, 10, 0],
                              scale: [1, 1.1, 1],
                            }
                          : {}
                      }
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </motion.div>

                {/* Frustrated labels */}
                {[
                  { text: 'Too many logins', top: '10%', left: '5%' },
                  { text: 'Lost bookings', top: '70%', right: '10%' },
                  { text: 'Confused clients', bottom: '5%', left: '15%' },
                ].map((label, i) => (
                  <motion.div
                    key={i}
                    className="absolute bg-red-500/90 text-white text-xs px-2 py-1 rounded font-semibold"
                    style={{ ...label }}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1.4 + i * 0.1, type: 'spring' }}
                    animate={
                      isHoveringLeft
                        ? {
                            y: [0, -5, 0],
                          }
                        : {}
                    }
                    // transition={{ duration: 0.5, repeat: isHoveringLeft ? Infinity : 0 }}
                  >
                    {label.text}
                  </motion.div>
                ))}
              </div>

              {/* Bottom stats */}
              <motion.div
                className="grid grid-cols-3 gap-4 mt-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 1.6 }}
              >
                {[
                  { value: '5+', label: 'Tools needed' },
                  { value: 'Hours', label: 'Wasted weekly' },
                  { value: 'Lost', label: 'Opportunities' },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl font-bold text-red-400">{stat.value}</div>
                    <div className="text-xs text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>

          {/* Right Side - Solution (Clean) */}
          <motion.div
            className="relative md:pl-8 ml-8"
            style={{ y: rightY }}
            onHoverStart={() => setIsHoveringRight(true)}
            onHoverEnd={() => setIsHoveringRight(false)}
          >
            {/* Light background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl -z-10" />

            {/* Content */}
            <div className="relative min-h-[500px] p-8">
              {/* Title */}
              <motion.div
                className="mb-8 text-center md:text-left"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  Everything In One Place
                </h3>
                <p className="text-gray-600">Beautifully simple</p>
              </motion.div>

              {/* Clean Mockup */}
              <div className="flex items-center justify-center h-80 md:h-96">
                <CleanPresenceMockup />
              </div>

              {/* Bottom stats */}
              <motion.div
                className="grid grid-cols-3 gap-4 mt-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 1.0 }}
              >
                {[
                  { value: '1', label: 'Simple tool' },
                  { value: '15min', label: 'To set up' },
                  { value: 'More', label: 'Bookings' },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl font-bold text-onprez-green">{stat.value}</div>
                    <div className="text-xs text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </motion.div>

              {/* Checkmarks highlighting benefits */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 1.2, type: 'spring' }}
                animate={
                  isHoveringRight
                    ? {
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                      }
                    : {}
                }
              >
                <div className="w-20 h-20 bg-onprez-green rounded-full flex items-center justify-center shadow-2xl">
                  <svg
                    className="w-12 h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-28"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-gray-600 mb-4">
            Join thousands who&apos;ve simplified their online presence
          </p>
          <motion.button
            className="bg-gradient-to-r from-onprez-blue to-onprez-purple text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg"
            whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
            whileTap={{ scale: 0.98 }}
          >
            Get Started Free
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}
