'use client'

import { useInView as useFramerInView } from 'framer-motion'
import { RefObject } from 'react'

interface UseInViewOptions {
  once?: boolean
  amount?: number | 'some' | 'all'
  margin?: string
}

export function useInView(ref: RefObject<Element>, options: UseInViewOptions = {}) {
  const { once = true, amount = 0.3, margin = '0px' } = options

  return useFramerInView(ref, {
    once,
    amount,
  })
}
