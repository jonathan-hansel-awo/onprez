'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { Check, X, Loader2, Sparkles } from 'lucide-react'
import { Confetti } from '@/components/effects/confetti'
import { useRouter } from 'next/navigation'

export function FinalCTA() {
  const [input, setInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef(null)
  const router = useRouter()

  // Sanitize handle input
  const sanitized = input.toLowerCase().replace(/[^a-z0-9-]/g, '')

  // Generate suggestions if handle is taken
  const suggestions =
    isAvailable === false
      ? [
          `${sanitized}-pro`,
          `${sanitized}-studio`,
          `${sanitized}${Math.floor(Math.random() * 100)}`,
        ]
      : []

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 0.5, 1], [100, 0, -100])
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0])

  // Check handle availability with debouncing
  useEffect(() => {
    if (sanitized.length < 3) {
      setIsAvailable(null)
      setIsChecking(false)
      return
    }

    setIsChecking(true)
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/auth/check-handle?handle=${sanitized}`)
        const data = await response.json()

        // Handle rate limiting
        if (response.status === 429) {
          setIsChecking(false)
          return
        }

        setIsAvailable(data.available)
      } catch (error) {
        console.error('Failed to check handle availability:', error)
      } finally {
        setIsChecking(false)
      }
    }, 500)

    return () => clearTimeout(timeout)
  }, [sanitized])

  const checkHandleAvailability = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isAvailable !== true) {
      setError('Please choose an available handle')
      return
    }

    if (!sanitized || sanitized.length < 3) {
      setError('Handle must be at least 3 characters')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // One final check before redirecting
      const checkResponse = await fetch(`/api/auth/check-handle?handle=${sanitized}`)
      const checkData = await checkResponse.json()

      if (!checkData.available) {
        setError('This handle was just taken. Please try another.')
        setIsSubmitting(false)
        setIsAvailable(false)
        return
      }

      // Show success state
      setShowSuccess(true)

      // Wait for celebration animation
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Redirect to signup with the handle
      router.push(`/signup?handle=${sanitized}`)
    } catch (err) {
      console.error('Handle check error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setIsSubmitting(false)
      setShowSuccess(false)
    }
  }

  // Get status for UI display
  const getStatus = () => {
    if (isChecking) return 'checking'
    if (isAvailable === true) return 'available'
    if (isAvailable === false) return 'taken'
    return 'idle'
  }

  const status = getStatus()

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden py-32"
    >
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-onprez-blue via-onprez-purple to-pink-500">
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)',
              'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #3B82F6 100%)',
              'linear-gradient(135deg, #EC4899 0%, #3B82F6 50%, #8B5CF6 100%)',
              'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)',
            ],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      {/* Gradient Mesh Overlay */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
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
          className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
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
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/30 rounded-full"
            style={{
              left: `${(i * 5) % 100}%`,
              top: `${(i * 7) % 100}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3 + (i % 3),
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

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
              className="inline-block mb-6"
              animate={{
                rotate: [0, 10, -10, 10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            >
              <Sparkles className="w-16 h-16 text-yellow-300 mx-auto" />
            </motion.div>

            <h2 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Your Handle <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-pink-200">
                Is Waiting
              </span>
            </h2>

            <p className="text-xl md:text-2xl text-white/90 mb-12">
              Claim your professional identity in seconds
            </p>
          </motion.div>

          {/* Handle Input Form */}
          <motion.form
            onSubmit={checkHandleAvailability}
            className="relative"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Input Container */}
            <div className="relative mb-4">
              <div className="flex items-center bg-white rounded-2xl shadow-2xl overflow-hidden">
                <span className="pl-6 pr-3 text-gray-500 font-semibold text-lg">onprez.com/</span>
                <input
                  type="text"
                  value={input}
                  onChange={e => {
                    setInput(e.target.value)
                    setError(null)
                  }}
                  placeholder="your-name"
                  className="flex-1 py-5 pr-6 text-lg font-semibold text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
                  disabled={isSubmitting || showSuccess}
                  maxLength={30}
                  autoComplete="off"
                />

                {/* Status Indicator */}
                <div className="pr-6">
                  {status === 'checking' && (
                    <Loader2 className="w-6 h-6 text-onprez-blue animate-spin" />
                  )}
                  {status === 'available' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring' }}
                    >
                      <Check className="w-6 h-6 text-onprez-green" />
                    </motion.div>
                  )}
                  {status === 'taken' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, x: [0, -5, 5, -5, 5, 0] }}
                      transition={{ type: 'spring' }}
                    >
                      <X className="w-6 h-6 text-red-500" />
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Glow Effect */}
              <motion.div
                className="absolute inset-0 bg-white rounded-2xl blur-xl opacity-50 -z-10"
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

            {/* Error Message */}
            {error && (
              <motion.div
                className="text-red-300 text-sm mb-4 flex items-center justify-center gap-2 bg-red-500/20 py-2 px-4 rounded-lg"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <X className="w-4 h-4" />
                {error}
              </motion.div>
            )}

            {/* Status Messages */}
            {status === 'available' && sanitized && !error && (
              <motion.div
                className="text-white/90 text-sm mb-4 flex items-center justify-center gap-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Check className="w-4 h-4 text-green-300" />
                <span className="font-semibold text-green-300">Available!</span> Claim it now
              </motion.div>
            )}

            {status === 'taken' && (
              <motion.div
                className="text-white/90 text-sm mb-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="font-semibold text-red-300 mb-2">Already taken. Try these:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestions.map(suggestion => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        setInput(suggestion)
                        setError(null)
                      }}
                      className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm font-semibold transition-colors"
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
              className="w-full py-5 rounded-2xl font-bold text-xl shadow-2xl transition-all bg-white text-onprez-blue hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={
                status === 'available' && !isSubmitting && !showSuccess ? { scale: 1.02 } : {}
              }
              whileTap={
                status === 'available' && !isSubmitting && !showSuccess ? { scale: 0.98 } : {}
              }
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Creating your account...
                </span>
              ) : showSuccess ? (
                <span className="flex items-center justify-center gap-3">
                  <Check className="w-6 h-6" />
                  You&apos;re all set!
                </span>
              ) : (
                'Claim Your Handle'
              )}
            </motion.button>

            {/* Trust Indicators */}
            <motion.div
              className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mt-6 text-white/80 text-sm"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Free forever
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                No credit card
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />2 min setup
              </span>
            </motion.div>
          </motion.form>

          {/* Confetti */}
          <Confetti active={showSuccess} />
        </div>
      </motion.div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </section>
  )
}
