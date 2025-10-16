'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils/cn'

interface ChaoticWindowProps {
  type: 'social media' | 'calendar' | 'spreadsheet' | 'website'
  delay?: number
}

export function ChaoticWindow({ type, delay = 0 }: ChaoticWindowProps) {
  const [randomValues, setRandomValues] = useState({
    x: 0,
    y: 0,
    rotate: 0,
  })

  // Generate random values only on client after hydration
  useEffect(() => {
    setRandomValues({
      x: Math.random() * 100 - 50,
      y: Math.random() * 100 - 50,
      rotate: Math.random() * 20 - 10,
    })
  }, [])

  const getWindowContent = () => {
    switch (type) {
      case 'social media':
        return {
          title: 'Social Media',
          color: 'from-pink-500 to-purple-500',
          icon: '📱',
          content: (
            <div className="space-y-2">
              <div className="h-3 bg-white/20 rounded w-3/4" />
              <div className="h-3 bg-white/20 rounded w-1/2" />
              <div className="grid grid-cols-3 gap-1 mt-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-square bg-white/30 rounded" />
                ))}
              </div>
            </div>
          ),
        }
      case 'calendar':
        return {
          title: 'Calendar',
          color: 'from-blue-500 to-cyan-500',
          icon: '📅',
          content: (
            <div className="space-y-1">
              <div className="grid grid-cols-7 gap-1">
                {[...Array(21)].map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-white/20 rounded text-[6px] flex items-center justify-center"
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          ),
        }
      case 'spreadsheet':
        return {
          title: 'Spreadsheet',
          color: 'from-green-500 to-emerald-500',
          icon: '📊',
          content: (
            <div className="space-y-1">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex gap-1">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-2 bg-white/20 rounded flex-1" />
                  ))}
                </div>
              ))}
            </div>
          ),
        }
      case 'website':
        return {
          title: 'Website',
          color: 'from-orange-500 to-red-500',
          icon: '🌐',
          content: (
            <div className="space-y-2">
              <div className="h-2 bg-white/20 rounded w-full" />
              <div className="h-2 bg-white/20 rounded w-2/3" />
              <div className="grid grid-cols-2 gap-1 mt-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-8 bg-white/30 rounded" />
                ))}
              </div>
            </div>
          ),
        }
    }
  }

  const window = getWindowContent()

  return (
    <motion.div
      className="absolute w-48 md:w-56"
      initial={{
        x: randomValues.x,
        y: randomValues.y,
        rotate: randomValues.rotate,
        opacity: 0,
        scale: 0.8,
      }}
      animate={{
        x: 0,
        y: 0,
        rotate: randomValues.rotate / 2,
        opacity: 1,
        scale: 1,
      }}
      transition={{
        delay,
        duration: 0.6,
        type: 'spring',
        stiffness: 100,
        damping: 15,
      }}
    >
      {/* Window */}
      <div
        className={cn(
          'bg-gradient-to-br rounded-lg shadow-2xl overflow-hidden border-2 border-white/20',
          window.color
        )}
      >
        {/* Title Bar */}
        <div className="bg-black/20 px-3 py-2 flex items-center justify-between">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <div className="w-2 h-2 rounded-full bg-green-400" />
          </div>
          <div className="text-xs text-white font-medium flex items-center gap-1">
            <span>{window.icon}</span>
            <span>{window.title}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 text-white">{window.content}</div>
      </div>

      {/* Continuous shake animation */}
      <motion.div
        className="absolute inset-0"
        animate={{
          x: [0, -2, 2, -2, 2, 0],
          y: [0, 2, -2, 2, -2, 0],
        }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          repeatDelay: 3,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  )
}
