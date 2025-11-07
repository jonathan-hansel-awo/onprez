'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

type ReactionType = 'neutral' | 'interested' | 'impressed' | 'nodding' | 'excited' | 'celebrating'

interface ClientReactionProps {
  reaction: ReactionType
  caption?: string
}

export function ClientReaction({ reaction, caption }: ClientReactionProps) {
  const getExpression = () => {
    switch (reaction) {
      case 'neutral':
        return '😐'
      case 'interested':
        return '🤔'
      case 'impressed':
        return '😮'
      case 'nodding':
        return '😊'
      case 'excited':
        return '😃'
      case 'celebrating':
        return '🎉'
      default:
        return '😐'
    }
  }

  const getAnimation = () => {
    switch (reaction) {
      case 'interested':
        return {
          scale: [1, 1.05, 1],
          rotate: [0, -5, 5, 0],
        }
      case 'impressed':
        return {
          scale: [1, 1.1, 1.05],
        }
      case 'nodding':
        return {
          y: [0, -5, 0, -5, 0],
        }
      case 'excited':
        return {
          scale: [1, 1.15, 1.1],
          rotate: [0, -10, 10, 0],
        }
      case 'celebrating':
        return {
          y: [0, -20, 0],
          rotate: [0, 360],
        }
      default:
        return {}
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar Container */}
      <div className="relative">
        {/* Background Glow */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-onprez-blue/20 to-onprez-purple/20 rounded-full blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Avatar Face */}
        <motion.div
          className="relative w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-6xl shadow-2xl border-4 border-white"
          animate={getAnimation()}
          transition={{
            duration: 0.8,
            ease: 'easeInOut',
          }}
        >
          <motion.div
            key={reaction}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            {getExpression()}
          </motion.div>
        </motion.div>

        {/* Reaction Indicator */}
        {reaction === 'celebrating' && (
          <>
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-400 rounded-full"
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  x: Math.cos((i * Math.PI * 2) / 8) * 60,
                  y: Math.sin((i * Math.PI * 2) / 8) * 60,
                }}
                transition={{
                  duration: 0.8,
                  ease: 'easeOut',
                }}
              />
            ))}
          </>
        )}
      </div>

      {/* Caption */}
      <AnimatePresence mode="wait">
        {caption && (
          <motion.div
            key={caption}
            className="bg-white px-4 py-3 rounded-full shadow-lg border border-gray-200"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-sm font-medium text-gray-900">{caption}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thought Bubble */}
      {reaction === 'interested' && (
        <motion.div
          className="absolute -right-8 top-8"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="relative bg-white px-3 py-2 rounded-lg shadow-lg text-xs">
            Interesting...
            <div className="absolute -left-1 top-1/2 w-2 h-2 bg-white transform -translate-y-1/2 rotate-45" />
          </div>
        </motion.div>
      )}
    </div>
  )
}
