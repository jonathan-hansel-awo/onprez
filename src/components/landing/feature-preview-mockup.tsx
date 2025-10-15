'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface FeaturePreviewMockupProps {
  colorScheme?: string
  fontStyle?: string
  layout?: string
}

export function FeaturePreviewMockup({
  colorScheme = 'blue',
  fontStyle = 'modern',
  layout = 'default',
}: FeaturePreviewMockupProps) {
  const getColorScheme = () => {
    switch (colorScheme) {
      case 'blue':
        return {
          primary: 'from-blue-500 to-blue-600',
          secondary: 'bg-blue-50',
          text: 'text-blue-600',
          accent: 'bg-blue-500',
        }
      case 'purple':
        return {
          primary: 'from-purple-500 to-purple-600',
          secondary: 'bg-purple-50',
          text: 'text-purple-600',
          accent: 'bg-purple-500',
        }
      case 'green':
        return {
          primary: 'from-green-500 to-green-600',
          secondary: 'bg-green-50',
          text: 'text-green-600',
          accent: 'bg-green-500',
        }
      case 'pink':
        return {
          primary: 'from-pink-500 to-pink-600',
          secondary: 'bg-pink-50',
          text: 'text-pink-600',
          accent: 'bg-pink-500',
        }
      default:
        return {
          primary: 'from-blue-500 to-blue-600',
          secondary: 'bg-blue-50',
          text: 'text-blue-600',
          accent: 'bg-blue-500',
        }
    }
  }

  const getFontClass = () => {
    switch (fontStyle) {
      case 'modern':
        return 'font-sans'
      case 'classic':
        return 'font-serif'
      case 'playful':
        return 'font-mono'
      default:
        return 'font-sans'
    }
  }

  const colors = getColorScheme()
  const fontClass = getFontClass()

  return (
    <motion.div
      className="w-full max-w-sm mx-auto bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200"
      layout
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <motion.div className={cn('bg-gradient-to-r p-6', colors.primary)} layout="position">
        <motion.div className="flex items-center gap-4" layout="position">
          <motion.div
            className={cn(
              'w-16 h-16 rounded-full bg-white flex items-center justify-center text-2xl shadow-lg',
              colors.text
            )}
            layoutId="avatar"
          >
            🎨
          </motion.div>
          <motion.div layout="position" className={fontClass}>
            <h3 className="text-white font-bold text-lg">Your Brand</h3>
            <p className="text-white/80 text-sm">Your tagline here</p>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Content */}
      <div className={cn('p-4 space-y-3', fontClass)}>
        {/* Services Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={layout}
            className={cn('grid gap-2', layout === 'stacked' ? 'grid-cols-1' : 'grid-cols-2')}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            {[
              { icon: '💼', label: 'Service One' },
              { icon: '✨', label: 'Service Two' },
            ].map((service, i) => (
              <motion.div key={i} className={cn('rounded-lg p-3', colors.secondary)} layout>
                <div className="text-2xl mb-1">{service.icon}</div>
                <p className={cn('text-xs font-semibold', colors.text)}>{service.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Gallery */}
        <motion.div className="grid grid-cols-3 gap-1.5" layout="position">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className={cn('aspect-square rounded', colors.accent, 'opacity-20')}
              layout
            />
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.button
          className={cn(
            'w-full bg-gradient-to-r text-white py-3 rounded-lg font-semibold text-sm',
            colors.primary
          )}
          layout="position"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Book Now
        </motion.button>
      </div>
    </motion.div>
  )
}
