/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    fps: 0,
    memory: 0,
    loadTime: 0,
  })
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return

    let frameCount = 0
    let lastTime = performance.now()
    let animationFrameId: number

    function updateFPS() {
      const currentTime = performance.now()
      frameCount++

      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))

        setMetrics(prev => ({
          ...prev,
          fps,
          memory: (performance as any).memory
            ? //@typescript-eslint/no-explicit-any
              Math.round((performance as any).memory.usedJSHeapSize / 1048576)
            : 0,
        }))

        frameCount = 0
        lastTime = currentTime
      }

      animationFrameId = requestAnimationFrame(updateFPS)
    }

    // Get load time
    if (performance.timing) {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart
      setMetrics(prev => ({ ...prev, loadTime: Math.round(loadTime) }))
    }

    animationFrameId = requestAnimationFrame(updateFPS)

    // Keyboard shortcut to toggle (Ctrl + Shift + P)
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setShow(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyPress)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [])

  if (process.env.NODE_ENV !== 'development') return null

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed bottom-4 right-4 z-[9999] bg-black/90 backdrop-blur-sm text-white p-4 rounded-lg shadow-2xl font-mono text-xs"
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          drag
          dragMomentum={false}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm">Performance Monitor</h3>
            <button onClick={() => setShow(false)} className="text-gray-400 hover:text-white">
              ✕
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">FPS:</span>
              <span
                className={
                  metrics.fps >= 60
                    ? 'text-green-400'
                    : metrics.fps >= 30
                      ? 'text-yellow-400'
                      : 'text-red-400'
                }
              >
                {metrics.fps}
              </span>
            </div>

            {metrics.memory > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Memory:</span>
                <span
                  className={
                    metrics.memory < 50
                      ? 'text-green-400'
                      : metrics.memory < 100
                        ? 'text-yellow-400'
                        : 'text-red-400'
                  }
                >
                  {metrics.memory}MB
                </span>
              </div>
            )}

            {metrics.loadTime > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Load:</span>
                <span
                  className={
                    metrics.loadTime < 2000
                      ? 'text-green-400'
                      : metrics.loadTime < 3000
                        ? 'text-yellow-400'
                        : 'text-red-400'
                  }
                >
                  {metrics.loadTime}ms
                </span>
              </div>
            )}
          </div>

          <div className="mt-2 pt-2 border-t border-gray-700 text-[10px] text-gray-500">
            Press Ctrl+Shift+P to toggle
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
