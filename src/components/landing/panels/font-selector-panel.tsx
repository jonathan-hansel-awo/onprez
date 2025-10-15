'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface FontSelectorPanelProps {
  selectedFont: string
  onFontChange: (font: string) => void
}

export function FontSelectorPanel({ selectedFont, onFontChange }: FontSelectorPanelProps) {
  const fonts = [
    { name: 'Modern', value: 'modern', class: 'font-sans' },
    { name: 'Classic', value: 'classic', class: 'font-serif' },
    { name: 'Playful', value: 'playful', class: 'font-mono' },
  ]

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-600 mb-2">Typography</p>
      <div className="space-y-1">
        {fonts.map(font => (
          <motion.button
            key={font.value}
            className={cn(
              'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
              font.class,
              selectedFont === font.value
                ? 'bg-onprez-blue text-white'
                : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
            )}
            onClick={() => onFontChange(font.value)}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            {font.name}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
