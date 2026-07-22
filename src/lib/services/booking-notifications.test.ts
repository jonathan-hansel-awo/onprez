import { sendEmail } from '@/lib/services/email'
import {
  buildBusinessBookingEmail,
  buildCustomerBookingEmail,
  sendBookingCreatedNotifications,
  type BookingCreatedNotificationInput,
} from '@/lib/services/booking-notifications'

jest.mock('@/lib/services/email', () => ({
  sendEmail: jest.fn(),
}))

const mockSendEmail = jest.mocked(sendEmail)

const baseInput: BookingCreatedNotificationInput = {
  bookingId: 'ab12cd34ef56',
  status: 'CONFIRMED',
  customerName: 'Ada Okoro',
  customerEmail: 'ADA@Example.com',
  customerPhone: '07123 456 789',
  customerNotes: 'Please use the side entrance.',
  businessName: 'Heavenly Pamper Palace',
  businessEmail: 'BOOKINGS@Heavenly.example',
  businessOwnerEmail: 'louise@example.com',
  businessAddress: '18 Willow Court',
  serviceName: 'Serenity Massage',
  startTime: new Date('2026-07-22T09:00:00.000Z'),
  endTime: new Date('2026-07-22T10:00:00.000Z'),
  timezone: 'Europe/London',
  totalAmount: 70,
  currency: 'GBP',
}

describe('booking creation notifications', () => {
  beforeEach(() => {
    mockSendEmail.mockReset()
  })

  it('sends a customer confirmation and a business notification', async () => {
    mockSendEmail
      .mockResolvedValueOnce({ success: true, messageId: 'customer-message' })
      .mockResolvedValueOnce({ success: true, messageId: 'business-message' })

    const result = await sendBookingCreatedNotifications(baseInput)

    expect(mockSendEmail).toHaveBeenCalledTimes(2)
    expect(mockSendEmail.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        to: 'ada@example.com',
        replyTo: 'bookings@heavenly.example',
        subject: 'Booking confirmed - Heavenly Pamper Palace',
      })
    )
    expect(mockSendEmail.mock.calls[0][0].text).toContain('Reference: AB12CD34')

    expect(mockSendEmail.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        to: 'bookings@heavenly.example',
        replyTo: 'ada@example.com',
        subject: 'New confirmed booking: Serenity Massage - Ada Okoro',
      })
    )
    expect(result.customer.success).toBe(true)
    expect(result.business.success).toBe(true)
  })

  it('falls back to the account owner email when the business has no contact email', async () => {
    mockSendEmail.mockResolvedValue({ success: true, messageId: 'message-id' })

    await sendBookingCreatedNotifications({ ...baseInput, businessEmail: null })

    expect(mockSendEmail).toHaveBeenCalledTimes(2)
    expect(mockSendEmail.mock.calls[1][0].to).toBe('louise@example.com')
  })

  it('uses pending wording for services that require approval', () => {
    const customerEmail = buildCustomerBookingEmail({ ...baseInput, status: 'PENDING' })
    const businessEmail = buildBusinessBookingEmail(
      { ...baseInput, status: 'PENDING' },
      'louise@example.com'
    )

    expect(customerEmail.subject).toBe('Booking request received - Heavenly Pamper Palace')
    expect(customerEmail.text).toContain('will review your request')
    expect(businessEmail.subject).toBe(
      'New booking request: Serenity Massage - Ada Okoro'
    )
  })

  it('escapes customer-provided values in HTML messages', () => {
    const input = {
      ...baseInput,
      customerName: 'Ada <script>alert(1)</script>',
      customerNotes: 'Bring <b>oil</b> & towels',
      serviceName: 'Massage & Glow',
    }

    const customerEmail = buildCustomerBookingEmail(input)
    const businessEmail = buildBusinessBookingEmail(input, 'louise@example.com')

    expect(customerEmail.html).not.toContain('<script>alert(1)</script>')
    expect(customerEmail.html).toContain('Ada &lt;script&gt;alert(1)&lt;/script&gt;')
    expect(businessEmail.html).not.toContain('<b>oil</b>')
    expect(businessEmail.html).toContain('Bring &lt;b&gt;oil&lt;/b&gt; &amp; towels')
  })

  it('still returns the customer result when no business recipient is configured', async () => {
    mockSendEmail.mockResolvedValueOnce({ success: true, messageId: 'customer-message' })

    const result = await sendBookingCreatedNotifications({
      ...baseInput,
      businessEmail: null,
      businessOwnerEmail: null,
    })

    expect(mockSendEmail).toHaveBeenCalledTimes(1)
    expect(result.customer.success).toBe(true)
    expect(result.business).toEqual({
      success: false,
      error: 'No business notification recipient is configured',
    })
  })
})
