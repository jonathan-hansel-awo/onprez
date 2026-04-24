'use client'

import { StepId, STEPS } from '@/types/how-it-works'
import { motion } from 'framer-motion'

interface StepDotsProps {
  activeStep: StepId
  onStepClick: (id: StepId) => void
  /** Progress of current step's auto-advance timer, 0–1. Used to fill the active dot. */
  progress: number
  /** When true, don't animate the fill (user has taken manual control). */
  paused: boolean
}

export function StepDots({ activeStep, onStepClick, progress, paused }: StepDotsProps) {
  return (
    <div
      role="tablist"
      aria-label="How it works step navigation"
      className="flex items-center justify-center gap-3"
    >
      {STEPS.map(step => {
        const isActive = step.id === activeStep
        return (
          <button
            key={step.id}
            role="tab"
            aria-selected={isActive}
            aria-label={`Go to step ${step.id}: ${step.title}`}
            onClick={() => onStepClick(step.id)}
            className="group relative flex h-6 items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-full"
          >
            <motion.div
              animate={{
                width: isActive ? 36 : 8,
              }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className={`relative h-2 overflow-hidden rounded-full ${
                isActive ? 'bg-slate-200' : 'bg-slate-300 group-hover:bg-slate-400'
              }`}
            >
              {isActive && (
                <motion.div
                  // The key forces remount on step change so progress animates from 0
                  key={`${step.id}-${paused ? 'paused' : 'running'}`}
                  initial={{ width: paused ? `${progress * 100}%` : '0%' }}
                  animate={{ width: paused ? `${progress * 100}%` : '100%' }}
                  transition={
                    paused ? { duration: 0 } : { duration: step.duration / 1000, ease: 'linear' }
                  }
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-blue-600"
                />
              )}
            </motion.div>
          </button>
        )
      })}
    </div>
  )
}
