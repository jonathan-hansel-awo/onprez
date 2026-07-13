export const DEFAULT_TIMEZONE = 'Europe/London'

interface LocalDateTimeParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const TIME_PATTERN = /^(\d{2}):(\d{2})$/

function localParts(date: Date, timezone: string): LocalDateTimeParts {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
  }
}

function parseLocalDateTime(date: string, time: string): LocalDateTimeParts {
  const dateMatch = DATE_PATTERN.exec(date)
  const timeMatch = TIME_PATTERN.exec(time)

  if (!dateMatch || !timeMatch) {
    throw new RangeError('Date and time must use YYYY-MM-DD and HH:MM formats')
  }

  const result = {
    year: Number(dateMatch[1]),
    month: Number(dateMatch[2]),
    day: Number(dateMatch[3]),
    hour: Number(timeMatch[1]),
    minute: Number(timeMatch[2]),
  }
  const calendarCheck = new Date(Date.UTC(result.year, result.month - 1, result.day))

  if (
    result.hour > 23 ||
    result.minute > 59 ||
    calendarCheck.getUTCFullYear() !== result.year ||
    calendarCheck.getUTCMonth() !== result.month - 1 ||
    calendarCheck.getUTCDate() !== result.day
  ) {
    throw new RangeError('Invalid local date or time')
  }

  return result
}

function sameLocalTime(left: LocalDateTimeParts, right: LocalDateTimeParts): boolean {
  return (
    left.year === right.year &&
    left.month === right.month &&
    left.day === right.day &&
    left.hour === right.hour &&
    left.minute === right.minute
  )
}

export function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone: timezone }).format()
    return true
  } catch {
    return false
  }
}

/**
 * Convert an exact business-local wall-clock time to UTC.
 *
 * Nonexistent times during the spring DST jump are rejected. During the autumn
 * overlap, the earlier of the two matching instants is selected consistently.
 */
export function zonedDateTimeToUtc(date: string, time: string, timezone: string): Date {
  if (!isValidTimezone(timezone)) {
    throw new RangeError(`Invalid IANA timezone: ${timezone}`)
  }

  const requested = parseLocalDateTime(date, time)
  const wallClockAsUtc = Date.UTC(
    requested.year,
    requested.month - 1,
    requested.day,
    requested.hour,
    requested.minute
  )
  const offsets = new Set<number>()

  // Sampling both sides of the requested day finds every offset involved in a
  // normal DST transition without relying on the server's own timezone.
  for (const hours of [-36, -12, 0, 12, 36]) {
    const instant = new Date(wallClockAsUtc + hours * 60 * 60_000)
    const represented = localParts(instant, timezone)
    const representedAsUtc = Date.UTC(
      represented.year,
      represented.month - 1,
      represented.day,
      represented.hour,
      represented.minute
    )
    offsets.add(representedAsUtc - instant.getTime())
  }

  const matches = [...offsets]
    .map(offset => new Date(wallClockAsUtc - offset))
    .filter(candidate => sameLocalTime(localParts(candidate, timezone), requested))
    .sort((left, right) => left.getTime() - right.getTime())

  if (matches.length === 0) {
    throw new RangeError('The selected local time does not exist in this timezone')
  }

  return matches[0]
}

export function addCalendarDays(date: string, days: number): string {
  const parsed = parseLocalDateTime(date, '00:00')
  const result = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day + days))
  return result.toISOString().slice(0, 10)
}

export function getUtcDayRange(date: string, timezone: string): { start: Date; end: Date } {
  return {
    start: zonedDateTimeToUtc(date, '00:00', timezone),
    end: zonedDateTimeToUtc(addCalendarDays(date, 1), '00:00', timezone),
  }
}

export function getDateInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function formatTimeInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

export function formatDateInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function formatLongDateInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function convertBetweenTimezones(date: Date, fromTz: string, toTz: string) {
  const originalTime = formatTimeInTimezone(date, fromTz)
  const targetTime = formatTimeInTimezone(date, toTz)

  return {
    originalTime,
    targetTime,
    originalTimezone: fromTz,
    targetTimezone: toTz,
  }
}

export function detectUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}
