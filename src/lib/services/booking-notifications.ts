import type { AppointmentStatus } from '@prisma/client'
import { readNotificationPreferences } from '@/lib/notifications/preferences'
import { logger } from '@/lib/observability/logger'
import { prisma } from '@/lib/prisma'
import { sendEmail, type EmailResult, type SendEmailOptions } from '@/lib/services/email'
import { formatLongDateInTimezone, formatTimeInTimezone } from '@/lib/utils/timezone'

export interface BookingCreatedNotificationInput {
  bookingId: string
  status: AppointmentStatus
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  customerNotes?: string | null
  businessName: string
  businessEmail?: string | null
  businessOwnerEmail?: string | null
  businessAddress?: string | null
  serviceName: string
  startTime: Date
  endTime: Date
  timezone: string
  totalAmount: number
  currency: string
  depositPaid?: number
  remainingAmount?: number
}

export interface BookingCreatedNotificationResult {
  customer: EmailResult
  business: EmailResult
}

interface EmailAction {
  href: string
  label: string
  supportingText?: string
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function normalizeEmail(value?: string | null): string | undefined {
  const normalized = value?.trim().toLowerCase()
  return normalized || undefined
}

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

function formatBookingStatus(status: AppointmentStatus) {
  if (status === 'PENDING') {
    return {
      customerSubject: 'Booking request received',
      customerHeading: 'We received your booking request',
      customerSummary:
        'The business will review your request. You will receive another email when its status changes.',
      businessSubjectPrefix: 'New booking request',
      businessHeading: 'A new booking request needs your attention',
    }
  }

  return {
    customerSubject: 'Booking confirmed',
    customerHeading: 'Your booking is confirmed',
    customerSummary: 'Your appointment has been added to the business calendar.',
    businessSubjectPrefix: 'New confirmed booking',
    businessHeading: 'A new booking has been confirmed',
  }
}

function renderDetailRow(label: string, value: string): string {
  return `<tr><td style="padding:7px 12px 7px 0;color:#6b7280;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td><td style="padding:7px 0;color:#111827;font-weight:600">${escapeHtml(value)}</td></tr>`
}

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

export function buildBusinessBookingCalendarUrl(input: BookingCreatedNotificationInput): string {
  const confirmationNumber = input.bookingId.slice(0, 8).toUpperCase()
  const phone = input.customerPhone?.trim() || 'Not provided'
  const calendarUrl = new URL('https://calendar.google.com/calendar/render')

  calendarUrl.searchParams.set('action', 'TEMPLATE')
  calendarUrl.searchParams.set('text', `${input.serviceName} with ${input.customerName}`)
  calendarUrl.searchParams.set(
    'dates',
    `${formatCalendarUtc(input.startTime)}/${formatCalendarUtc(input.endTime)}`
  )
  calendarUrl.searchParams.set(
    'details',
    [
      `Booking reference: ${confirmationNumber}`,
      `Customer: ${input.customerName}`,
      `Email: ${input.customerEmail}`,
      `Phone: ${phone}`,
      `Service: ${input.serviceName}`,
    ].join('\n')
  )

  if (input.businessAddress) calendarUrl.searchParams.set('location', input.businessAddress)

  return calendarUrl.toString()
}

export function buildBusinessBookingCalendarAttachment(
  input: BookingCreatedNotificationInput
): NonNullable<SendEmailOptions['attachments']>[number] {
  const confirmationNumber = input.bookingId.slice(0, 8).toUpperCase()
  const phone = input.customerPhone?.trim() || 'Not provided'
  const description = [
    `Booking reference: ${confirmationNumber}`,
    `Customer: ${input.customerName}`,
    `Email: ${input.customerEmail}`,
    `Phone: ${phone}`,
    `Service: ${input.serviceName}`,
  ].join('\n')
  const calendar = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OnPrez//Business Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${escapeCalendarText(input.bookingId)}@onprez.com`,
    `DTSTAMP:${formatCalendarUtc(new Date())}`,
    `DTSTART:${formatCalendarUtc(input.startTime)}`,
    `DTEND:${formatCalendarUtc(input.endTime)}`,
    `SUMMARY:${escapeCalendarText(`${input.serviceName} with ${input.customerName}`)}`,
    `DESCRIPTION:${escapeCalendarText(description)}`,
    ...(input.businessAddress ? [`LOCATION:${escapeCalendarText(input.businessAddress)}`] : []),
    `STATUS:${input.status === 'PENDING' ? 'TENTATIVE' : 'CONFIRMED'}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n')

  return {
    filename: `booking-${confirmationNumber}.ics`,
    content: calendar,
    contentType: 'text/calendar; charset=utf-8; method=PUBLISH',
  }
}

function renderEmailShell(
  heading: string,
  intro: string,
  details: string,
  footer: string,
  action?: EmailAction
): string {
  const actionHtml = action
    ? `<p style="margin:24px 0 0"><a href="${escapeHtml(action.href)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:13px 20px;border-radius:10px;background:#2563eb;color:#fff;font-weight:700;text-decoration:none">${escapeHtml(action.label)}</a></p>${action.supportingText ? `<p style="margin:12px 0 0;color:#6b7280;font-size:13px">${escapeHtml(action.supportingText)}</p>` : ''}`
    : ''

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(heading)}</title></head><body style="margin:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#111827"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;background:#f3f4f6"><tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;border-radius:16px;background:#fff;overflow:hidden"><tr><td style="padding:24px 32px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff"><div style="font-size:14px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">OnPrez</div><h1 style="margin:8px 0 0;font-size:26px">${escapeHtml(heading)}</h1></td></tr><tr><td style="padding:30px 32px"><p style="margin:0 0 22px;color:#374151;font-size:16px;line-height:1.65">${escapeHtml(intro)}</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:14px 18px;border:1px solid #e5e7eb;border-radius:12px;background:#f9fafb">${details}</table>${actionHtml}<p style="margin:24px 0 0;color:#6b7280;font-size:14px;line-height:1.6">${escapeHtml(footer)}</p></td></tr></table></td></tr></table></body></html>`
}

export function buildCustomerBookingEmail(
  input: BookingCreatedNotificationInput
): SendEmailOptions {
  const statusCopy = formatBookingStatus(input.status)
  const confirmationNumber = input.bookingId.slice(0, 8).toUpperCase()
  const localDate = formatLongDateInTimezone(input.startTime, input.timezone)
  const localStartTime = formatTimeInTimezone(input.startTime, input.timezone)
  const localEndTime = formatTimeInTimezone(input.endTime, input.timezone)
  const price = formatCurrency(input.totalAmount, input.currency)
  const details = [
    renderDetailRow('Business', input.businessName),
    renderDetailRow('Service', input.serviceName),
    renderDetailRow('Date', localDate),
    renderDetailRow('Time', `${localStartTime}–${localEndTime} (${input.timezone})`),
    renderDetailRow('Price', price),
    ...(input.depositPaid !== undefined
      ? [renderDetailRow('Deposit paid', formatCurrency(input.depositPaid, input.currency))]
      : []),
    ...(input.remainingAmount !== undefined
      ? [
          renderDetailRow(
            'Balance at appointment',
            formatCurrency(input.remainingAmount, input.currency)
          ),
        ]
      : []),
    ...(input.businessAddress ? [renderDetailRow('Location', input.businessAddress)] : []),
    renderDetailRow('Reference', confirmationNumber),
  ].join('')

  return {
    to: normalizeEmail(input.customerEmail) || input.customerEmail,
    subject: `${statusCopy.customerSubject} - ${input.businessName}`,
    html: renderEmailShell(
      statusCopy.customerHeading,
      `Hi ${input.customerName}. ${statusCopy.customerSummary}`,
      details,
      'Keep this booking reference for any questions. This is a service message about an appointment you requested.'
    ),
    text: [
      `Hi ${input.customerName},`,
      '',
      `${statusCopy.customerHeading}. ${statusCopy.customerSummary}`,
      '',
      `Business: ${input.businessName}`,
      `Service: ${input.serviceName}`,
      `Date: ${localDate}`,
      `Time: ${localStartTime}–${localEndTime} (${input.timezone})`,
      `Price: ${price}`,
      `Reference: ${confirmationNumber}`,
    ].join('\n'),
    replyTo: normalizeEmail(input.businessEmail),
  }
}

export function buildBusinessBookingEmail(
  input: BookingCreatedNotificationInput,
  recipient: string
): SendEmailOptions {
  const statusCopy = formatBookingStatus(input.status)
  const confirmationNumber = input.bookingId.slice(0, 8).toUpperCase()
  const localDate = formatLongDateInTimezone(input.startTime, input.timezone)
  const localStartTime = formatTimeInTimezone(input.startTime, input.timezone)
  const localEndTime = formatTimeInTimezone(input.endTime, input.timezone)
  const price = formatCurrency(input.totalAmount, input.currency)
  const phone = input.customerPhone?.trim() || 'Not provided'
  const notes = input.customerNotes?.trim() || 'None provided'
  const calendarUrl = buildBusinessBookingCalendarUrl(input)
  const details = [
    renderDetailRow('Customer', input.customerName),
    renderDetailRow('Email', input.customerEmail),
    renderDetailRow('Phone', phone),
    renderDetailRow('Service', input.serviceName),
    renderDetailRow('Date', localDate),
    renderDetailRow('Time', `${localStartTime}–${localEndTime} (${input.timezone})`),
    renderDetailRow('Value', price),
    renderDetailRow('Reference', confirmationNumber),
    renderDetailRow('Customer notes', notes),
  ].join('')

  return {
    to: recipient,
    subject: `${statusCopy.businessSubjectPrefix}: ${input.serviceName} - ${input.customerName}`,
    html: renderEmailShell(
      statusCopy.businessHeading,
      `${input.customerName} booked ${input.serviceName} with ${input.businessName}.`,
      details,
      'Sign in to your OnPrez dashboard to review and manage this appointment.',
      {
        href: calendarUrl,
        label: 'Add to calendar',
        supportingText:
          'Opens Google Calendar. You can also use the attached .ics file with Apple Calendar, Outlook, or another calendar app.',
      }
    ),
    text: [
      statusCopy.businessHeading,
      '',
      `Customer: ${input.customerName}`,
      `Email: ${input.customerEmail}`,
      `Phone: ${phone}`,
      `Service: ${input.serviceName}`,
      `Date: ${localDate}`,
      `Time: ${localStartTime}–${localEndTime} (${input.timezone})`,
      `Value: ${price}`,
      `Reference: ${confirmationNumber}`,
      `Customer notes: ${notes}`,
      '',
      `Add to Google Calendar: ${calendarUrl}`,
    ].join('\n'),
    replyTo: normalizeEmail(input.customerEmail),
    attachments: [buildBusinessBookingCalendarAttachment(input)],
  }
}

async function shouldNotifyBusiness(bookingId: string): Promise<boolean> {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: bookingId },
      select: { business: { select: { settings: true } } },
    })

    return readNotificationPreferences(appointment?.business.settings).bookingOwnerEmail
  } catch (error) {
    // Preserve existing delivery behaviour if the preference lookup itself is unavailable.
    logger.warn('booking.notifications.preference_lookup_failed', {
      bookingId,
      errorType: error instanceof Error ? error.name : typeof error,
    })
    return true
  }
}

export async function sendBookingCreatedNotifications(
  input: BookingCreatedNotificationInput
): Promise<BookingCreatedNotificationResult> {
  logger.info('booking.notifications.started', { bookingId: input.bookingId, status: input.status })

  try {
    const businessRecipient =
      normalizeEmail(input.businessEmail) || normalizeEmail(input.businessOwnerEmail)
    const notifyBusiness = await shouldNotifyBusiness(input.bookingId)

    // Customer confirmation is a required transactional service email and always sends.
    const customerPromise = sendEmail(buildCustomerBookingEmail(input))
    const businessPromise = !notifyBusiness
      ? Promise.resolve<EmailResult>({ success: true })
      : businessRecipient
        ? sendEmail(buildBusinessBookingEmail(input, businessRecipient))
        : Promise.resolve<EmailResult>({
            success: false,
            error: 'No business notification recipient is configured',
          })

    const [customer, business] = await Promise.all([customerPromise, businessPromise])
    const allSent = customer.success && business.success

    logger[allSent ? 'info' : 'warn']('booking.notifications.completed', {
      bookingId: input.bookingId,
      status: input.status,
      customerSent: customer.success,
      businessSent: notifyBusiness ? business.success : false,
      businessSkipped: !notifyBusiness,
    })

    return { customer, business }
  } catch (error) {
    logger.error('booking.notifications.failed', {
      bookingId: input.bookingId,
      status: input.status,
      errorType: error instanceof Error ? error.name : typeof error,
    })

    const failure: EmailResult = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to prepare booking notifications',
    }

    return { customer: failure, business: failure }
  }
}
