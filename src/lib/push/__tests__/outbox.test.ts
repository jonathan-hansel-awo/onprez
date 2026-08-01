/** @jest-environment node */

import { PushNotificationEventType } from '@prisma/client'

import {
  buildBookingPushPayload,
  enqueueBookingPushNotification,
  parseBookingPushPayload,
} from '@/lib/push/outbox'

const input = {
  eventType: PushNotificationEventType.NEW_BOOKING,
  eventKey: 'booking:appointment-1:created',
  businessId: 'business-1',
  appointmentId: 'appointment-1',
  serviceName: 'Serenity Massage',
  startTime: new Date('2026-08-10T09:00:00.000Z'),
  timezone: 'Europe/London',
}

describe('booking push outbox', () => {
  it('builds a bounded dashboard deep link without exposing customer contact details', () => {
    const payload = buildBookingPushPayload(input)

    expect(payload).toMatchObject({
      title: 'New booking received',
      eventType: PushNotificationEventType.NEW_BOOKING,
      bookingId: 'appointment-1',
      url: '/dashboard/bookings?businessId=business-1&bookingId=appointment-1',
    })
    expect(payload.body).toContain('Serenity Massage')
    expect(JSON.stringify(payload)).not.toContain('Ada Okoro')
    expect(JSON.stringify(payload)).not.toContain('@')
    expect(JSON.stringify(payload)).not.toContain('phone')
  })

  it('rejects corrupted or external click destinations when reading stored payloads', () => {
    expect(() =>
      parseBookingPushPayload({
        ...buildBookingPushPayload(input),
        url: 'https://attacker.test/booking',
      })
    ).toThrow()
  })

  it('uses an immutable event key so repeated enqueue attempts reuse one record', async () => {
    const upsert = jest.fn().mockResolvedValue({ id: 'outbox-1' })

    await enqueueBookingPushNotification({ pushNotificationOutbox: { upsert } } as never, input)

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { eventKey: input.eventKey },
        create: expect.objectContaining({
          eventKey: input.eventKey,
          appointmentId: input.appointmentId,
        }),
        update: {},
      })
    )
  })
})
