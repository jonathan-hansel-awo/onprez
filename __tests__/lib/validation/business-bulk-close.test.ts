import { bulkCloseDatesSchema } from '@/lib/validation/business'

describe('bulkCloseDatesSchema', () => {
  it('accepts multiple unique calendar dates with a reason', () => {
    const result = bulkCloseDatesSchema.safeParse({
      dates: ['2026-08-14', '2026-08-15', '2026-08-17'],
      name: 'Time off',
      notes: 'Annual leave',
    })

    expect(result.success).toBe(true)
  })

  it('rejects duplicate or invalid dates', () => {
    expect(
      bulkCloseDatesSchema.safeParse({
        dates: ['2026-08-14', '2026-08-14'],
        name: 'Time off',
      }).success
    ).toBe(false)

    expect(
      bulkCloseDatesSchema.safeParse({ dates: ['14-08-2026'], name: 'Time off' }).success
    ).toBe(false)
  })
})
