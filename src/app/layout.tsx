'use client'

import { ReactNode, useEffect } from 'react'
import Lenis from 'lenis'
import './globals.css'

export default function LandingLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Initialize Lenis smooth scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    })

    // Animation frame loop for smooth scrolling
    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    // Cleanup
    return () => {
      lenis.destroy()
    }
  }, [])

  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
