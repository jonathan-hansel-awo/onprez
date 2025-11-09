'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Palette, Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface ColorPickerProps {
  label?: string
  value: string
  onChange: (color: string) => void
  presetColors?: string[]
}

const DEFAULT_COLORS = [
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#06B6D4',
  '#8B5CF6',
  '#6366F1',
  '#14B8A6',
  '#F97316',
  '#84CC16',
  '#A855F7',
  '#EC4899',
  '#64748B',
]

export function ColorPicker({
  label,
  value,
  onChange,
  presetColors = DEFAULT_COLORS,
}: ColorPickerProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [customColor, setCustomColor] = useState(value)

  return (
    <div className="relative w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}

      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="w-full flex items-center gap-3 px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-onprez-blue transition-colors"
      >
        <div
          className="w-8 h-8 rounded-lg border-2 border-gray-200"
          style={{ backgroundColor: value }}
        />
        <span className="text-sm font-mono text-gray-700">{value}</span>
        <Palette className="w-5 h-5 text-gray-400 ml-auto" />
      </button>

      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 mt-2 p-4 bg-white rounded-xl shadow-2xl border-2 border-gray-200 w-full"
          >
            <div className="space-y-4">
              {/* Preset colors */}
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">Preset Colors</p>
                <div className="grid grid-cols-5 gap-2">
                  {presetColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        onChange(color)
                        setCustomColor(color)
                        setShowPicker(false)
                      }}
                      className={cn(
                        'w-full aspect-square rounded-lg border-2 transition-all',
                        value === color
                          ? 'border-gray-900 scale-110'
                          : 'border-gray-200 hover:scale-105'
                      )}
                      style={{ backgroundColor: color }}
                    >
                      {value === color && <Check className="w-4 h-4 text-white m-auto" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom color */}
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">Custom Color</p>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customColor}
                    onChange={e => setCustomColor(e.target.value)}
                    className="w-12 h-12 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customColor}
                    onChange={e => setCustomColor(e.target.value)}
                    className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg font-mono text-sm"
                    placeholder="#000000"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onChange(customColor)
                      setShowPicker(false)
                    }}
                    className="px-4 py-2 bg-onprez-blue text-white rounded-lg hover:bg-onprez-blue/90 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
