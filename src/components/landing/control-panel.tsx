'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { ReactNode } from 'react'

interface ControlPanelProps {
  title: string
  icon: ReactNode
  position: 'left' | 'top' | 'bottom' | 'right'
  children: ReactNode
  isActive?: boolean
}

export function ControlPanel({
  title,
  icon,
  position,
  children,
  isActive = false,
}: ControlPanelProps) {
  const getPositionClasses = () => {
    switch (position) {
      case 'left':
        return 'left-0 top-1/2 -translate-y-1/2 -translate-x-full mr-4'
      case 'top':
        return 'top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-4'
      case 'bottom':
        return 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full mt-4'
      case 'right':
        return 'right-0 top-1/2 -translate-y-1/2 translate-x-full ml-4'
    }
  }

  const getInitialPosition = () => {
    switch (position) {
      case 'left':
        return { x: 100, opacity: 0 }
      case 'top':
        return { y: 100, opacity: 0 }
      case 'bottom':
        return { y: -100, opacity: 0 }
      case 'right':
        return { x: -100, opacity: 0 }
    }
  }

  return (
    <motion.div
      className={cn(
        'absolute bg-white rounded-xl shadow-2xl border-2 p-4 min-w-[200px]',
        isActive ? 'border-onprez-blue' : 'border-gray-200',
        getPositionClasses()
      )}
      initial={getInitialPosition()}
      animate={{ x: 0, y: 0, opacity: 1 }}
      exit={getInitialPosition()}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 20,
      }}
      whileHover={{
        scale: 1.05,
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200">
        <div className="text-2xl">{icon}</div>
        <h4 className="font-semibold text-gray-900">{title}</h4>
      </div>

      {/* Content */}
      <div>{children}</div>

      {/* Active Indicator */}
      {isActive && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-onprez-blue rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </motion.div>
  )
}
