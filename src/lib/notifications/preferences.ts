export interface NotificationPreferences {
  bookingOwnerEmail: boolean
  inquiryOwnerEmail: boolean
  customerReminders: boolean
  customerInquiryAcknowledgements: boolean
  customerBookingUpdates: true
  marketingEmails: boolean
}

export type EditableNotificationPreferences = Omit<
  NotificationPreferences,
  'customerBookingUpdates'
>

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  bookingOwnerEmail: true,
  inquiryOwnerEmail: true,
  customerReminders: true,
  customerInquiryAcknowledgements: true,
  customerBookingUpdates: true,
  marketingEmails: false,
}

export function toSettingsRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

export function readNotificationPreferences(settings: unknown): NotificationPreferences {
  const root = toSettingsRecord(settings)
  const notifications = toSettingsRecord(root.notifications)
  const reminders = toSettingsRecord(root.reminders)

  return {
    bookingOwnerEmail: readBoolean(
      notifications.bookingOwnerEmail,
      readBoolean(root.bookingNotifications, DEFAULT_NOTIFICATION_PREFERENCES.bookingOwnerEmail)
    ),
    inquiryOwnerEmail: readBoolean(
      notifications.inquiryOwnerEmail,
      DEFAULT_NOTIFICATION_PREFERENCES.inquiryOwnerEmail
    ),
    customerReminders: readBoolean(
      notifications.customerReminders,
      readBoolean(
        reminders.emailEnabled,
        readBoolean(root.emailReminders, DEFAULT_NOTIFICATION_PREFERENCES.customerReminders)
      )
    ),
    customerInquiryAcknowledgements: readBoolean(
      notifications.customerInquiryAcknowledgements,
      DEFAULT_NOTIFICATION_PREFERENCES.customerInquiryAcknowledgements
    ),
    // Booking confirmations and status changes are transactional service messages.
    // They intentionally cannot be disabled through business preferences.
    customerBookingUpdates: true,
    marketingEmails: readBoolean(
      notifications.marketingEmails,
      DEFAULT_NOTIFICATION_PREFERENCES.marketingEmails
    ),
  }
}

export function mergeNotificationPreferences(
  settings: unknown,
  preferences: EditableNotificationPreferences
): Record<string, unknown> {
  const root = toSettingsRecord(settings)
  const currentNotifications = toSettingsRecord(root.notifications)
  const currentReminders = toSettingsRecord(root.reminders)

  return {
    ...root,
    // Keep legacy readers working while notification settings are consolidated.
    bookingNotifications: preferences.bookingOwnerEmail,
    emailReminders: preferences.customerReminders,
    reminders: {
      ...currentReminders,
      enabled: preferences.customerReminders,
      emailEnabled: preferences.customerReminders,
    },
    notifications: {
      ...currentNotifications,
      ...preferences,
      customerBookingUpdates: true,
    },
  }
}
