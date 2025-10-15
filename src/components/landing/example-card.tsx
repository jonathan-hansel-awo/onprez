'use client'

import { motion } from 'framer-motion'
import { Example } from '@/data/examples'
import { Star, TrendingUp, Eye } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ExampleCardProps {
  example: Example
  isCenter?: boolean
  onClick?: () => void
}

export function ExampleCard({ example, isCenter = false, onClick }: ExampleCardProps) {
  return (
    <motion.div
      className={cn(
        'relative bg-white rounded-2xl shadow-xl overflow-hidden cursor-pointer transition-all',
        isCenter ? 'scale-100' : 'scale-90 opacity-70'
      )}
      onClick={onClick}
      whileHover={{ y: isCenter ? -10 : -5 }}
      layout
    >
      {/* Category Badge */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-gray-700 shadow-lg capitalize">
          {example.category}
        </div>
      </div>

      {/* Header with gradient */}
      <div className={cn('bg-gradient-to-br p-6 text-white', example.colors.primary)}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-3xl shadow-lg">
            {example.image}
          </div>
          <div>
            <h3 className="text-xl font-bold">{example.name}</h3>
            <p className="text-white/90 text-sm">{example.profession}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Handle */}
        <div className={cn('rounded-lg p-3 mb-4', example.colors.secondary)}>
          <p className="text-sm text-gray-600 mb-1">Handle</p>
          <p className="font-bold text-gray-900">onprez.com/{example.handle}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {/* Bookings */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-onprez-green" />
              <p className="text-lg font-bold text-gray-900">{example.stats.bookings}</p>
            </div>
            <p className="text-xs text-gray-600">Bookings</p>
          </div>

          {/* Views */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Eye className="w-4 h-4 text-onprez-blue" />
              <p className="text-lg font-bold text-gray-900">{example.stats.views}</p>
            </div>
            <p className="text-xs text-gray-600">Views</p>
          </div>

          {/* Rating */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <p className="text-lg font-bold text-gray-900">{example.stats.rating}</p>
            </div>
            <p className="text-xs text-gray-600">Rating</p>
          </div>
        </div>

        {/* View Button */}
        <motion.button
          className={cn(
            'w-full mt-4 py-3 rounded-lg font-semibold text-white text-sm bg-gradient-to-r',
            example.colors.primary
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          View Live Page
        </motion.button>
      </div>

      {/* Hover Glow Effect */}
      {isCenter && (
        <motion.div
          className={cn(
            'absolute inset-0 bg-gradient-to-br opacity-0 pointer-events-none',
            example.colors.primary
          )}
          whileHover={{ opacity: 0.1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.div>
  )
}
