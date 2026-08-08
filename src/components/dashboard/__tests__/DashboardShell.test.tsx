import { render, screen, within } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import DashboardShell from '../DashboardShell'

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

jest.mock('@/components/navigation/UserMenu', () => ({
  UserMenu: () => <div data-testid="user-menu" />,
}))

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

describe('DashboardShell', () => {
  it('renders Calendar in the sidebar and marks it active on calendar routes', () => {
    mockUsePathname.mockReturnValue('/dashboard/bookings/calendar')

    render(
      <DashboardShell>
        <p>Calendar content</p>
      </DashboardShell>
    )

    const navigation = screen.getByRole('navigation', { name: 'Dashboard navigation' })
    const calendarLink = within(navigation).getByRole('link', { name: 'Calendar' })
    const bookingsLink = within(navigation).getByRole('link', { name: 'Bookings' })

    expect(calendarLink).toHaveAttribute('href', '/dashboard/bookings/calendar')
    expect(calendarLink).toHaveAttribute('aria-current', 'page')
    expect(bookingsLink).not.toHaveAttribute('aria-current')
  })
})
