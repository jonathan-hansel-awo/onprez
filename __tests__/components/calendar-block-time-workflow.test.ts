import fs from 'node:fs'
import path from 'node:path'

describe('calendar and block-time dashboard workflow', () => {
  const dashboardPage = fs.readFileSync(
    path.join(process.cwd(), 'src/app/dashboard/page.tsx'),
    'utf8'
  )
  const bookingsPage = fs.readFileSync(
    path.join(process.cwd(), 'src/app/dashboard/bookings/page.tsx'),
    'utf8'
  )
  const calendarPage = fs.readFileSync(
    path.join(process.cwd(), 'src/app/dashboard/bookings/calendar/page.tsx'),
    'utf8'
  )
  const monthView = fs.readFileSync(
    path.join(process.cwd(), 'src/components/bookings/calendar-month-view.tsx'),
    'utf8'
  )

  it('makes the calendar and block-time workflows discoverable from the dashboard', () => {
    expect(dashboardPage).toContain('href="/dashboard/bookings/calendar"')
    expect(dashboardPage).toContain('href="/dashboard/bookings/calendar?block=true"')
    expect(dashboardPage).toContain('Block Time')
  })

  it('provides list and calendar navigation from the bookings area', () => {
    expect(bookingsPage).toContain('<BookingsViewNavigation current="list" />')
    expect(calendarPage).toContain('<BookingsViewNavigation current="calendar" />')
  })

  it('supports multi-date closures and warns without cancelling existing bookings', () => {
    expect(calendarPage).toContain("fetch('/api/business/special-dates/bulk'")
    expect(calendarPage).toContain('Blocking prevents new bookings')
    expect(calendarPage).toContain('or change existing appointments')
    expect(monthView).toContain('onSelectedDatesChange')
    expect(monthView).toContain('aria-pressed={isSelecting ? isSelected : undefined}')
  })
})
