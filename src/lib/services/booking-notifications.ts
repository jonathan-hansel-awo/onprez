import type { AppointmentStatus } from '@prisma/client'
import { sendEmail, type EmailResult, type SendEmailOptions } from '@/lib/services/email'
import { logger } from '@/lib/observability/logger'
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
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

function formatBookingStatus(status: AppointmentStatus): {
  customerSubject: string
  customerHeading: string
  customerSummary: string
  businessSubjectPrefix: string
  businessHeading: string
} {
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
  return `
    <tr>
      <td style="padding: 7px 12px 7px 0; color: #6b7280; vertical-align: top; white-space: nowrap;">${escapeHtml(label)}</td>
      <td style="padding: 7px 0; color: #111827; font-weight: 600;">${escapeHtml(value)}</td>
    </tr>
  `.trim()
}

function renderEmailShell(heading: string, intro: string, details: string, footer: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeHtml(heading)}</title>
      </head>
      <body style="margin: 0; padding: 0; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: #111827;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding: 32px 16px; background: #f3f4f6;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; overflow: hidden; border-radius: 16px; background: #ffffff; box-shadow: 0 8px 30px rgba(17, 24, 39, 0.08);">
                <tr>
                  <td style="padding: 24px 32px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: #ffffff;">
                    <div style="font-size: 14px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.9;">OnPrez</div>
                    <h1 style="margin: 8px 0 0; font-size: 26px; line-height: 1.25;">${escapeHtml(heading)}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px 32px;">
                    <p style="margin: 0 0 22px; color: #374151; font-size: 16px; line-height: 1.65;">${escapeHtml(intro)}</p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding: 14px 18px; border: 1px solid #e5e7eb; border-radius: 12px; background: #f9fafb;">
                      ${details}
                    </table>
                    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">${escapeHtml(footer)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `.trim()
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
  const replyTo = normalizeEmail(input.businessEmail)

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

  const textLines = [
    `Hi ${input.customerName},`,
    '',
    `${statusCopy.customerHeading}. ${statusCopy.customerSummary}`,
    '',
    `Business: ${input.businessName}`,
    `Service: ${input.serviceName}`,
    `Date: ${localDate}`,
    `Time: ${localStartTime}–${localEndTime} (${input.timezone})`,
    `Price: ${price}`,
    ...(input.depositPaid !== undefined
      ? [`Deposit paid: ${formatCurrency(input.depositPaid, input.currency)}`]
      : []),
    ...(input.remainingAmount !== undefined
      ? [`Balance at appointment: ${formatCurrency(input.remainingAmount, input.currency)}`]
      : []),
    ...(input.businessAddress ? [`Location: ${input.businessAddress}`] : []),
    `Reference: ${confirmationNumber}`,
    '',
    'Keep this reference for any questions about your booking.',
  ]

  return {
    to: normalizeEmail(input.customerEmail) || input.customerEmail,
    subject: `${statusCopy.customerSubject} - ${input.businessName}`,
    html: renderEmailShell(
      statusCopy.customerHeading,
      `Hi ${input.customerName}. ${statusCopy.customerSummary}`,
      details,
      'Keep this booking reference for any questions. This is a service message about an appointment you requested.'
    ),
    text: textLines.join('\n'),
    replyTo,
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

  const details = [
    renderDetailRow('Customer', input.customerName),
    renderDetailRow('Email', input.customerEmail),
    renderDetailRow('Phone', phone),
    renderDetailRow('Service', input.serviceName),
    renderDetailRow('Date', localDate),
    renderDetailRow('Time', `${localStartTime}–${localEndTime} (${input.timezone})`),
    renderDetailRow('Value', price),
    ...(input.depositPaid !== undefined
      ? [renderDetailRow('Deposit paid', formatCurrency(input.depositPaid, input.currency))]
      : []),
    ...(input.remainingAmount !== undefined
      ? [renderDetailRow('Balance due', formatCurrency(input.remainingAmount, input.currency))]
      : []),
    renderDetailRow('Reference', confirmationNumber),
    renderDetailRow('Customer notes', notes),
  ].join('')

  const text = [
    statusCopy.businessHeading,
    '',
    `Customer: ${input.customerName}`,
    `Email: ${input.customerEmail}`,
    `Phone: ${phone}`,
    `Service: ${input.serviceName}`,
    `Date: ${localDate}`,
    `Time: ${localStartTime}–${localEndTime} (${input.timezone})`,
    `Value: ${price}`,
    ...(input.depositPaid !== undefined
      ? [`Deposit paid: ${formatCurrency(input.depositPaid, input.currency)}`]
      : []),
    ...(input.remainingAmount !== undefined
      ? [`Balance due: ${formatCurrency(input.remainingAmount, input.currency)}`]
      : []),
    `Reference: ${confirmationNumber}`,
    `Customer notes: ${notes}`,
    '',
    'Sign in to your OnPrez dashboard to review and manage this appointment.',
  ].join('\n')

  return {
    to: recipient,
    subject: `${statusCopy.businessSubjectPrefix}: ${input.serviceName} - ${input.customerName}`,
    html: renderEmailShell(
      statusCopy.businessHeading,
      `${input.customerName} booked ${input.serviceName} with ${input.businessName}.`,
      details,
      'Sign in to your OnPrez dashboard to review and manage this appointment.'
    ),
    text,
    replyTo: normalizeEmail(input.customerEmail),
  }
}

export async function sendBookingCreatedNotifications(
  input: BookingCreatedNotificationInput
): Promise<BookingCreatedNotificationResult> {
  logger.info('booking.notifications.started', {
    bookingId: input.bookingId,
    status: input.status,
  })

  try {
    const businessRecipient =
      normalizeEmail(input.businessEmail) || normalizeEmail(input.businessOwnerEmail)
    const customerMessage = buildCustomerBookingEmail(input)

    const customerPromise = sendEmail(customerMessage)
    const businessPromise = businessRecipient
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
      businessSent: business.success,
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
