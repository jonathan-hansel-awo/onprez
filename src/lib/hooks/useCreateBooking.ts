import { useState, useCallback } from 'react'

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

  const reset = useCallback(() => {
    setError(null)
  }, [])

  const createBooking = useCallback(
    async (payload: BookingPayload): Promise<BookingResponse | null> => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        const result = await response.json()

        if (!response.ok) {
          const errorMessage = result.error || 'Failed to create booking'
          setError(errorMessage)
          return null
        }

        return result.data as BookingResponse
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
        setError(errorMessage)
        return null
      } finally {
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
