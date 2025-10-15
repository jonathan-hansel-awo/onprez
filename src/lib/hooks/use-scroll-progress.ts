'use client'

import { useScroll, useTransform } from 'framer-motion'
import { RefObject } from 'react'

export function useScrollProgress(targetRef?: RefObject<HTMLElement>) {
  const { scrollYProgress } = useScroll(targetRef ? { target: targetRef } : undefined)

  return scrollYProgress
}

export function useScrollOpacity(targetRef?: RefObject<HTMLElement>) {
  const { scrollYProgress } = useScroll(
    targetRef
      ? {
          target: targetRef,
          offset: ['start end', 'end start'],
        }
      : undefined
  )

  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0])

  return opacity
}
