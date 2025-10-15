'use client'

import { motion } from 'framer-motion'

interface ConnectingLineProps {
  fromX: number
  fromY: number
  toX: number
  toY: number
  delay?: number
}

export function ConnectingLine({ fromX, fromY, toX, toY, delay = 0 }: ConnectingLineProps) {
  // Calculate the path
  const midX = (fromX + toX) / 2
  const midY = (fromY + toY) / 2

  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
      <motion.path
        d={`M ${fromX} ${fromY} Q ${midX} ${midY - 50} ${toX} ${toY}`}
        stroke="url(#lineGradient)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        exit={{ pathLength: 0, opacity: 0 }}
        transition={{ duration: 0.8, delay, ease: 'easeInOut' }}
      />

      {/* Gradient definition */}
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.5" />
          <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#EC4899" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {/* Animated dot along the path */}
      <motion.circle
        r="4"
        fill="#3B82F6"
        initial={{ offsetDistance: '0%', opacity: 0 }}
        animate={{ offsetDistance: '100%', opacity: [0, 1, 1, 0] }}
        transition={{ duration: 1.5, delay: delay + 0.3, ease: 'easeInOut' }}
        style={{
          offsetPath: `path('M ${fromX} ${fromY} Q ${midX} ${midY - 50} ${toX} ${toY}')`,
          offsetRotate: '0deg',
        }}
      />
    </svg>
  )
}
