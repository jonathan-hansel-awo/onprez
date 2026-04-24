'use client'

import { StepId, STEPS } from '@/types/how-it-works'
import { motion, AnimatePresence } from 'framer-motion'

interface StepListProps {
  activeStep: StepId
  onStepClick: (id: StepId) => void
}

export function StepList({ activeStep, onStepClick }: StepListProps) {
  return (
    <ol className="flex flex-col gap-6">
      {STEPS.map(step => {
        const isActive = step.id === activeStep
        return (
          <li key={step.id}>
            <button
              type="button"
              onClick={() => onStepClick(step.id)}
              className="group relative block w-full text-left"
              aria-current={isActive ? 'step' : undefined}
            >
              {/* Active indicator bar */}
              <div className="absolute -left-4 top-0 bottom-0 flex w-[3px] items-start overflow-hidden rounded-full bg-slate-200 sm:-left-5">
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="step-indicator"
                      initial={{ height: 0 }}
                      animate={{ height: '100%' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="w-full bg-gradient-to-b from-indigo-500 to-blue-600"
                    />
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-start gap-4">
                {/* Step number circle */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all duration-500 ${
                    isActive
                      ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/25'
                      : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600'
                  }`}
                >
                  {String(step.id).padStart(2, '0')}
                </div>

                <div className="flex-1 pt-1">
                  <h3
                    className={`text-xl font-bold tracking-tight transition-colors duration-500 sm:text-2xl ${
                      isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  >
                    {step.title}
                  </h3>

                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.p
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden text-base leading-relaxed text-slate-600"
                      >
                        {step.description}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
