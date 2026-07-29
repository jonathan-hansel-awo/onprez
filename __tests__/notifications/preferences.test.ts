import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  mergeNotificationPreferences,
  readNotificationPreferences,
} from '@/lib/notifications/preferences'

describe('notification preferences', () => {
  it('uses safe defaults and keeps marketing opt-in off', () => {
    expect(readNotificationPreferences(null)).toEqual(DEFAULT_NOTIFICATION_PREFERENCES)
    expect(readNotificationPreferences(null).marketingEmails).toBe(false)
    expect(readNotificationPreferences(null).customerBookingUpdates).toBe(true)
  })

  it('supports legacy booking and reminder settings', () => {
    expect(
      readNotificationPreferences({
        bookingNotifications: false,
        emailReminders: false,
      })
    ).toMatchObject({
      bookingOwnerEmail: false,
      customerReminders: false,
    })
  })

  it('prefers consolidated notification settings over legacy values', () => {
    expect(
      readNotificationPreferences({
        bookingNotifications: false,
        emailReminders: false,
        notifications: {
          bookingOwnerEmail: true,
          customerReminders: true,
          inquiryOwnerEmail: false,
          customerInquiryAcknowledgements: false,
          marketingEmails: true,
          customerBookingUpdates: false,
        },
      })
    ).toEqual({
      bookingOwnerEmail: true,
      inquiryOwnerEmail: false,
      customerReminders: true,
      customerInquiryAcknowledgements: false,
      customerBookingUpdates: true,
      marketingEmails: true,
    })
  })

  it('preserves unrelated business settings and mirrors legacy readers', () => {
    const merged = mergeNotificationPreferences(
      {
        timezone: 'Europe/London',
        reminders: { defaultMessage: 'See you soon' },
      },
      {
        bookingOwnerEmail: false,
        inquiryOwnerEmail: false,
        customerReminders: false,
        customerInquiryAcknowledgements: true,
        marketingEmails: true,
      }
    )

    expect(merged).toMatchObject({
      timezone: 'Europe/London',
      bookingNotifications: false,
      emailReminders: false,
      reminders: {
        defaultMessage: 'See you soon',
        enabled: false,
        emailEnabled: false,
      },
      notifications: {
        bookingOwnerEmail: false,
        inquiryOwnerEmail: false,
        customerReminders: false,
        customerInquiryAcknowledgements: true,
        customerBookingUpdates: true,
        marketingEmails: true,
      },
    })
  })
})
