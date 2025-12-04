'use client'

import { motion, useScroll, useTransform, MotionValue } from 'framer-motion'
import { useRef, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface ParallaxLayerProps {
  children: ReactNode
  speed?: number // 0.5 = slower, 1.5 = faster than scroll
  className?: string
  direction?: 'up' | 'down'
}

export function ParallaxLayer({
  children,
  speed = 0.5,
  className,
  direction = 'up',
}: ParallaxLayerProps) {
  const ref = useRef(null)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  // Calculate parallax movement
  const startValue = direction === 'up' ? '0%' : '0%'
  const endValue = direction === 'up' ? `${speed * 100}%` : `-${speed * 100}%`

  const y = useTransform(scrollYProgress, [0, 1], [startValue, endValue])

  return (
    <motion.div ref={ref} style={{ y }} className={cn(className)}>
      {children}
    </motion.div>
  )
}

// Hook version for custom parallax
export function useParallax(speed: number = 0.5): {
  ref: React.RefObject<HTMLDivElement | null>
  y: MotionValue<string>
} {
  const ref = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 1], ['0%', `${speed * 100}%`])

  return { ref, y }
}
