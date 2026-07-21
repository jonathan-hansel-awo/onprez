import { render, screen, waitFor } from '@/lib/test-utils'
import { Calendar } from 'lucide-react'
import { GuidedEmptyState } from '@/components/dashboard/guided-empty-state'
import CustomersPage from '@/app/dashboard/customers/page'
import AnalyticsPage from '@/app/dashboard/analytics/page'

describe('guided dashboard empty states', () => {
  afterEach(() => {
    jest.restoreAllMocks()
    delete (global as { fetch?: typeof fetch }).fetch
  })

  it('provides a clear primary and secondary next action', () => {
    render(
      <GuidedEmptyState
        icon={Calendar}
        title="Nothing booked yet"
        description="Give customers a way to book."
        action={{ label: 'Share presence', href: '/dashboard/sharing' }}
        secondaryAction={{ label: 'Review services', href: '/dashboard/services' }}
      />
    )

    expect(screen.getByRole('heading', { name: 'Nothing booked yet' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /share presence/i })).toHaveAttribute(
      'href',
      '/dashboard/sharing'
    )
    expect(screen.getByRole('link', { name: /review services/i })).toHaveAttribute(
      'href',
      '/dashboard/services'
    )
  })

  it('guides a business with no customers towards acquisition', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { customers: [] } }),
    }) as typeof fetch

    render(<CustomersPage />)

    expect(await screen.findByText(/customer list will grow/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /open your presence/i })).toHaveAttribute(
      'href',
      '/dashboard/presence'
    )
  })

  it('explains why analytics are empty and how to create activity', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          stats: {
            totalBookings: 0,
            totalRevenue: 0,
            totalCustomers: 0,
            pendingBookings: 0,
            bookingsTrend: 0,
            revenueTrend: 0,
          },
        },
      }),
    }) as typeof fetch

    render(<AnalyticsPage />)

    expect(await screen.findByText(/insights begin with your first booking/i)).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('Bookings this month')).not.toBeInTheDocument())
    expect(screen.getByRole('link', { name: /check your services/i })).toHaveAttribute(
      'href',
      '/dashboard/services'
    )
  })
})
