'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Auth error:', error)
  }, [error])

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="backdrop-blur-xl bg-white/95 border-white/20">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>

            <p className="text-gray-600 mb-6">
              We encountered an unexpected error. Please try again.
            </p>

            <div className="space-y-3">
              <Button onClick={reset} variant="primary" className="w-full">
                Try again
              </Button>

              <Button
                onClick={() => (window.location.href = '/')}
                variant="ghost"
                className="w-full"
              >
                Go to homepage
              </Button>
            </div>

            {error.digest && <p className="mt-6 text-xs text-gray-400">Error ID: {error.digest}</p>}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
