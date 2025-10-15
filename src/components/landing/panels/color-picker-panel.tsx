'use client'

import { motion } from 'framer-motion'

interface ColorPickerPanelProps {
  selectedColor: string
  onColorChange: (color: string) => void
}

export function ColorPickerPanel({ selectedColor, onColorChange }: ColorPickerPanelProps) {
  const colors = [
    { name: 'blue', value: 'blue', bg: 'bg-blue-500' },
    { name: 'purple', value: 'purple', bg: 'bg-purple-500' },
    { name: 'green', value: 'green', bg: 'bg-green-500' },
    { name: 'pink', value: 'pink', bg: 'bg-pink-500' },
  ]

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-600 mb-2">Brand Colors</p>
      <div className="grid grid-cols-4 gap-2">
        {colors.map(color => (
          <motion.button
            key={color.value}
            className={`w-10 h-10 rounded-lg ${color.bg} relative`}
            onClick={() => onColorChange(color.value)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {selectedColor === color.value && (
              <motion.div
                className="absolute inset-0 border-2 border-white rounded-lg shadow-lg"
                layoutId="colorSelector"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
