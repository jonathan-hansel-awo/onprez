'use client'

import { useState, useEffect } from 'react'

export function useScrollPosition() {
  const [scrollPosition, setScrollPosition] = useState(0)

  useEffect(() => {
    let ticking = false

    const updatePosition = () => {
      setScrollPosition(window.scrollY)
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updatePosition)
        ticking = true
      }
    }

    // Set initial position
    setScrollPosition(window.scrollY)

    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return scrollPosition
}

export function useScrollThreshold(threshold: number = 100) {
  const scrollPosition = useScrollPosition()
  return scrollPosition > threshold
}
