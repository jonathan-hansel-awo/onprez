import { DEFAULT_SLOT_CONFIG, generateDetailedDayAvailability } from './availability'

describe('Detailed availability timezone conflicts', () => {
  it('removes a slot that overlaps an appointment in the business timezone during DST', () => {
    const date = new Date('2030-07-25T00:00:00.000Z')
    const availability = generateDetailedDayAvailability(
      date,
      [
        {
          dayOfWeek: date.getUTCDay(),
          openTime: '09:00',
          closeTime: '17:00',
          isClosed: false,
        },
      ],
      [],
      [
        {
          // 11:15–12:15 in Europe/London (BST, UTC+1).
          startTime: new Date('2030-07-25T10:15:00.000Z'),
          endTime: new Date('2030-07-25T11:15:00.000Z'),
          status: 'CONFIRMED',
        },
      ],
      {
        ...DEFAULT_SLOT_CONFIG,
        serviceDuration: 60,
        bufferTime: 0,
        slotInterval: 15,
      },
      'Europe/London'
    )

    expect(availability.slots.find(slot => slot.startTime === '12:00')).toMatchObject({
      available: false,
      reason: 'booked',
    })
    expect(availability.slots.find(slot => slot.startTime === '12:15')).toMatchObject({
      available: true,
    })
    expect(availability.availableSlots).toBe(
      availability.slots.filter(slot => slot.available).length
    )
  })
})
