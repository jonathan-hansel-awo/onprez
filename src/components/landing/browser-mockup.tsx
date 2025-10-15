'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'

interface BrowserMockupProps {
  className?: string
}

export function BrowserMockup({ className }: BrowserMockupProps) {
  const [step, setStep] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [typedText, setTypedText] = useState('')

  const fullUrl = 'alex-fitness'
  const animationDuration = 12000 // 12 seconds total loop

  useEffect(() => {
    const sequence = async () => {
      // Step 0: Start - show empty state
      setStep(0)
      await wait(500)

      // Step 1: Type URL
      setStep(1)
      setIsTyping(true)
      await typeText(fullUrl, 80)
      setIsTyping(false)
      await wait(300)

      // Step 2: Profile photo drops in
      setStep(2)
      await wait(800)

      // Step 3: Hero image slides in
      setStep(3)
      await wait(800)

      // Step 4: Service cards stack up
      setStep(4)
      await wait(1000)

      // Step 5: Gallery images populate
      setStep(5)
      await wait(1000)

      // Step 6: Testimonials appear
      setStep(6)
      await wait(800)

      // Step 7: Booking notification
      setStep(7)
      await wait(1500)

      // Step 8: Hold final state
      await wait(1000)

      // Reset
      setTypedText('')
      setStep(0)
    }

    const typeText = async (text: string, speed: number) => {
      for (let i = 0; i <= text.length; i++) {
        setTypedText(text.slice(0, i))
        await wait(speed)
      }
    }

    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    // Start the sequence
    sequence()

    // Loop the sequence
    const interval = setInterval(sequence, animationDuration)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className={cn('relative', className)}>
      {/* Main Browser Window */}
      <motion.div
        className="relative aspect-[4/3] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Browser Chrome */}
        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {/* Traffic Lights */}
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>

            {/* URL Bar */}
            <div className="flex-1 bg-white rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span className="text-xs text-gray-900 font-mono">
                onprez.com/
                <motion.span className="text-onprez-blue font-semibold">
                  {typedText}
                  {isTyping && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      |
                    </motion.span>
                  )}
                </motion.span>
              </span>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6 h-[calc(100%-57px)] overflow-hidden bg-gradient-to-b from-white to-gray-50">
          <div className="space-y-4">
            {/* Profile Section */}
            <div className="flex items-start gap-4">
              {/* Profile Photo */}
              <AnimatePresence mode="wait">
                {step >= 2 && (
                  <motion.div
                    className="relative"
                    initial={{ y: -100, opacity: 0, scale: 0 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 200,
                      damping: 15,
                    }}
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-onprez-blue to-onprez-purple flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      AF
                    </div>
                    <motion.div
                      className="absolute -bottom-1 -right-1 w-5 h-5 bg-onprez-green rounded-full border-2 border-white"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Name and Title */}
              <AnimatePresence mode="wait">
                {step >= 2 && (
                  <motion.div
                    className="flex-1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3 className="text-lg font-bold text-gray-900">Alex Johnson</h3>
                    <p className="text-sm text-gray-600">Personal Trainer & Fitness Coach</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Hero Image */}
            <AnimatePresence mode="wait">
              {step >= 3 && (
                <motion.div
                  className="h-32 rounded-lg overflow-hidden"
                  initial={{ x: '100%', opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 100,
                    damping: 20,
                  }}
                >
                  <div className="h-full bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="text-4xl mb-2">💪</div>
                      <p className="text-sm font-semibold">Transform Your Body</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Service Cards */}
            <AnimatePresence mode="wait">
              {step >= 4 && (
                <motion.div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: '🏋️', title: 'Personal Training', price: '$80' },
                    { icon: '🥗', title: 'Nutrition Plans', price: '$50' },
                  ].map((service, index) => (
                    <motion.div
                      key={index}
                      className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm"
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{
                        delay: index * 0.15,
                        type: 'spring',
                        stiffness: 200,
                        damping: 20,
                      }}
                    >
                      <div className="text-2xl mb-1">{service.icon}</div>
                      <h4 className="text-xs font-semibold text-gray-900 mb-1">{service.title}</h4>
                      <p className="text-xs text-onprez-blue font-bold">{service.price}/session</p>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Gallery Grid */}
            <AnimatePresence mode="wait">
              {step >= 5 && (
                <motion.div
                  className="grid grid-cols-3 gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {[0, 1, 2, 3, 4, 5].map(index => (
                    <motion.div
                      key={index}
                      className="aspect-square rounded-lg overflow-hidden"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        delay: index * 0.08,
                        type: 'spring',
                        stiffness: 200,
                        damping: 15,
                      }}
                    >
                      <div
                        className="w-full h-full"
                        style={{
                          background: `linear-gradient(135deg, 
                            hsl(${index * 60}, 70%, 60%), 
                            hsl(${index * 60 + 30}, 70%, 70%))`,
                        }}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Testimonials */}
            <AnimatePresence mode="wait">
              {step >= 6 && (
                <motion.div
                  className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: 'spring' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-rose-400" />
                    <div>
                      <p className="text-xs font-semibold text-gray-900">Sarah M.</p>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <motion.span
                            key={i}
                            className="text-yellow-400 text-xs"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            ★
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">
                    &quot;Best trainer I&apos;ve ever had! Lost 20lbs in 3 months.&quot;
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Booking Notification */}
        <AnimatePresence>
          {step >= 7 && (
            <motion.div
              className="absolute bottom-6 right-6 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 max-w-xs"
              initial={{ x: 400, opacity: 0, scale: 0.8 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: 400, opacity: 0, scale: 0.8 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 25,
              }}
            >
              <div className="flex items-start gap-3">
                <motion.div
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-onprez-green to-emerald-400 flex items-center justify-center flex-shrink-0"
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 0.5,
                    delay: 0.2,
                  }}
                >
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </motion.div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 mb-1">New Booking! 🎉</p>
                  <p className="text-xs text-gray-600">
                    Mike just booked Personal Training for tomorrow at 10 AM
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Floating Badge */}
      <motion.div
        className="absolute -top-4 -right-4 bg-gradient-to-r from-onprez-blue to-onprez-purple text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg z-10"
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        ✨ Live Demo
      </motion.div>

      {/* Decorative Gradient Orbs */}
      <motion.div
        className="absolute -bottom-8 -left-8 w-32 h-32 bg-onprez-green/20 rounded-full blur-2xl"
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
      <motion.div
        className="absolute -top-8 -right-8 w-40 h-40 bg-onprez-purple/20 rounded-full blur-2xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />
    </div>
  )
}
