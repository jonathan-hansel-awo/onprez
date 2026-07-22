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

interface BookingApiResult {
  success?: boolean
  data?: BookingResponse
  error?: string
  details?: Record<string, string[] | undefined>
}

function getBookingError(result: BookingApiResult, status: number): string {
  if (result.error && result.error !== 'Validation failed') {
    return result.error
  }

  const validationMessage = result.details
    ? Object.values(result.details)
        .flatMap(messages => messages || [])
        .find(Boolean)
    : undefined

  if (validationMessage) return validationMessage

  if (status >= 500) {
    return 'The booking service is temporarily unavailable. Please try again in a moment.'
  }

  return 'We could not confirm the booking. Review the details and try again.'
}

async function sendBookingRequest(
  payload: BookingPayload,
  idempotencyKey?: string
): Promise<{ response: Response; result: BookingApiResult }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey
  }

  const response = await fetch('/api/bookings', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  const result = (await response.json().catch(() => ({}))) as BookingApiResult
  return { response, result }
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

        let { response, result } = await sendBookingRequest(
          payload,
          idempotencyRef.current.key
        )

        // Compatibility fallback for deployments where the idempotency table
        // migration has not reached production yet. The booking service still
        // uses a transaction lock and conflict checks, so this retry cannot
        // silently double-book the selected slot.
        if (response.status >= 500 && result.error === 'Failed to create booking') {
          const retry = await sendBookingRequest(payload)
          response = retry.response
          result = retry.result
        }

        if (!response.ok || !result.data) {
          setError(getBookingError(result, response.status))
          return null
        }

        return result.data
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
