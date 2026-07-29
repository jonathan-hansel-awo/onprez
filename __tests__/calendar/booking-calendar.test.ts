import {
  buildBookingCalendarAttachment,
  buildCustomerGoogleCalendarUrl,
  buildCustomerOutlookCalendarUrl,
} from '@/lib/calendar/booking-calendar'

const input = {
  bookingId: 'booking-12345678',
  customerName: 'Ada Customer',
  customerEmail: 'ada@example.com',
  businessName: 'Example Studio',
  businessAddress: '1 High Street, London',
  serviceName: 'Consultation',
  startTime: new Date('2026-10-25T10:00:00.000Z'),
  endTime: new Date('2026-10-25T11:00:00.000Z'),
  timezone: 'Europe/London',
}

describe('booking calendar artefacts', () => {
  it('builds Google and Outlook links with the booking time and location', () => {
    const google = new URL(buildCustomerGoogleCalendarUrl(input))
    const outlook = new URL(buildCustomerOutlookCalendarUrl(input))

    expect(google.searchParams.get('dates')).toBe('20261025T100000Z/20261025T110000Z')
    expect(google.searchParams.get('ctz')).toBe('Europe/London')
    expect(google.searchParams.get('location')).toBe('1 High Street, London')
    expect(outlook.searchParams.get('startdt')).toBe('2026-10-25T10:00:00.000Z')
    expect(outlook.searchParams.get('enddt')).toBe('2026-10-25T11:00:00.000Z')
  })

  it('builds publish and cancellation ICS files with the same UID', () => {
    const confirmed = buildBookingCalendarAttachment(input)
    const cancelled = buildBookingCalendarAttachment(input, 'CANCEL')

    expect(confirmed.content).toContain('METHOD:PUBLISH')
    expect(confirmed.content).toContain('STATUS:CONFIRMED')
    expect(confirmed.content).toContain('UID:booking-12345678@onprez.com')
    expect(cancelled.content).toContain('METHOD:CANCEL')
    expect(cancelled.content).toContain('STATUS:CANCELLED')
    expect(cancelled.content).toContain('UID:booking-12345678@onprez.com')
  })
})
