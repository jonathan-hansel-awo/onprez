'use client'

import { motion, useScroll, useSpring, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useScrollPosition } from '@/lib/hooks/use-scroll-position'

interface Section {
  id: string
  color: string
  start: number
  end: number
}

export function ScrollProgress() {
  const [sections, setSections] = useState<Section[]>([])
  const [currentColor, setCurrentColor] = useState('#3B82F6') // Default onprez-blue
  const scrollPosition = useScrollPosition()

  const { scrollYProgress } = useScroll()

  // Smooth spring animation for progress
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  // Calculate if we should show the progress bar
  // Show after hero (after first viewport) and hide during final CTA
  const shouldShow = scrollPosition > window.innerHeight * 0.7

  useEffect(() => {
    // Get all sections and their positions
    const calculateSections = () => {
      const sectionElements = [
        { id: 'hero', color: '#3B82F6' }, // Blue
        { id: 'features', color: '#8B5CF6' }, // Purple
        { id: 'pricing', color: '#10B981' }, // Green
        { id: 'examples', color: '#3B82F6' }, // Blue
        { id: 'cta', color: '#8B5CF6' }, // Purple
      ]

      const calculatedSections: Section[] = sectionElements
        .map(({ id, color }) => {
          const element = document.getElementById(id)
          if (!element) return null

          const rect = element.getBoundingClientRect()
          const scrollTop = window.scrollY || document.documentElement.scrollTop

          return {
            id,
            color,
            start: scrollTop + rect.top,
            end: scrollTop + rect.bottom,
          }
        })
        .filter(Boolean) as Section[]

      setSections(calculatedSections)
    }

    // Calculate on mount and on resize
    calculateSections()
    window.addEventListener('resize', calculateSections)

    // Small delay to ensure DOM is ready
    setTimeout(calculateSections, 100)

    return () => window.removeEventListener('resize', calculateSections)
  }, [])

  useEffect(() => {
    // Determine current section color based on scroll position
    const currentSection = sections.find(
      section => scrollPosition >= section.start && scrollPosition < section.end
    )

    if (currentSection) {
      setCurrentColor(currentSection.color)
    }
  }, [scrollPosition, sections])

  // Hide during final CTA section
  const isInFinalCTA =
    sections.length > 0 && scrollPosition >= sections[sections.length - 1]?.start - 200

  if (!shouldShow || isInFinalCTA) {
    return null
  }

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200/50"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="h-full origin-left"
        style={{
          scaleX,
          backgroundColor: currentColor,
          boxShadow: `0 0 10px ${currentColor}40`,
        }}
        transition={{ backgroundColor: { duration: 0.5 } }}
      />
    </motion.div>
  )
}
