'use client'

import { useState, useEffect } from 'react'

export function useHandleValidation(input: string) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [sanitized, setSanitized] = useState('')

  useEffect(() => {
    if (!input.trim()) {
      setStatus('idle')
      setSanitized('')
      return
    }

    const sanitizedHandle = input
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    setSanitized(sanitizedHandle)

    // Simulate availability check
    const timer = setTimeout(() => {
      setStatus('checking')

      // Simulate API call
      setTimeout(() => {
        // Simple mock: handles with 'test' or 'demo' are taken
        const isTaken = sanitizedHandle.includes('test') || sanitizedHandle.includes('demo')
        setStatus(isTaken ? 'taken' : 'available')
      }, 500)
    }, 500)

    return () => clearTimeout(timer)
  }, [input])

  const suggestions =
    status === 'taken' ? [`${sanitized}-pro`, `${sanitized}-studio`, `${sanitized}-official`] : []

  return { status, sanitized, suggestions }
}
