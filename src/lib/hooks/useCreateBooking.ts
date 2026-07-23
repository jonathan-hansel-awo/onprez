import { useCallback, useRef, useState } from 'react'

export interface BookingPayload {
  businessId: string
  serviceId: string
  date: string
  startTime: string
  endTime: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  customerNotes?: string
  acceptCancellationPolicy?: boolean
}

export interface BookingResponse {
  id: string
  confirmationNumber: string
  status: string
  requiresPayment?: boolean
  checkoutUrl?: string
  checkoutSessionId?: string
  checkoutExpiresAt?: string
  depositAmount?: number
  remainingAmount?: number
  startTime?: string
  endTime?: string
  service?: {
    name: string
    price: number
    duration: number
  }
  customer?: {
    name: string
    email: string
  }
  business?: {
    name: string
    timezone: string
  }
  notes?: string | null
  createdAt?: string
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
  if (result.error && result.error !== 'Validation failed') return result.error

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
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey

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

  const reset = useCallback(() => setError(null), [])

  const createBooking = useCallback(async (payload: BookingPayload) => {
    if (submittingRef.current) return null

    submittingRef.current = true
    setIsLoading(true)
    setError(null)

    try {
      const fingerprint = JSON.stringify(payload)
      if (idempotencyRef.current?.fingerprint !== fingerprint) {
        idempotencyRef.current = { fingerprint, key: crypto.randomUUID() }
      }

      let { response, result } = await sendBookingRequest(payload, idempotencyRef.current.key)

      if (response.status >= 500 && result.error === 'Failed to create booking') {
        const retry = await sendBookingRequest(payload)
        response = retry.response
        result = retry.result
      }

      if (!response.ok || !result.data) {
        // A failed Checkout setup cancels its reservation. A new attempt must use
        // a new key so it can create a fresh appointment rather than replaying it.
        if (response.status >= 500) idempotencyRef.current = null
        setError(getBookingError(result, response.status))
        return null
      }

      return result.data
    } catch (err) {
      idempotencyRef.current = null
      setError(
        err instanceof Error
          ? `${err.message}. Check your connection and try again.`
          : 'The booking could not be confirmed. Check your connection and try again.'
      )
      return null
    } finally {
      submittingRef.current = false
      setIsLoading(false)
    }
  }, [])

  return { createBooking, isLoading, error, reset }
}
