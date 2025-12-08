'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface ConfettiProps {
  active: boolean
}

export function Confetti({ active }: ConfettiProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; color: string }>>([])

  useEffect(() => {
    if (active) {
      const newParticles = [...Array(50)].map((_, i) => ({
        id: i,
        x: Math.random() * 100 - 50,
        color: ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'][
          Math.floor(Math.random() * 5)
        ],
      }))
      setParticles(newParticles)

      const timer = setTimeout(() => {
        setParticles([])
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [active])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute w-3 h-3 rounded-full"
          style={{
            backgroundColor: particle.color,
            left: '50%',
            top: '50%',
          }}
          initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
          animate={{
            scale: [0, 1, 1, 0],
            x: particle.x * 5,
            y: [0, -100 - Math.random() * 100, -200 - Math.random() * 100],
            opacity: [1, 1, 0],
            rotate: Math.random() * 360,
          }}
          transition={{
            duration: 2,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  )
}
