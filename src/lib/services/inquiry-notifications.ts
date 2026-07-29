import { readNotificationPreferences, toSettingsRecord } from '@/lib/notifications/preferences'
import { logger } from '@/lib/observability/logger'
import { sendEmail, type EmailResult } from '@/lib/services/email'

export interface InquiryCreatedNotificationInput {
  inquiryId: string
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  subject: string
  message: string
  preferredContact: 'EMAIL' | 'PHONE' | 'EITHER'
  businessName: string
  businessEmail?: string | null
  businessOwnerEmail?: string | null
  businessSettings: unknown
}

export interface InquiryCreatedNotificationResult {
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

function skippedResult(): EmailResult {
  return { success: true }
}

export async function sendInquiryCreatedNotifications(
  input: InquiryCreatedNotificationInput
): Promise<InquiryCreatedNotificationResult> {
  const preferences = readNotificationPreferences(input.businessSettings)
  const settings = toSettingsRecord(input.businessSettings)
  const configuredNotificationEmail =
    typeof settings.inquiryNotificationEmail === 'string'
      ? normalizeEmail(settings.inquiryNotificationEmail)
      : undefined
  const businessRecipient =
    configuredNotificationEmail ||
    normalizeEmail(input.businessEmail) ||
    normalizeEmail(input.businessOwnerEmail)
  const autoReply =
    typeof settings.inquiryAutoReply === 'string' && settings.inquiryAutoReply.trim()
      ? settings.inquiryAutoReply.trim()
      : `Thank you for contacting ${input.businessName}. Your inquiry has been received and the business will get back to you as soon as possible.`

  logger.info('inquiry.notifications.started', { inquiryId: input.inquiryId })

  const businessPromise = !preferences.inquiryOwnerEmail
    ? Promise.resolve(skippedResult())
    : businessRecipient
      ? sendEmail({
          to: businessRecipient,
          subject: `New inquiry: ${input.subject}`,
          replyTo: normalizeEmail(input.customerEmail),
          text: [
            `New inquiry for ${input.businessName}`,
            '',
            `From: ${input.customerName}`,
            `Email: ${input.customerEmail}`,
            `Phone: ${input.customerPhone?.trim() || 'Not provided'}`,
            `Preferred contact: ${input.preferredContact}`,
            `Subject: ${input.subject}`,
            '',
            input.message,
            '',
            `Inquiry ID: ${input.inquiryId}`,
          ].join('\n'),
          html: `
            <h1>New inquiry for ${escapeHtml(input.businessName)}</h1>
            <p><strong>From:</strong> ${escapeHtml(input.customerName)}</p>
            <p><strong>Email:</strong> ${escapeHtml(input.customerEmail)}</p>
            <p><strong>Phone:</strong> ${escapeHtml(input.customerPhone?.trim() || 'Not provided')}</p>
            <p><strong>Preferred contact:</strong> ${escapeHtml(input.preferredContact)}</p>
            <p><strong>Subject:</strong> ${escapeHtml(input.subject)}</p>
            <p style="white-space:pre-wrap">${escapeHtml(input.message)}</p>
            <p><small>Inquiry ID: ${escapeHtml(input.inquiryId)}</small></p>
          `.trim(),
        })
      : Promise.resolve<EmailResult>({
          success: false,
          error: 'No business inquiry notification recipient is configured',
        })

  const customerPromise = !preferences.customerInquiryAcknowledgements
    ? Promise.resolve(skippedResult())
    : sendEmail({
        to: normalizeEmail(input.customerEmail) || input.customerEmail,
        subject: `We received your inquiry - ${input.businessName}`,
        replyTo: normalizeEmail(input.businessEmail),
        text: [
          `Hi ${input.customerName},`,
          '',
          autoReply,
          '',
          `Subject: ${input.subject}`,
          `Inquiry ID: ${input.inquiryId}`,
          '',
          'This is a service acknowledgement for an inquiry you submitted, not a marketing email.',
        ].join('\n'),
        html: `
          <h1>We received your inquiry</h1>
          <p>Hi ${escapeHtml(input.customerName)},</p>
          <p>${escapeHtml(autoReply)}</p>
          <p><strong>Subject:</strong> ${escapeHtml(input.subject)}</p>
          <p><small>Inquiry ID: ${escapeHtml(input.inquiryId)}</small></p>
          <p><small>This is a service acknowledgement for an inquiry you submitted, not a marketing email.</small></p>
        `.trim(),
      })

  const [customer, business] = await Promise.all([customerPromise, businessPromise])

  logger[customer.success && business.success ? 'info' : 'warn'](
    'inquiry.notifications.completed',
    {
      inquiryId: input.inquiryId,
      customerSent: preferences.customerInquiryAcknowledgements ? customer.success : false,
      customerSkipped: !preferences.customerInquiryAcknowledgements,
      businessSent: preferences.inquiryOwnerEmail ? business.success : false,
      businessSkipped: !preferences.inquiryOwnerEmail,
    }
  )

  return { customer, business }
}
