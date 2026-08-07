import fs from 'node:fs'
import path from 'node:path'

describe('dashboard quick-create booking links', () => {
  const dashboardPage = fs.readFileSync(
    path.join(process.cwd(), 'src/app/dashboard/page.tsx'),
    'utf8'
  )
  const bookingsPage = fs.readFileSync(
    path.join(process.cwd(), 'src/app/dashboard/bookings/page.tsx'),
    'utf8'
  )

  it('routes dashboard booking actions to the existing manual-booking widget', () => {
    expect(dashboardPage).toContain(
      "const QUICK_CREATE_BOOKING_HREF = '/dashboard/bookings?create=true'"
    )
    expect(dashboardPage).not.toContain('/dashboard/bookings/new')
  })

  it('opens the quick-create modal from the dashboard deep link', () => {
    expect(bookingsPage).toContain("searchParams.get('create') === 'true'")
    expect(bookingsPage).toContain("if (isQuickCreateOpen) params.set('create', 'true')")
    expect(bookingsPage).toContain('isOpen={isQuickCreateOpen}')
  })
})
