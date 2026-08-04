import {
  dashboardNavigationItems,
  dashboardPrimaryNavigationGroups,
  isDashboardNavigationItemActive,
} from '@/lib/dashboard/navigation'

describe('money dashboard contract', () => {
  it('keeps Money in the primary daily-work navigation', () => {
    const dailyWork = dashboardPrimaryNavigationGroups.find(group => group.id === 'daily-work')
    const moneyItem = dailyWork?.items.find(item => item.href === '/dashboard/money')

    expect(moneyItem).toEqual({
      name: 'Money',
      href: '/dashboard/money',
      icon: 'money',
    })
    expect(dashboardNavigationItems).toContainEqual(moneyItem)
  })

  it('marks the Money route and its descendants as active without matching other dashboard routes', () => {
    expect(isDashboardNavigationItemActive('/dashboard/money', '/dashboard/money')).toBe(true)
    expect(isDashboardNavigationItemActive('/dashboard/money/payouts', '/dashboard/money')).toBe(
      true
    )
    expect(isDashboardNavigationItemActive('/dashboard/bookings', '/dashboard/money')).toBe(false)
  })
})
