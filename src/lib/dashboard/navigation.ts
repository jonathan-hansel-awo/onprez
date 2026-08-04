export type DashboardNavigationIcon =
  | 'overview'
  | 'bookings'
  | 'money'
  | 'customers'
  | 'presence'
  | 'services'
  | 'inquiries'
  | 'analytics'
  | 'sharing'
  | 'settings'

export interface DashboardNavigationItem {
  name: string
  href: string
  icon: DashboardNavigationIcon
}

export interface DashboardNavigationGroup {
  id: string
  label: string
  items: DashboardNavigationItem[]
}

export const dashboardPrimaryNavigationGroups: DashboardNavigationGroup[] = [
  {
    id: 'daily-work',
    label: 'Daily work',
    items: [
      { name: 'Overview', href: '/dashboard', icon: 'overview' },
      { name: 'Bookings', href: '/dashboard/bookings', icon: 'bookings' },
      { name: 'Money', href: '/dashboard/money', icon: 'money' },
      { name: 'Customers', href: '/dashboard/customers', icon: 'customers' },
    ],
  },
  {
    id: 'presence',
    label: 'Your presence',
    items: [
      { name: 'Presence', href: '/dashboard/presence', icon: 'presence' },
      { name: 'Services', href: '/dashboard/services', icon: 'services' },
    ],
  },
]

export const dashboardMoreToolsNavigation: DashboardNavigationItem[] = [
  { name: 'Inquiries', href: '/dashboard/inquiries', icon: 'inquiries' },
  { name: 'Analytics', href: '/dashboard/analytics', icon: 'analytics' },
  { name: 'Sharing', href: '/dashboard/sharing', icon: 'sharing' },
  { name: 'Settings', href: '/dashboard/settings', icon: 'settings' },
]

export const dashboardNavigationItems = [
  ...dashboardPrimaryNavigationGroups.flatMap(group => group.items),
  ...dashboardMoreToolsNavigation,
]

function normalisePath(pathname: string) {
  const path = pathname.split(/[?#]/, 1)[0]

  if (path === '/') return path
  return path.replace(/\/+$/, '') || '/'
}

export function isDashboardNavigationItemActive(pathname: string, href: string) {
  const currentPath = normalisePath(pathname)
  const itemPath = normalisePath(href)

  if (itemPath === '/dashboard') {
    return currentPath === itemPath
  }

  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`)
}

export function isDashboardNavigationGroupActive(
  pathname: string,
  items: DashboardNavigationItem[]
) {
  return items.some(item => isDashboardNavigationItemActive(pathname, item.href))
}
