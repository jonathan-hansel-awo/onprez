type CalendarDate = Pick<Date, 'getFullYear' | 'getMonth' | 'getDate'>

type SessionStorageLike = Pick<Storage, 'getItem' | 'setItem'>

const BOOKING_CONFIRMATION_EMAIL_PREFIX = 'onprez:booking-confirmation-email:'

/**
 * Formats the calendar day selected by the visitor without converting it to UTC.
 * Calendar dates are date-only values; using Date#toISOString can move the value
 * to the previous day for visitors in positive UTC offsets such as UK summertime.
 */
export function formatLocalCalendarDate(date: CalendarDate): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getSessionStorage(): SessionStorageLike | null {
  if (typeof window === 'undefined') return null

  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

function confirmationStorageKey(confirmationNumber: string): string {
  return `${BOOKING_CONFIRMATION_EMAIL_PREFIX}${confirmationNumber.trim().toUpperCase()}`
}

/**
 * Keeps the email used for a just-created booking in the current browser tab.
 * This avoids placing customer PII in the success-page URL while still allowing
 * the protected confirmation lookup endpoint to verify both required values.
 */
export function saveBookingConfirmationEmail(
  confirmationNumber: string,
  customerEmail: string,
  storage: SessionStorageLike | null = getSessionStorage()
): void {
  if (!storage || !confirmationNumber.trim() || !customerEmail.trim()) return

  try {
    storage.setItem(confirmationStorageKey(confirmationNumber), customerEmail.trim().toLowerCase())
  } catch {
    // A blocked or full sessionStorage must not turn a successful booking into an error.
  }
}

export function getBookingConfirmationEmail(
  confirmationNumber: string,
  storage: SessionStorageLike | null = getSessionStorage()
): string | null {
  if (!storage || !confirmationNumber.trim()) return null

  try {
    return storage.getItem(confirmationStorageKey(confirmationNumber))
  } catch {
    return null
  }
}

export function buildBookingLookupUrl(confirmationNumber: string, customerEmail: string): string {
  const params = new URLSearchParams({
    confirmationNumber,
    customerEmail,
  })

  return `/api/bookings?${params.toString()}`
}
