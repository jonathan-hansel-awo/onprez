'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { Grid2X2, Layers } from 'lucide-react'

interface LayoutOptionsPanelProps {
  selectedLayout: string
  onLayoutChange: (layout: string) => void
}

export function LayoutOptionsPanel({ selectedLayout, onLayoutChange }: LayoutOptionsPanelProps) {
  const layouts = [
    { name: 'Grid', value: 'default', icon: Grid2X2 },
    { name: 'Stacked', value: 'stacked', icon: Layers },
  ]

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-600 mb-2">Layout Style</p>
      <div className="grid grid-cols-2 gap-2">
        {layouts.map(layout => {
          const Icon = layout.icon
          return (
            <motion.button
              key={layout.value}
              className={cn(
                'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors',
                selectedLayout === layout.value
                  ? 'border-onprez-blue bg-onprez-blue/5'
                  : 'border-gray-200 hover:border-gray-300'
              )}
              onClick={() => onLayoutChange(layout.value)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon
                className={cn(
                  'w-5 h-5',
                  selectedLayout === layout.value ? 'text-onprez-blue' : 'text-gray-600'
                )}
              />
              <span
                className={cn(
                  'text-xs font-medium',
                  selectedLayout === layout.value ? 'text-onprez-blue' : 'text-gray-600'
                )}
              >
                {layout.name}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
