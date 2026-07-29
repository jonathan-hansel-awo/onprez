import type { SendEmailOptions } from '@/lib/services/email'

export interface BookingCalendarInput {
  bookingId: string
  customerName: string
  customerEmail?: string | null
  customerPhone?: string | null
  businessName: string
  businessAddress?: string | null
  serviceName: string
  startTime: Date
  endTime: Date
  timezone: string
}

export type BookingCalendarMethod = 'PUBLISH' | 'CANCEL'

function formatCalendarUtc(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')
}

function escapeCalendarText(value: string): string {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('\r\n', '\\n')
    .replaceAll('\n', '\\n')
    .replaceAll('\r', '\\n')
    .replaceAll(',', '\\,')
    .replaceAll(';', '\\;')
}

function bookingDescription(input: BookingCalendarInput): string {
  const reference = input.bookingId.slice(0, 8).toUpperCase()
  return [
    `Booking reference: ${reference}`,
    `Business: ${input.businessName}`,
    `Service: ${input.serviceName}`,
    `Customer: ${input.customerName}`,
    ...(input.customerEmail ? [`Email: ${input.customerEmail}`] : []),
    ...(input.customerPhone ? [`Phone: ${input.customerPhone}`] : []),
    `Timezone: ${input.timezone}`,
  ].join('\n')
}

export function buildCustomerGoogleCalendarUrl(input: BookingCalendarInput): string {
  const url = new URL('https://calendar.google.com/calendar/render')
  url.searchParams.set('action', 'TEMPLATE')
  url.searchParams.set('text', `${input.serviceName} with ${input.businessName}`)
  url.searchParams.set(
    'dates',
    `${formatCalendarUtc(input.startTime)}/${formatCalendarUtc(input.endTime)}`
  )
  url.searchParams.set('details', bookingDescription(input))
  url.searchParams.set('ctz', input.timezone)
  if (input.businessAddress) url.searchParams.set('location', input.businessAddress)
  return url.toString()
}

export function buildCustomerOutlookCalendarUrl(input: BookingCalendarInput): string {
  const url = new URL('https://outlook.office.com/calendar/0/deeplink/compose')
  url.searchParams.set('path', '/calendar/action/compose')
  url.searchParams.set('rru', 'addevent')
  url.searchParams.set('subject', `${input.serviceName} with ${input.businessName}`)
  url.searchParams.set('startdt', input.startTime.toISOString())
  url.searchParams.set('enddt', input.endTime.toISOString())
  url.searchParams.set('body', bookingDescription(input))
  url.searchParams.set('allday', 'false')
  if (input.businessAddress) url.searchParams.set('location', input.businessAddress)
  return url.toString()
}

export function buildBookingCalendarAttachment(
  input: BookingCalendarInput,
  method: BookingCalendarMethod = 'PUBLISH'
): NonNullable<SendEmailOptions['attachments']>[number] {
  const confirmationNumber = input.bookingId.slice(0, 8).toUpperCase()
  const cancelled = method === 'CANCEL'
  const calendar = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OnPrez//Booking//EN',
    'CALSCALE:GREGORIAN',
    `METHOD:${method}`,
    'BEGIN:VEVENT',
    `UID:${escapeCalendarText(input.bookingId)}@onprez.com`,
    `DTSTAMP:${formatCalendarUtc(new Date())}`,
    `DTSTART:${formatCalendarUtc(input.startTime)}`,
    `DTEND:${formatCalendarUtc(input.endTime)}`,
    `SUMMARY:${escapeCalendarText(`${input.serviceName} with ${input.businessName}`)}`,
    `DESCRIPTION:${escapeCalendarText(bookingDescription(input))}`,
    ...(input.businessAddress ? [`LOCATION:${escapeCalendarText(input.businessAddress)}`] : []),
    `STATUS:${cancelled ? 'CANCELLED' : 'CONFIRMED'}`,
    ...(cancelled ? ['SEQUENCE:1'] : ['SEQUENCE:0']),
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n')

  return {
    filename: `booking-${confirmationNumber}.ics`,
    content: calendar,
    contentType: `text/calendar; charset=utf-8; method=${method}`,
  }
}
