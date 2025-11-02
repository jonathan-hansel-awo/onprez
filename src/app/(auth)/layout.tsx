'use client'

import { motion } from 'framer-motion'
import { Logo } from '@/components/navigation'
import { GradientMesh } from '@/components/landing'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-onprez-blue via-onprez-purple to-onprez-blue">
        <GradientMesh />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute top-8 left-8"
        >
          <Logo variant="white" />
        </motion.div>

        {/* Main content */}
        <div className="min-h-screen flex items-center justify-center px-4 py-24">{children}</div>
      </div>
    </div>
  )
}
