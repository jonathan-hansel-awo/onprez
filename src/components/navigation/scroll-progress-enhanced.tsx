'use client'

import { motion, useScroll, useSpring } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useScrollPosition } from '@/lib/hooks/use-scroll-position'

interface Section {
  id: string
  label: string
  color: string
  start: number
  end: number
}

interface ScrollProgressEnhancedProps {
  interactive?: boolean
}

export function ScrollProgressEnhanced({ interactive = true }: ScrollProgressEnhancedProps) {
  const [sections, setSections] = useState<Section[]>([])
  const [currentColor, setCurrentColor] = useState('#3B82F6')
  const [hoveredSection, setHoveredSection] = useState<string | null>(null)
  const scrollPosition = useScrollPosition()

  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  const shouldShow = scrollPosition > window.innerHeight * 0.7

  useEffect(() => {
    const calculateSections = () => {
      const sectionElements = [
        { id: 'hero', label: 'Home', color: '#3B82F6' },
        { id: 'features', label: 'Features', color: '#8B5CF6' },
        { id: 'pricing', label: 'Pricing', color: '#10B981' },
        { id: 'examples', label: 'Examples', color: '#3B82F6' },
        { id: 'cta', label: 'Get Started', color: '#8B5CF6' },
      ]

      const calculatedSections: Section[] = sectionElements
        .map(({ id, label, color }) => {
          const element = document.getElementById(id)
          if (!element) return null

          const rect = element.getBoundingClientRect()
          const scrollTop = window.scrollY || document.documentElement.scrollTop

          return {
            id,
            label,
            color,
            start: scrollTop + rect.top,
            end: scrollTop + rect.bottom,
          }
        })
        .filter(Boolean) as Section[]

      setSections(calculatedSections)
    }

    calculateSections()
    window.addEventListener('resize', calculateSections)
    setTimeout(calculateSections, 100)

    return () => window.removeEventListener('resize', calculateSections)
  }, [])

  useEffect(() => {
    const currentSection = sections.find(
      section => scrollPosition >= section.start && scrollPosition < section.end
    )

    if (currentSection) {
      setCurrentColor(currentSection.color)
    }
  }, [scrollPosition, sections])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const offset = 80 // Account for header height
      const elementPosition = element.getBoundingClientRect().top + window.scrollY
      const offsetPosition = elementPosition - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
  }

  const isInFinalCTA =
    sections.length > 0 && scrollPosition >= sections[sections.length - 1]?.start - 200

  if (!shouldShow || isInFinalCTA) {
    return null
  }

  const currentProgress = scrollYProgress.get()

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Progress Bar */}
      <motion.div
        className="h-1 bg-gray-200/50 relative"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        <motion.div
          className="h-full origin-left"
          style={{
            scaleX,
            backgroundColor: currentColor,
            boxShadow: `0 0 10px ${currentColor}40`,
          }}
        />

        {/* Interactive Section Markers */}
        {interactive &&
          sections.map((section, index) => {
            const sectionProgress =
              (section.start + (section.end - section.start) / 2) /
              (document.documentElement.scrollHeight - window.innerHeight)
            const isActive = scrollPosition >= section.start && scrollPosition < section.end
            const isPast = scrollPosition >= section.end

            return (
              <motion.button
                key={section.id}
                className="absolute top-1/2 -translate-y-1/2 group"
                style={{
                  left: `${sectionProgress * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                onClick={() => scrollToSection(section.id)}
                onMouseEnter={() => setHoveredSection(section.id)}
                onMouseLeave={() => setHoveredSection(null)}
                whileHover={{ scale: 1.5 }}
                whileTap={{ scale: 0.9 }}
              >
                {/* Marker Dot */}
                <div
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'ring-2 ring-white ring-offset-1'
                      : isPast
                        ? 'opacity-60'
                        : 'opacity-40'
                  }`}
                  style={{
                    backgroundColor: section.color,
                    boxShadow: isActive ? `0 0 10px ${section.color}` : 'none',
                  }}
                />

                {/* Label Tooltip */}
                {hoveredSection === section.id && (
                  <motion.div
                    className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                  >
                    <div
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow-lg"
                      style={{ backgroundColor: section.color }}
                    >
                      {section.label}
                      <div
                        className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
                        style={{ backgroundColor: section.color }}
                      />
                    </div>
                  </motion.div>
                )}
              </motion.button>
            )
          })}
      </motion.div>
    </div>
  )
}
