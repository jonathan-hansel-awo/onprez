'use client'

import { useState, useCallback } from 'react'
import { debounce } from '@/lib/utils/debounce'

interface UseHandleAvailabilityReturn {
  isChecking: boolean
  isAvailable: boolean | null
  message: string | null
  checkHandle: (handle: string) => void
}

export function useHandleAvailability(): UseHandleAvailabilityReturn {
  const [isChecking, setIsChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const checkHandleAvailability = async (handle: string) => {
    if (!handle || handle.length < 3) {
      setIsAvailable(null)
      setMessage(null)
      return
    }

    setIsChecking(true)

    try {
      const response = await fetch(`/api/auth/check-handle?handle=${encodeURIComponent(handle)}`)
      const result = await response.json()

      setIsAvailable(result.available)
      setMessage(result.reason || null)
    } catch (error) {
      setIsAvailable(null)
      setMessage(`Failed to check availability: ${error}`)
    } finally {
      setIsChecking(false)
    }
  }

  // Debounce the check function
  const debouncedCheck = useCallback(
    debounce((handle: string) => checkHandleAvailability(handle), 500),
    []
  )

  const checkHandle = (handle: string) => {
    debouncedCheck(handle)
  }

  return {
    isChecking,
    isAvailable,
    message,
    checkHandle,
  }
}
