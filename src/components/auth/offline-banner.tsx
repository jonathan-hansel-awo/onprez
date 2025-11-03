'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useOnlineStatus } from '@/lib/hooks/use-online-status'
import { WifiOff } from 'lucide-react'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white py-3 px-4 text-center"
        >
          <div className="flex items-center justify-center gap-2">
            <WifiOff className="w-5 h-5" />
            <span className="font-medium">
              You&apos;re offline. Please check your internet connection.
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
