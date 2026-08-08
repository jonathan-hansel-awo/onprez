'use client'

import Link from 'next/link'
import { CalendarDays, List } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface BookingsViewNavigationProps {
  current: 'list' | 'calendar'
}

const views = [
  { id: 'list' as const, label: 'List', href: '/dashboard/bookings', icon: List },
  {
    id: 'calendar' as const,
    label: 'Calendar',
    href: '/dashboard/bookings/calendar',
    icon: CalendarDays,
  },
]

export function BookingsViewNavigation({ current }: BookingsViewNavigationProps) {
  return (
    <nav
      aria-label="Bookings view"
      className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1"
    >
      {views.map(view => {
        const Icon = view.icon
        const isCurrent = current === view.id

        return (
          <Link
            key={view.id}
            href={view.href}
            aria-current={isCurrent ? 'page' : undefined}
            className={cn(
              'flex min-h-10 items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              isCurrent ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {view.label}
          </Link>
        )
      })}
    </nav>
  )
}
