'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useState, useEffect } from 'react'

interface ScrollProgressEnhancedProps {
  interactive?: boolean
}

export function ScrollProgressEnhanced({ interactive = false }: ScrollProgressEnhancedProps) {
  const [mounted, setMounted] = useState(false)
  const { scrollYProgress } = useScroll()

  // Only run on client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Get color based on scroll position
  const backgroundColor = useTransform(
    scrollYProgress,
    [0, 0.2, 0.4, 0.6, 0.8, 1],
    [
      '#3B82F6', // Blue (Hero)
      '#8B5CF6', // Purple (Features)
      '#10B981', // Green (Examples)
      '#3B82F6', // Blue (Pricing)
      '#8B5CF6', // Purple (CTA)
      '#6B7280', // Gray (Footer)
    ]
  )

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-50 origin-left"
      style={{ scaleX: scrollYProgress }}
    >
      <motion.div className="h-full" style={{ backgroundColor }} />
    </motion.div>
  )
}
