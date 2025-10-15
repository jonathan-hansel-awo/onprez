'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface GradientMeshProps {
  className?: string
}

export function GradientMesh({ className }: GradientMeshProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY,
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className={className}>
      {/* Primary gradient orb - top left */}
      <motion.div
        className="absolute w-96 h-96 rounded-full blur-3xl opacity-60"
        style={{
          background:
            'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(59, 130, 246, 0) 70%)',
          top: '10%',
          left: '10%',
        }}
        animate={{
          x: mousePosition.x * 0.02,
          y: mousePosition.y * 0.02,
        }}
        transition={{ type: 'spring', stiffness: 50, damping: 20 }}
      />

      {/* Secondary gradient orb - bottom right */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-50"
        style={{
          background:
            'radial-gradient(circle, rgba(139, 92, 246, 0.35) 0%, rgba(139, 92, 246, 0) 70%)',
          bottom: '10%',
          right: '10%',
        }}
        animate={{
          x: -mousePosition.x * 0.015,
          y: -mousePosition.y * 0.015,
        }}
        transition={{ type: 'spring', stiffness: 50, damping: 20 }}
      />

      {/* Tertiary gradient orb - center */}
      <motion.div
        className="absolute w-80 h-80 rounded-full blur-3xl opacity-40"
        style={{
          background:
            'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0) 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.4, 0.5, 0.4],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white/30 rounded-full"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
