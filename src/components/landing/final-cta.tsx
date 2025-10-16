'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { Check, X, Loader2, Sparkles } from 'lucide-react'
import { useHandleValidation } from '@/lib/hooks/use-handle-validation'
import { Confetti } from '@/components/effects/confetti'

interface Particle {
  id: number
  left: number
  top: number
  duration: number
  delay: number
}

export function FinalCTA() {
  const [input, setInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])
  const [mounted, setMounted] = useState(false)
  const ref = useRef(null)

  const { status, sanitized, suggestions } = useHandleValidation(input)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 0.5, 1], [100, 0, -100])
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0])

  // Generate random particles only on client after hydration
  useEffect(() => {
    setMounted(true)
    const generatedParticles: Particle[] = [...Array(20)].map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: 3 + Math.random() * 2,
      delay: Math.random() * 2,
    }))
    setParticles(generatedParticles)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status !== 'available') return

    setIsSubmitting(true)

    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 2000))

    setIsSubmitting(false)
    setShowSuccess(true)

    // Auto-redirect after success
    setTimeout(() => {
      // window.location.href = '/signup';
    }, 3000)
  }

  if (!mounted) {
    return null
  }

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden py-16 md:py-32"
    >
      {/* Animated Gradient Background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-onprez-blue via-onprez-purple to-pink-500"
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          backgroundSize: '200% 200%',
        }}
      />

      {/* Gradient Mesh Overlay */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-0 left-0 w-64 md:w-96 h-64 md:h-96 bg-white/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-white/10 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Floating Particles */}
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute w-1 h-1 md:w-2 md:h-2 bg-white/20 rounded-full"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
          }}
          animate={{
            y: [-20, 20, -20],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
          }}
        />
      ))}

      {/* Content */}
      <motion.div className="relative z-10 container mx-auto px-4" style={{ y, opacity }}>
        <div className="max-w-3xl mx-auto text-center">
          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="inline-block mb-4 md:mb-6"
              animate={{
                rotate: [0, 10, -10, 10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            >
              <Sparkles className="w-12 h-12 md:w-16 md:h-16 text-yellow-300 mx-auto" />
            </motion.div>

            <h2 className="text-4xl md:text-7xl font-bold text-white mb-4 md:mb-6">
              Your Handle <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-pink-200">
                Is Waiting
              </span>
            </h2>

            <p className="text-lg md:text-2xl text-white/90 mb-8 md:mb-12 px-4">
              Claim your professional identity in seconds
            </p>
          </motion.div>

          {/* Handle Input Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="relative"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Input Container */}
            <div className="relative mb-4 px-4 md:px-0">
              <div className="flex items-center bg-white rounded-lg md:rounded-2xl shadow-2xl overflow-hidden">
                <span className="pl-4 md:pl-6 pr-2 md:pr-3 text-gray-500 font-semibold text-sm md:text-lg whitespace-nowrap">
                  onprez.com/
                </span>
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="your-name"
                  className="flex-1 py-3 md:py-5 pr-4 md:pr-6 text-sm md:text-lg font-semibold text-gray-900 placeholder-gray-400 focus:outline-none"
                  disabled={isSubmitting || showSuccess}
                  maxLength={30}
                />

                {/* Status Indicator */}
                <div className="pr-4 md:pr-6">
                  {status === 'checking' && (
                    <Loader2 className="w-5 h-5 md:w-6 md:h-6 text-onprez-blue animate-spin" />
                  )}
                  {status === 'available' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring' }}
                    >
                      <Check className="w-5 h-5 md:w-6 md:h-6 text-onprez-green" />
                    </motion.div>
                  )}
                  {status === 'taken' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, x: [0, -5, 5, -5, 5, 0] }}
                      transition={{ type: 'spring' }}
                    >
                      <X className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Glow Effect */}
              <motion.div
                className="absolute inset-0 bg-white rounded-lg md:rounded-2xl blur-xl opacity-50 mx-4 md:mx-0"
                animate={{
                  scale: [1, 1.02, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />
            </div>

            {/* Status Messages */}
            {status === 'available' && sanitized && (
              <motion.div
                className="text-white/90 text-xs md:text-sm mb-4 flex items-center justify-center gap-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Check className="w-4 h-4 text-green-300" />
                <span className="font-semibold text-green-300">Available!</span> Claim it now
              </motion.div>
            )}

            {status === 'taken' && (
              <motion.div
                className="text-white/90 text-xs md:text-sm mb-4 px-4 md:px-0"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="font-semibold text-red-300 mb-2">Already taken. Try these:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestions.map(suggestion => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setInput(suggestion)}
                      className="bg-white/20 hover:bg-white/30 px-3 md:px-4 py-1 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={status !== 'available' || isSubmitting || showSuccess}
              className={`w-full mx-auto px-4 md:px-0 py-3 md:py-5 rounded-lg md:rounded-2xl font-bold text-lg md:text-xl shadow-2xl transition-all ${
                status === 'available' && !isSubmitting && !showSuccess
                  ? 'bg-white text-onprez-blue hover:bg-gray-50 cursor-pointer'
                  : 'bg-white/50 text-white/50 cursor-not-allowed'
              }`}
              whileHover={
                status === 'available' && !isSubmitting && !showSuccess ? { scale: 1.02 } : {}
              }
              whileTap={
                status === 'available' && !isSubmitting && !showSuccess ? { scale: 0.98 } : {}
              }
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-3">
                  <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
                  Creating your account...
                </span>
              ) : showSuccess ? (
                <span className="flex items-center justify-center gap-3">
                  <Check className="w-5 h-5 md:w-6 md:h-6" />
                  You&apos;re all set!
                </span>
              ) : (
                'Claim Your Handle'
              )}
            </motion.button>

            {/* Trust Indicators */}
            <motion.div
              className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 mt-4 md:mt-6 text-white/80 text-xs md:text-sm px-4 md:px-0"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 flex-shrink-0" />
                Free forever
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 flex-shrink-0" />
                No credit card
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 flex-shrink-0" />2 min setup
              </span>
            </motion.div>
          </motion.form>

          {/* Confetti */}
          <Confetti active={showSuccess} />
        </div>
      </motion.div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 md:h-32 bg-gradient-to-t from-white to-transparent" />
    </section>
  )
}
