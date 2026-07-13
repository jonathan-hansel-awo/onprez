import {
  formatLongDateInTimezone,
  formatTimeInTimezone,
  getUtcDayRange,
  isValidTimezone,
  zonedDateTimeToUtc,
} from '@/lib/utils/timezone'

describe('business timezone utilities', () => {
  const timezone = 'Europe/London'

  it('accepts IANA zones and rejects legacy timezone labels', () => {
    expect(isValidTimezone(timezone)).toBe(true)
    expect(isValidTimezone('BST/LONDON')).toBe(false)
  })

  it('stores winter and summer business times as the correct UTC instants', () => {
    expect(zonedDateTimeToUtc('2030-01-15', '10:00', timezone).toISOString()).toBe(
      '2030-01-15T10:00:00.000Z'
    )
    expect(zonedDateTimeToUtc('2030-07-15', '10:00', timezone).toISOString()).toBe(
      '2030-07-15T09:00:00.000Z'
    )
  })

  it('rejects a local time skipped by the spring DST transition', () => {
    expect(() => zonedDateTimeToUtc('2030-03-31', '01:30', timezone)).toThrow('does not exist')
  })

  it('uses the earlier instant for an ambiguous autumn DST time', () => {
    expect(zonedDateTimeToUtc('2030-10-27', '01:30', timezone).toISOString()).toBe(
      '2030-10-27T00:30:00.000Z'
    )
  })

  it('creates 23-hour and 25-hour UTC ranges for DST transition days', () => {
    const spring = getUtcDayRange('2030-03-31', timezone)
    const autumn = getUtcDayRange('2030-10-27', timezone)

    expect(spring.end.getTime() - spring.start.getTime()).toBe(23 * 60 * 60_000)
    expect(autumn.end.getTime() - autumn.start.getTime()).toBe(25 * 60 * 60_000)
  })

  it('renders customer-facing dates and times in the business timezone', () => {
    const appointment = new Date('2030-07-15T09:00:00.000Z')

    expect(formatLongDateInTimezone(appointment, timezone)).toBe('Monday, 15 July 2030')
    expect(formatTimeInTimezone(appointment, timezone)).toBe('10:00')
  })
})
