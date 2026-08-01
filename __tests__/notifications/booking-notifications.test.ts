const mockAppointmentFindUnique = jest.fn()
const mockSendEmail = jest.fn()
const mockSendTrackedEmail = jest.fn()

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

jest.mock('@/lib/email-delivery/delivery', () => ({
  sendTrackedEmail: (...args: unknown[]) => mockSendTrackedEmail(...args),
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

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name]
  else process.env[name] = value
}

describe('booking notification preferences', () => {
  const originalCi = process.env.CI
  const originalAppUrl = process.env.APP_URL
  const originalLoadTestFlag = process.env.LOAD_TEST_DISABLE_EXTERNAL_SIDE_EFFECTS

  beforeEach(() => {
    jest.clearAllMocks()
    mockSendEmail.mockResolvedValue({ success: true, messageId: 'email-1' })
    mockSendTrackedEmail.mockResolvedValue({ success: true, messageId: 'email-1' })
    restoreEnv('CI', originalCi)
    restoreEnv('APP_URL', originalAppUrl)
    restoreEnv('LOAD_TEST_DISABLE_EXTERNAL_SIDE_EFFECTS', originalLoadTestFlag)
  })

  afterEach(() => {
    restoreEnv('CI', originalCi)
    restoreEnv('APP_URL', originalAppUrl)
    restoreEnv('LOAD_TEST_DISABLE_EXTERNAL_SIDE_EFFECTS', originalLoadTestFlag)
  })

  it('always sends the customer transactional email when owner alerts are disabled', async () => {
    mockAppointmentFindUnique.mockResolvedValue({
      businessId: 'business-1',
      business: { settings: { notifications: { bookingOwnerEmail: false } } },
    })

    const result = await sendBookingCreatedNotifications(input)

    expect(result.customer.success).toBe(true)
    expect(mockSendTrackedEmail).toHaveBeenCalledTimes(1)
    expect(mockSendTrackedEmail.mock.calls[0][1]).toEqual(
      expect.objectContaining({ to: 'ada@example.com' })
    )
  })

  it('sends both customer and owner emails when owner alerts are enabled', async () => {
    mockAppointmentFindUnique.mockResolvedValue({
      businessId: 'business-1',
      business: { settings: { notifications: { bookingOwnerEmail: true } } },
    })

    await sendBookingCreatedNotifications(input)

    expect(mockSendTrackedEmail).toHaveBeenCalledTimes(2)
    expect(mockSendTrackedEmail.mock.calls[1][1]).toEqual(
      expect.objectContaining({ to: 'bookings@example-studio.com' })
    )
  })

  it('suppresses external delivery only for an explicitly isolated local CI load test', async () => {
    process.env.CI = 'true'
    process.env.APP_URL = 'http://127.0.0.1:3000'
    process.env.LOAD_TEST_DISABLE_EXTERNAL_SIDE_EFFECTS = 'true'

    const result = await sendBookingCreatedNotifications(input)

    expect(result).toEqual({
      customer: { success: true, messageId: 'isolated-load-test-suppressed' },
      business: { success: true, messageId: 'isolated-load-test-suppressed' },
    })
    expect(mockAppointmentFindUnique).not.toHaveBeenCalled()
    expect(mockSendEmail).not.toHaveBeenCalled()
    expect(mockSendTrackedEmail).not.toHaveBeenCalled()
  })
})
