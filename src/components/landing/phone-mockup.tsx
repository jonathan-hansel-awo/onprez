'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { useInView } from 'react-intersection-observer'

interface PhoneMockupProps {
  children: ReactNode
  className?: string
}

export function PhoneMockup({ children, className }: PhoneMockupProps) {
  const { ref, inView } = useInView({
    threshold: 0.3,
    triggerOnce: true,
  })

  return (
    <div ref={ref} className={className}>
      {/* Phone Frame */}
      <motion.div
        className="relative mx-auto w-[240px] md:w-[280px] h-[480px] md:h-[560px] bg-gray-900 rounded-[2rem] md:rounded-[3rem] p-2 md:p-3 shadow-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.8 }}
      >
        {/* Phone Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 md:w-32 h-5 md:h-6 bg-gray-900 rounded-b-2xl z-10">
          <div className="absolute top-1.5 md:top-2 left-1/2 -translate-x-1/2 w-10 md:w-12 h-1 bg-gray-800 rounded-full" />
        </div>

        {/* Screen */}
        <div className="relative w-full h-full bg-white rounded-[1.75rem] md:rounded-[2.5rem] overflow-hidden">
          {/* Status Bar */}
          <div className="absolute top-0 left-0 right-0 h-6 md:h-8 bg-white z-20 px-4 md:px-6 flex items-center justify-between text-xs font-semibold">
            <span className="text-gray-900 text-[10px] md:text-xs">9:41</span>
            <div className="flex items-center gap-0.5 md:gap-1">
              <svg className="w-3 h-3 md:w-4 md:h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <svg className="w-2.5 h-2.5 md:w-3 md:h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z" />
              </svg>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="absolute top-6 md:top-8 left-0 right-0 bottom-0 overflow-hidden">
            {children}
          </div>
        </div>

        {/* Phone Home Indicator */}
        <div className="absolute bottom-1 md:bottom-2 left-1/2 -translate-x-1/2 w-24 md:w-32 h-0.5 md:h-1 bg-gray-700 rounded-full" />
      </motion.div>

      {/* Phone Shadow/Reflection - Disabled on mobile for performance */}
      <motion.div
        className="hidden md:block absolute inset-0 -z-10 bg-gradient-to-b from-gray-400/20 to-gray-600/20 rounded-[3rem] blur-2xl"
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  )
}
