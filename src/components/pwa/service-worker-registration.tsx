'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const registerServiceWorker = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        })
      } catch (error) {
        console.error('Unable to register the OnPrez service worker:', error)
      }
    }

    if (document.readyState === 'complete') {
      void registerServiceWorker()
      return
    }

    window.addEventListener('load', registerServiceWorker)
    return () => window.removeEventListener('load', registerServiceWorker)
  }, [])

  return null
}
