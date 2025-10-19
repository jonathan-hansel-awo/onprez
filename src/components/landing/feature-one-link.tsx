'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { ContextMockup } from './context-mockups'
import { useInView } from 'react-intersection-observer'
import { Sparkles } from 'lucide-react'
import { useMediaQuery } from '@/lib/hooks/use-media-query'

type ContextType = 'instagram' | 'business-card' | 'email' | 'google' | 'speech' | null

export function FeatureOneLink() {
  const [currentContext, setCurrentContext] = useState<ContextType>(null)
  const [isOrbiting, setIsOrbiting] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [handle, setHandle] = useState('your-name')
  const [inputValue, setInputValue] = useState('')
  const [mounted, setMounted] = useState(false)
  const { ref, inView } = useInView({
    threshold: 0.3,
    triggerOnce: false,
  })

  const isDesktop = useMediaQuery('(min-width: 768px)')

  const contexts: ContextType[] = ['instagram', 'business-card', 'email', 'google', 'speech']

  useEffect(() => {
    setMounted(true)
  }, [])

  // Update handle when input changes (with debounce effect)
  useEffect(() => {
    if (inputValue.trim()) {
      const sanitized = inputValue
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      setHandle(sanitized || 'your-name')
    } else {
      setHandle('your-name')
    }
  }, [inputValue])

  useEffect(() => {
    if (!mounted) return

    if (!inView) {
      setCurrentStep(0)
      setCurrentContext(null)
      setIsOrbiting(false)
      return
    }

    // Sequence timing
    const sequence = [
      { duration: 2000, action: () => setCurrentContext('instagram') },
      { duration: 2500, action: () => setCurrentContext('business-card') },
      { duration: 2500, action: () => setCurrentContext('email') },
      { duration: 2500, action: () => setCurrentContext('google') },
      { duration: 2500, action: () => setCurrentContext('speech') },
      { duration: 1500, action: () => setCurrentContext(null) },
      { duration: 3000, action: () => setIsOrbiting(true) },
    ]

    if (currentStep < sequence.length) {
      const timer = setTimeout(() => {
        sequence[currentStep].action()
        setCurrentStep(currentStep + 1)
      }, sequence[currentStep].duration)

      return () => clearTimeout(timer)
    } else {
      // Reset after orbiting
      const resetTimer = setTimeout(() => {
        setCurrentStep(0)
        setCurrentContext(null)
        setIsOrbiting(false)
      }, 10000)

      return () => clearTimeout(resetTimer)
    }
  }, [currentStep, inView, mounted])

  if (!mounted) {
    return null
  }

  const contextScale = isDesktop ? 1 : 0.75

  return (
    <section
      ref={ref}
      className="py-16 md:py-32 bg-gradient-to-b from-white via-purple-50 to-white overflow-hidden"
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">One Link Everywhere</h2>
          <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
            Your handle becomes your professional identity. Put it everywhere, and it works
            everywhere.
          </p>
        </motion.div>

        {/* Handle Input */}
        <motion.div
          className="max-w-md mx-auto mb-8 md:mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="relative">
            <div className="flex items-center bg-white rounded-lg md:rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden focus-within:border-onprez-blue focus-within:ring-4 focus-within:ring-onprez-blue/20 transition-all">
              <span className="pl-3 md:pl-4 pr-2 text-gray-500 font-medium text-xs md:text-base whitespace-nowrap">
                onprez.com/
              </span>
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="your-name"
                className="flex-1 py-2 md:py-4 pr-3 md:pr-4 text-sm md:text-base font-semibold text-gray-900 placeholder-gray-400 focus:outline-none"
                maxLength={30}
              />
              {inputValue && (
                <motion.button
                  className="mr-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={() => setInputValue('')}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg
                    className="w-4 h-4 md:w-5 md:h-5 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </motion.button>
              )}
            </div>

            {/* Sparkle effect */}
            <motion.div
              className="absolute -top-2 -right-2"
              animate={{
                rotate: [0, 360],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
              }}
            >
              <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-onprez-purple" />
            </motion.div>
          </div>

          <p className="text-center text-xs text-gray-500 mt-2">
            ✨ Try it! Type your name to see it everywhere
          </p>
        </motion.div>

        {/* Main Demo Area */}
        <div className="relative min-h-[400px] md:min-h-[600px] flex items-center justify-center">
          {/* Central Handle */}
          <motion.div
            className="absolute bottom-8 left-1/2 z-20"
            style={{ x: '-50%', y: '-50%' }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="relative bg-white rounded-lg md:rounded-2xl shadow-2xl px-3 md:px-8 py-2 md:py-6 border-2 border-gray-200"
              animate={
                isOrbiting
                  ? {}
                  : {
                      scale: [1, 1.05, 1],
                    }
              }
              transition={{
                duration: 2,
                repeat: isOrbiting ? 0 : Infinity,
              }}
              key={handle}
            >
              {/* Glow effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-onprez-blue/30 to-onprez-purple/30 rounded-lg md:rounded-2xl blur-xl -z-10"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                }}
              />

              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Your Handle</p>
                <motion.p
                  className="text-xs md:text-3xl font-bold bg-gradient-to-r from-onprez-blue to-onprez-purple bg-clip-text text-transparent break-all"
                  transition={{ duration: 0.3 }}
                  key={`handle-${handle}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  onprez.com/{handle}
                </motion.p>
              </div>

              {/* Pulse rings */}
              {!currentContext && !isOrbiting && (
                <>
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute inset-0 border-2 border-onprez-blue rounded-lg md:rounded-2xl"
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{
                        scale: [1, 1.5, 2],
                        opacity: [0.5, 0.2, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.6,
                      }}
                    />
                  ))}
                </>
              )}
            </motion.div>
          </motion.div>

          {/* Context Mockups - Sequential Display */}
          <AnimatePresence mode="wait">
            {currentContext && !isOrbiting && (
              <motion.div
                key={`${currentContext}-${handle}`}
                className="absolute top-4 z-10"
                initial={{ opacity: 0, scale: 0.6, y: 50 }}
                animate={{ opacity: 1, scale: contextScale, y: 0 }}
                exit={{ opacity: 0, scale: 0.6, y: -50 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <ContextMockup type={currentContext} handle={handle} />

                {/* Context Label */}
                <motion.div
                  className="absolute -bottom-10 md:-bottom-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3 md:px-4 py-1 md:py-2 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {currentContext === 'instagram' && '📱 Instagram Bio'}
                  {currentContext === 'business-card' && '💳 Business Card'}
                  {currentContext === 'email' && '📧 Email Signature'}
                  {currentContext === 'google' && '🔍 Google Search'}
                  {currentContext === 'speech' && '🗣️ Easy to Say'}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Orbiting Mockups - Finale */}
          {isOrbiting && (
            <div className="absolute inset-0">
              {contexts.map((context, index) => {
                if (!context) return null

                const angle = (index * 360) / contexts.length
                const radiusMobile = 100
                const radiusDesktop = 280
                const radius = isDesktop ? radiusDesktop : radiusMobile
                const scale = isDesktop ? 0.5 : 0.3

                return (
                  <motion.div
                    key={`orbit-${context}-${handle}`}
                    className="absolute top-1/2 left-1/2"
                    style={{
                      x: '-50%',
                      y: '-50%',
                    }}
                    animate={{
                      rotate: [angle, angle + 360],
                    }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  >
                    <motion.div
                      style={{
                        x: radius,
                      }}
                      animate={{
                        rotate: [0, -360],
                      }}
                      transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    >
                      <motion.div
                        style={{
                          scale: scale,
                          originX: 0,
                          originY: 0,
                        }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: scale }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <ContextMockup type={context} handle={handle} />
                      </motion.div>
                    </motion.div>
                  </motion.div>
                )
              })}

              {/* Orbital rings */}
              {[...Array(2)].map((_, i) => {
                const radiusMobile = 100 + i * 20
                const radiusDesktop = 280 + i * 40
                const orbitRadius = isDesktop ? radiusDesktop : radiusMobile

                return (
                  <motion.div
                    key={`ring-${i}`}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-onprez-blue/20 rounded-full"
                    style={{
                      width: orbitRadius * 2,
                      height: orbitRadius * 2,
                    }}
                    animate={{
                      rotate: i % 2 === 0 ? 360 : -360,
                    }}
                    transition={{
                      duration: 30 + i * 10,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Bottom Text */}
        <motion.div
          className="text-center mt-12 md:mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-gray-600 mb-2 text-xs md:text-base">
            <strong>One link. Your complete professional identity.</strong>
          </p>
          <p className="text-xs text-gray-500">
            Memorable • Shareable • Works everywhere • Easy to say
          </p>
        </motion.div>

        {/* Key Benefits */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 max-w-4xl mx-auto mt-8 md:mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.7 }}
        >
          {[
            { icon: '💬', title: 'Easy to Say', desc: 'Just tell people verbally' },
            { icon: '🔗', title: 'Easy to Share', desc: 'Copy, paste, done' },
            { icon: '🎯', title: 'Easy to Remember', desc: 'Simple and clear' },
            { icon: '🌐', title: 'Works Everywhere', desc: 'Any platform, any device' },
          ].map((benefit, i) => (
            <motion.div
              key={i}
              className="text-center p-3 md:p-6 bg-white rounded-lg md:rounded-xl shadow-lg border border-gray-100"
              whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
            >
              <div className="text-2xl md:text-4xl mb-2 md:mb-3">{benefit.icon}</div>
              <h4 className="font-bold text-gray-900 mb-1 text-xs md:text-base">{benefit.title}</h4>
              <p className="text-xs text-gray-600">{benefit.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
