import fs from 'node:fs'
import path from 'node:path'

describe('booking notification deep links', () => {
  const bookingsPage = fs.readFileSync(
    path.join(process.cwd(), 'src/app/dashboard/bookings/page.tsx'),
    'utf8'
  )
  const bookingsApi = fs.readFileSync(
    path.join(process.cwd(), 'src/app/api/dashboard/bookings/route.ts'),
    'utf8'
  )

  it('selects the notified business and fetches only the referenced booking', () => {
    expect(bookingsPage).toContain("searchParams.get('businessId')")
    expect(bookingsPage).toContain("params.set('businessId', linkedBusinessId)")
    expect(bookingsPage).toContain("params.set('bookingId', linkedBookingId)")
    expect(bookingsApi).toContain('bookingId: z.string().min(1).max(128).optional()')
    expect(bookingsApi).toContain('where.id = bookingId')
  })

  it('opens the matching booking detail instead of leaving users on a generic list', () => {
    expect(bookingsPage).toContain('booking.id === linkedBookingId')
    expect(bookingsPage).toContain('setSelectedBooking(linkedBooking)')
    expect(bookingsPage).toContain('setIsModalOpen(true)')
  })
})
