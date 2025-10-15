'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface TextRevealProps {
  children: string
  className?: string
  delay?: number
  staggerDelay?: number
  once?: boolean
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span'
}

export function TextReveal({
  children,
  className,
  delay = 0,
  staggerDelay = 0.08,
  once = true,
  as: Component = 'p',
}: TextRevealProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, {
    once,
    amount: 0.3,
  })

  // Split text into words
  const words = children.split(' ')

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      },
    },
  }

  const wordVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      filter: 'blur(8px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  }

  return (
    <Component ref={ref} className={cn(className)}>
      <motion.span
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={containerVariants}
        className="inline-block"
      >
        {words.map((word, index) => (
          <motion.span
            key={`${word}-${index}`}
            variants={wordVariants}
            className="inline-block mr-[0.25em]"
          >
            {word}
          </motion.span>
        ))}
      </motion.span>
    </Component>
  )
}

// Character-by-character reveal variant
interface CharRevealProps extends Omit<TextRevealProps, 'staggerDelay'> {
  charDelay?: number
}

export function CharReveal({
  children,
  className,
  delay = 0,
  charDelay = 0.03,
  once = true,
  as: Component = 'p',
}: CharRevealProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, {
    once,
    amount: 0.3,
  })

  const characters = children.split('')

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: charDelay,
        delayChildren: delay,
      },
    },
  }

  const charVariants = {
    hidden: {
      opacity: 0,
      y: 10,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
  }

  return (
    <Component ref={ref} className={cn(className)}>
      <motion.span
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={containerVariants}
        className="inline-block"
      >
        {characters.map((char, index) => (
          <motion.span key={`${char}-${index}`} variants={charVariants} className="inline-block">
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </motion.span>
    </Component>
  )
}
