import { Prisma, PushNotificationEventType, type PushNotificationOutbox } from '@prisma/client'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { formatLongDateInTimezone, formatTimeInTimezone } from '@/lib/utils/timezone'

type PushOutboxDbClient = Pick<typeof prisma, 'pushNotificationOutbox'>

const pushPayloadSchema = z.object({
  title: z.string().trim().min(1).max(80),
  body: z.string().trim().min(1).max(180),
  url: z
    .string()
    .trim()
    .regex(/^\/dashboard(?:\/|$|\?)/),
  tag: z.string().trim().min(1).max(160),
  eventType: z.nativeEnum(PushNotificationEventType),
  bookingId: z.string().trim().min(1).max(128),
})

export type BookingPushPayload = z.infer<typeof pushPayloadSchema>

interface EnqueueBookingPushInput {
  eventType: PushNotificationEventType
  eventKey: string
  businessId: string
  appointmentId: string
  customerName: string
  serviceName: string
  startTime: Date
  timezone: string
}

function eventHeading(eventType: PushNotificationEventType, customerName: string): string {
  switch (eventType) {
    case PushNotificationEventType.NEW_BOOKING:
      return `New booking from ${customerName}`
    case PushNotificationEventType.BOOKING_CANCELLED:
      return 'Booking cancelled'
    case PushNotificationEventType.BOOKING_RESCHEDULED:
      return 'Booking rescheduled'
  }
}

export function buildBookingPushPayload(input: EnqueueBookingPushInput): BookingPushPayload {
  const date = formatLongDateInTimezone(input.startTime, input.timezone)
  const time = formatTimeInTimezone(input.startTime, input.timezone)

  return pushPayloadSchema.parse({
    title: eventHeading(input.eventType, input.customerName),
    body: `${input.customerName} · ${input.serviceName} · ${date} at ${time}`,
    url: `/dashboard/bookings?businessId=${encodeURIComponent(
      input.businessId
    )}&bookingId=${encodeURIComponent(input.appointmentId)}`,
    tag: `booking-${input.appointmentId}-${input.eventType.toLowerCase()}`,
    eventType: input.eventType,
    bookingId: input.appointmentId,
  })
}

export function parseBookingPushPayload(value: Prisma.JsonValue): BookingPushPayload {
  return pushPayloadSchema.parse(value)
}

export async function enqueueBookingPushNotification(
  db: PushOutboxDbClient,
  input: EnqueueBookingPushInput
): Promise<PushNotificationOutbox> {
  const payload = buildBookingPushPayload(input)

  return db.pushNotificationOutbox.upsert({
    where: { eventKey: input.eventKey },
    create: {
      eventKey: input.eventKey,
      businessId: input.businessId,
      appointmentId: input.appointmentId,
      eventType: input.eventType,
      payload,
    },
    update: {},
  })
}
