import {
  dashboardMoreToolsNavigation,
  dashboardNavigationItems,
  dashboardPrimaryNavigationGroups,
  isDashboardNavigationGroupActive,
  isDashboardNavigationItemActive,
} from '@/lib/dashboard/navigation'

describe('dashboard navigation information architecture', () => {
  it('keeps the five core destinations in the primary navigation', () => {
    const primaryItems = dashboardPrimaryNavigationGroups.flatMap(group => group.items)

    expect(primaryItems.map(item => item.name)).toEqual([
      'Overview',
      'Bookings',
      'Customers',
      'Presence',
      'Services',
    ])
    expect(dashboardPrimaryNavigationGroups.map(group => group.label)).toEqual([
      'Daily work',
      'Your presence',
    ])
  })

  it('moves lower-frequency destinations into More tools without removing routes', () => {
    expect(dashboardMoreToolsNavigation.map(item => item.name)).toEqual([
      'Inquiries',
      'Analytics',
      'Sharing',
      'Settings',
    ])

    expect(dashboardNavigationItems.map(item => item.href)).toEqual([
      '/dashboard',
      '/dashboard/bookings',
      '/dashboard/customers',
      '/dashboard/presence',
      '/dashboard/services',
      '/dashboard/inquiries',
      '/dashboard/analytics',
      '/dashboard/sharing',
      '/dashboard/settings',
    ])
  })

  it('does not contain duplicate names or destinations', () => {
    const names = dashboardNavigationItems.map(item => item.name)
    const hrefs = dashboardNavigationItems.map(item => item.href)

    expect(new Set(names).size).toBe(names.length)
    expect(new Set(hrefs).size).toBe(hrefs.length)
  })
})

describe('dashboard navigation active-route matching', () => {
  it('marks Overview active only for the dashboard root', () => {
    expect(isDashboardNavigationItemActive('/dashboard', '/dashboard')).toBe(true)
    expect(isDashboardNavigationItemActive('/dashboard/', '/dashboard')).toBe(true)
    expect(isDashboardNavigationItemActive('/dashboard/bookings', '/dashboard')).toBe(false)
  })

  it('marks nested routes active for their owning destination', () => {
    expect(
      isDashboardNavigationItemActive('/dashboard/presence/editor', '/dashboard/presence')
    ).toBe(true)
    expect(
      isDashboardNavigationItemActive('/dashboard/settings/booking', '/dashboard/settings')
    ).toBe(true)
  })

  it('does not match unrelated routes that merely share a prefix', () => {
    expect(
      isDashboardNavigationItemActive('/dashboard/bookings-archive', '/dashboard/bookings')
    ).toBe(false)
    expect(isDashboardNavigationItemActive('/dashboarding', '/dashboard')).toBe(false)
  })

  it('detects when an advanced route should reveal More tools', () => {
    expect(
      isDashboardNavigationGroupActive('/dashboard/analytics', dashboardMoreToolsNavigation)
    ).toBe(true)
    expect(
      isDashboardNavigationGroupActive('/dashboard/services', dashboardMoreToolsNavigation)
    ).toBe(false)
  })
})
