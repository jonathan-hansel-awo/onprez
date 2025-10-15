import { Transition } from 'framer-motion'

// Easing curves
export const easings = {
  // Custom cubic bezier curves
  smooth: [0.22, 1, 0.36, 1] as const,
  snappy: [0.4, 0, 0.2, 1] as const,
  bounce: [0.68, -0.55, 0.265, 1.55] as const,

  // Standard easing
  easeIn: 'easeIn' as const,
  easeOut: 'easeOut' as const,
  easeInOut: 'easeInOut' as const,
  linear: 'linear' as const,
}

// Common transition configurations
export const transitions = {
  default: {
    duration: 0.6,
    ease: easings.smooth,
  } as Transition,

  fast: {
    duration: 0.3,
    ease: easings.snappy,
  } as Transition,

  slow: {
    duration: 1.0,
    ease: easings.smooth,
  } as Transition,

  bounce: {
    type: 'spring',
    stiffness: 300,
    damping: 20,
  } as Transition,

  spring: {
    type: 'spring',
    stiffness: 260,
    damping: 25,
  } as Transition,

  springStiff: {
    type: 'spring',
    stiffness: 400,
    damping: 30,
  } as Transition,

  springLoose: {
    type: 'spring',
    stiffness: 100,
    damping: 15,
  } as Transition,
}

// Timing constants
export const timings = {
  instant: 0,
  fast: 0.2,
  normal: 0.4,
  slow: 0.6,
  slower: 0.8,
  slowest: 1.0,
}

// Stagger configurations
export const staggerConfigs = {
  fast: {
    staggerChildren: 0.05,
    delayChildren: 0.1,
  },

  normal: {
    staggerChildren: 0.1,
    delayChildren: 0.2,
  },

  slow: {
    staggerChildren: 0.15,
    delayChildren: 0.3,
  },
}
