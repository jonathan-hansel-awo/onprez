import { useState, useCallback, useRef } from 'react'

interface BookingPayload {
  businessId: string
  serviceId: string
  date: string // YYYY-MM-DD
  startTime: string // HH:MM
  endTime: string // HH:MM
  customerName: string
  customerEmail: string
  customerPhone?: string
  customerNotes?: string
}

interface BookingResponse {
  id: string
  confirmationNumber: string
  status: string
  startTime: string
  endTime: string
  service: {
    name: string
    price: number
    duration: number
  }
  customer: {
    name: string
    email: string
  }
  business: {
    name: string
    timezone: string
  }
  notes: string | null
  createdAt: string
}

interface UseCreateBookingReturn {
  createBooking: (payload: BookingPayload) => Promise<BookingResponse | null>
  isLoading: boolean
  error: string | null
  reset: () => void
}

export function useCreateBooking(): UseCreateBookingReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const idempotencyRef = useRef<{ fingerprint: string; key: string } | null>(null)
  const submittingRef = useRef(false)

  const reset = useCallback(() => {
    setError(null)
  }, [])

  const createBooking = useCallback(
    async (payload: BookingPayload): Promise<BookingResponse | null> => {
      if (submittingRef.current) return null

      submittingRef.current = true
      setIsLoading(true)
      setError(null)

      try {
        const fingerprint = JSON.stringify(payload)
        if (idempotencyRef.current?.fingerprint !== fingerprint) {
          idempotencyRef.current = { fingerprint, key: crypto.randomUUID() }
        }

        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyRef.current.key,
          },
          body: JSON.stringify(payload),
        })

        const result = await response.json()

        if (!response.ok) {
          const errorMessage =
            result.error || 'We could not confirm the booking. Review the details and try again.'
          setError(errorMessage)
          return null
        }

        return result.data as BookingResponse
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? `${err.message}. Check your connection and try again.`
            : 'The booking could not be confirmed. Check your connection and try again.'
        setError(errorMessage)
        return null
      } finally {
        submittingRef.current = false
        setIsLoading(false)
      }
    },
    []
  )

  return {
    createBooking,
    isLoading,
    error,
    reset,
  }
}
