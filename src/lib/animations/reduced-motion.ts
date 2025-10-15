'use client'

import { useEffect, useState } from 'react'
import { Variants } from 'framer-motion'

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

// Simplified variants for reduced motion
export const reducedMotionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
}

// Helper to choose between full and reduced motion variants
export function getMotionVariants(fullVariants: Variants, prefersReducedMotion: boolean): Variants {
  return prefersReducedMotion ? reducedMotionVariants : fullVariants
}
