import {
  buildBookingLookupUrl,
  formatLocalCalendarDate,
  getBookingConfirmationEmail,
  saveBookingConfirmationEmail,
} from './public-booking'

function createStorage() {
  const values = new Map<string, string>()

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
  }
}

describe('public booking helpers', () => {
  it('serializes the selected local calendar fields without converting through UTC', () => {
    const selectedDate = {
      getFullYear: () => 2026,
      getMonth: () => 6,
      getDate: () => 22,
    }

    expect(formatLocalCalendarDate(selectedDate)).toBe('2026-07-22')
  })

  it('pads single-digit months and days', () => {
    const selectedDate = {
      getFullYear: () => 2026,
      getMonth: () => 0,
      getDate: () => 5,
    }

    expect(formatLocalCalendarDate(selectedDate)).toBe('2026-01-05')
  })

  it('stores the confirmation email for the current tab without putting it in the URL', () => {
    const storage = createStorage()

    saveBookingConfirmationEmail('ab12cd34', ' ADA@Example.com ', storage)

    expect(getBookingConfirmationEmail('AB12CD34', storage)).toBe('ada@example.com')
  })

  it('builds an encoded confirmation lookup request with both required values', () => {
    expect(buildBookingLookupUrl('AB12_CD34', 'ada+booking@example.com')).toBe(
      '/api/bookings?confirmationNumber=AB12_CD34&customerEmail=ada%2Bbooking%40example.com'
    )
  })
})
