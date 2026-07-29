const mockAppointmentFindUnique = jest.fn()
const mockSendEmail = jest.fn()

jest.mock('@/lib/prisma', () => ({
  prisma: {
    appointment: {
      findUnique: (...args: unknown[]) => mockAppointmentFindUnique(...args),
    },
  },
}))

jest.mock('@/lib/services/email', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}))

jest.mock('@/lib/integrations/google-calendar', () => ({
  syncAppointmentToGoogleCalendar: jest.fn().mockResolvedValue({ success: true }),
}))

jest.mock('@/lib/observability/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

import { sendBookingCreatedNotifications } from '@/lib/services/booking-notifications'

const input = {
  bookingId: 'booking-12345678',
  status: 'CONFIRMED' as const,
  customerName: 'Ada Customer',
  customerEmail: 'ada@example.com',
  customerPhone: '07123456789',
  customerNotes: 'First visit',
  businessName: 'Example Studio',
  businessEmail: 'bookings@example-studio.com',
  businessOwnerEmail: 'owner@example-studio.com',
  businessAddress: '1 High Street',
  serviceName: 'Consultation',
  startTime: new Date('2026-08-10T09:00:00.000Z'),
  endTime: new Date('2026-08-10T10:00:00.000Z'),
  timezone: 'Europe/London',
  totalAmount: 50,
  currency: 'GBP',
}

describe('booking notification preferences', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSendEmail.mockResolvedValue({ success: true, messageId: 'email-1' })
  })

  it('always sends the customer transactional email when owner alerts are disabled', async () => {
    mockAppointmentFindUnique.mockResolvedValue({
      business: { settings: { notifications: { bookingOwnerEmail: false } } },
    })

    const result = await sendBookingCreatedNotifications(input)

    expect(result.customer.success).toBe(true)
    expect(mockSendEmail).toHaveBeenCalledTimes(1)
    expect(mockSendEmail.mock.calls[0][0]).toEqual(
      expect.objectContaining({ to: 'ada@example.com' })
    )
  })

  it('sends both customer and owner emails when owner alerts are enabled', async () => {
    mockAppointmentFindUnique.mockResolvedValue({
      business: { settings: { notifications: { bookingOwnerEmail: true } } },
    })

    await sendBookingCreatedNotifications(input)

    expect(mockSendEmail).toHaveBeenCalledTimes(2)
    expect(mockSendEmail.mock.calls[1][0]).toEqual(
      expect.objectContaining({ to: 'bookings@example-studio.com' })
    )
  })
})
