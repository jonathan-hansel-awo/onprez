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
