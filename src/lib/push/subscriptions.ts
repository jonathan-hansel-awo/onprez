import { prisma } from '@/lib/prisma'

export const MAX_PUSH_SUBSCRIPTIONS_PER_USER = 10

export const DEFAULT_PUSH_NOTIFICATION_PREFERENCES = {
  newBookingEnabled: true,
  cancellationEnabled: true,
  rescheduleEnabled: true,
} as const

export async function pruneExpiredPushSubscriptions(userId?: string): Promise<number> {
  const result = await prisma.pushSubscription.deleteMany({
    where: {
      ...(userId ? { userId } : {}),
      expiresAt: { lte: new Date() },
    },
  })

  return result.count
}

export async function getPushNotificationPreferences(userId: string) {
  const preferences = await prisma.pushNotificationPreference.findUnique({
    where: { userId },
    select: {
      newBookingEnabled: true,
      cancellationEnabled: true,
      rescheduleEnabled: true,
    },
  })

  return preferences || DEFAULT_PUSH_NOTIFICATION_PREFERENCES
}
