'use client'

import { motion, useInView, Variant } from 'framer-motion'
import { useRef, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface ScrollTriggerProps {
  children: ReactNode
  variants?: {
    hidden: Variant
    visible: Variant
  }
  threshold?: number
  className?: string
  once?: boolean
  delay?: number
}

export function ScrollTrigger({
  children,
  variants,
  threshold = 0.3,
  className,
  once = true,
  delay = 0,
}: ScrollTriggerProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, {
    once,
    amount: threshold,
  })

  // Default variants if none provided
  const defaultVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
        delay,
      },
    },
  }

  const animationVariants = variants || defaultVariants

  return (
    <motion.div
      ref={ref}
      className={cn(className)}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={animationVariants}
    >
      {children}
    </motion.div>
  )
}
