'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { examples, categories, Example } from '@/data/examples'
import { ExampleCard } from './example-card'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export function ExamplesCarousel() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Filter examples by category
  const filteredExamples =
    selectedCategory === 'all' ? examples : examples.filter(ex => ex.category === selectedCategory)

  // Auto-rotate
  useEffect(() => {
    if (!isAutoPlaying || filteredExamples.length === 0) return

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % filteredExamples.length)
    }, 4000)

    return () => clearInterval(timer)
  }, [isAutoPlaying, filteredExamples.length])

  // Reset index when category changes
  useEffect(() => {
    setCurrentIndex(0)
  }, [selectedCategory])

  const handlePrevious = () => {
    setIsAutoPlaying(false)
    setCurrentIndex(prev => (prev - 1 + filteredExamples.length) % filteredExamples.length)
  }

  const handleNext = () => {
    setIsAutoPlaying(false)
    setCurrentIndex(prev => (prev + 1) % filteredExamples.length)
  }

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setIsAutoPlaying(true)
  }

  // Get visible cards (previous, current, next)
  const getVisibleCards = () => {
    if (filteredExamples.length === 0) return []

    const prev = (currentIndex - 1 + filteredExamples.length) % filteredExamples.length
    const next = (currentIndex + 1) % filteredExamples.length

    return [
      { example: filteredExamples[prev], position: 'left' },
      { example: filteredExamples[currentIndex], position: 'center' },
      { example: filteredExamples[next], position: 'right' },
    ]
  }

  const visibleCards = getVisibleCards()

  // Get background color from current example
  const currentExample = filteredExamples[currentIndex]
  const bgGradient = currentExample?.colors.primary || 'from-blue-500 to-purple-500'

  return (
    <section className="py-32 relative overflow-hidden" id="examples">
      {/* Animated Background */}
      <motion.div
        className={cn('absolute inset-0 bg-gradient-to-br opacity-10 blur-3xl', bgGradient)}
        key={currentIndex}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ duration: 1 }}
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">See It In Action</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Real professionals using OnPrez to grow their business. Get inspired.
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          className="flex flex-wrap justify-center gap-3 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {categories.map(category => (
            <motion.button
              key={category.id}
              className={cn(
                'px-6 py-3 rounded-full font-semibold text-sm transition-all',
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-onprez-blue to-onprez-purple text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
              )}
              onClick={() => handleCategoryChange(category.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="mr-2">{category.icon}</span>
              {category.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Carousel */}
        <div className="relative">
          {/* Navigation Arrows */}
          <button
            onClick={handlePrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white rounded-full p-3 shadow-xl hover:bg-gray-50 transition-colors hidden md:block"
            aria-label="Previous example"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white rounded-full p-3 shadow-xl hover:bg-gray-50 transition-colors hidden md:block"
            aria-label="Next example"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>

          {/* Cards Container */}
          <div className="relative h-[600px] flex items-center justify-center">
            <AnimatePresence mode="popLayout">
              {visibleCards.map(({ example, position }) => (
                <motion.div
                  key={`${example.id}-${position}`}
                  className="absolute w-80"
                  initial={{
                    x: position === 'left' ? -400 : position === 'right' ? 400 : 0,
                    opacity: 0,
                    scale: 0.8,
                  }}
                  animate={{
                    x: position === 'left' ? -350 : position === 'right' ? 350 : 0,
                    opacity: position === 'center' ? 1 : 0.3,
                    scale: position === 'center' ? 1 : 0.8,
                    zIndex: position === 'center' ? 10 : 1,
                  }}
                  exit={{
                    x: position === 'left' ? -400 : 400,
                    opacity: 0,
                    scale: 0.8,
                  }}
                  transition={{
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <ExampleCard
                    example={example}
                    isCenter={position === 'center'}
                    onClick={() => {
                      if (position === 'left') handlePrevious()
                      if (position === 'right') handleNext()
                    }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {filteredExamples.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index)
                  setIsAutoPlaying(false)
                }}
                className={cn(
                  'h-2 rounded-full transition-all',
                  index === currentIndex
                    ? 'w-8 bg-onprez-blue'
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Current Example Info */}
        <AnimatePresence mode="wait">
          {currentExample && (
            <motion.div
              key={currentExample.id}
              className="text-center mt-12 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-gray-600 mb-4">
                <strong>{currentExample.name}</strong> uses OnPrez to manage their{' '}
                {currentExample.profession.toLowerCase()} business, receiving{' '}
                <strong>{currentExample.stats.bookings}+ bookings</strong> and{' '}
                <strong>{currentExample.stats.views}+ profile views</strong> monthly.
              </p>
              <motion.button
                className="bg-gradient-to-r from-onprez-blue to-onprez-purple text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Start Your Own Presence
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
