'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { cn } from '@/lib/utils/cn'

interface AnimatedHeadlineProps {
  lines: string[]
  className?: string
}

export function AnimatedHeadline({ lines, className }: AnimatedHeadlineProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  }

  const lineVariants = {
    hidden: {
      opacity: 0,
      y: 40,
      rotateX: -90,
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  }

  return (
    <motion.h1
      ref={ref}
      className={cn('font-bold leading-tight', className)}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      {lines.map((line, index) => (
        <motion.div key={index} variants={lineVariants} className="overflow-hidden">
          <motion.span className="inline-block">{line}</motion.span>
        </motion.div>
      ))}
    </motion.h1>
  )
}
