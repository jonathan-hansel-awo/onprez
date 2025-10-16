'use client'

import { motion } from 'framer-motion'
import { Testimonial } from '@/data/testimonials'
import { Star, Play } from 'lucide-react'
import { useState, useEffect } from 'react'

interface TestimonialTileProps {
  testimonial: Testimonial
  index: number
}

export function TestimonialTile({ testimonial, index }: TestimonialTileProps) {
  const [isInView, setIsInView] = useState(false)

  if (testimonial.type === 'quote-large' || testimonial.type === 'quote-small') {
    return <QuoteTile testimonial={testimonial} index={index} />
  }

  if (testimonial.type === 'metric') {
    return <MetricTile testimonial={testimonial} index={index} />
  }

  if (testimonial.type === 'video') {
    return <VideoTile testimonial={testimonial} index={index} />
  }

  return null
}

function QuoteTile({ testimonial, index }: TestimonialTileProps) {
  return (
    <motion.div
      className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 h-full flex flex-col"
      initial={{ opacity: 0, y: 20, rotate: -2 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      whileHover={{
        y: -5,
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        rotate: 1,
      }}
    >
      {/* Quotation Mark */}
      <motion.div
        className="text-6xl text-onprez-blue/20 font-serif leading-none mb-2"
        initial={{ scale: 0, rotate: -180 }}
        whileInView={{ scale: 1, rotate: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.05 + 0.2, type: 'spring' }}
      >
        &quot;
      </motion.div>

      {/* Quote Text */}
      <p
        className={`text-gray-700 mb-4 flex-1 ${
          testimonial.type === 'quote-large' ? 'text-lg leading-relaxed' : 'text-base'
        }`}
      >
        {testimonial.content}
      </p>

      {/* Author Info */}
      <div className="flex items-center gap-3 mt-auto">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-onprez-blue to-onprez-purple flex items-center justify-center text-2xl shadow-lg">
          {testimonial.author?.avatar}
        </div>
        <div className="flex-1">
          <p className="font-bold text-gray-900">{testimonial.author?.name}</p>
          <p className="text-sm text-gray-600">{testimonial.author?.role}</p>
        </div>
      </div>

      {/* Rating */}
      {testimonial.rating && (
        <motion.div
          className="flex gap-1 mt-3"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.05 + 0.4 }}
        >
          {[...Array(testimonial.rating)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, rotate: -180 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 + 0.4 + i * 0.05, type: 'spring' }}
            >
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}

function MetricTile({ testimonial, index }: TestimonialTileProps) {
  const [count, setCount] = useState(testimonial.metric!.before)
  const [hasAnimated, setHasAnimated] = useState(false)

  const animateCount = () => {
    if (hasAnimated) return

    const duration = 2000
    const start = testimonial.metric!.before
    const end = testimonial.metric!.after
    const startTime = Date.now()

    const updateCount = () => {
      const now = Date.now()
      const progress = Math.min((now - startTime) / duration, 1)

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const current = start + (end - start) * easeOutQuart

      setCount(Number(current.toFixed(1)))

      if (progress < 1) {
        requestAnimationFrame(updateCount)
      } else {
        setHasAnimated(true)
      }
    }

    requestAnimationFrame(updateCount)
  }

  return (
    <motion.div
      className="bg-gradient-to-br from-onprez-blue/5 via-onprez-purple/5 to-pink-500/5 rounded-2xl shadow-lg border border-gray-100 p-6 h-full flex flex-col items-center justify-center text-center relative overflow-hidden"
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      onViewportEnter={animateCount}
      whileHover={{
        scale: 1.05,
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-onprez-blue rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-onprez-purple rounded-full -ml-16 -mb-16" />
      </div>

      {/* Arrow and Numbers */}
      <div className="relative z-10 flex items-center gap-4 mb-3">
        <motion.div
          className="text-4xl font-bold text-gray-400"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.05 + 0.2 }}
        >
          {testimonial.metric!.before}
        </motion.div>

        <motion.div
          className="text-2xl"
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.05 + 0.4, type: 'spring' }}
        >
          →
        </motion.div>

        <motion.div className="text-5xl font-bold bg-gradient-to-r from-onprez-blue to-onprez-purple bg-clip-text text-transparent">
          {count}
        </motion.div>
      </div>

      {/* Label */}
      <p className="text-sm font-semibold text-gray-700 mb-1">{testimonial.metric!.label}</p>
      {testimonial.metric!.unit && (
        <p className="text-xs text-gray-500">{testimonial.metric!.unit}</p>
      )}

      {/* Percentage Gain */}
      <motion.div
        className="mt-3 bg-onprez-green/10 text-onprez-green px-3 py-1 rounded-full text-sm font-bold"
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.05 + 0.6, type: 'spring' }}
      >
        +
        {Math.round(
          ((testimonial.metric!.after - testimonial.metric!.before) / testimonial.metric!.before) *
            100
        )}
        %
      </motion.div>
    </motion.div>
  )
}

function VideoTile({ testimonial, index }: TestimonialTileProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-lg overflow-hidden h-full flex flex-col cursor-pointer relative"
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
    >
      {/* Video Thumbnail */}
      <div className="relative flex-1 flex items-center justify-center bg-gradient-to-br from-onprez-blue/20 to-onprez-purple/20">
        <motion.div
          className="text-8xl"
          animate={isHovered ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          {testimonial.video?.thumbnail}
        </motion.div>

        {/* Play Button */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 1 }}
          animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
        >
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl">
            <Play className="w-8 h-8 text-onprez-blue ml-1" fill="currentColor" />
          </div>
        </motion.div>

        {/* Duration Badge */}
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-semibold">
          {testimonial.video?.duration}
        </div>
      </div>

      {/* Author Info */}
      <div className="p-4 bg-gray-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-onprez-blue to-onprez-purple flex items-center justify-center text-xl">
            {testimonial.author?.avatar}
          </div>
          <div>
            <p className="font-bold text-white text-sm">{testimonial.author?.name}</p>
            <p className="text-xs text-gray-400">{testimonial.author?.role}</p>
          </div>
        </div>
      </div>

      {/* Hover Overlay */}
      <motion.div
        className="absolute inset-0 bg-onprez-blue/10 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />
    </motion.div>
  )
}
