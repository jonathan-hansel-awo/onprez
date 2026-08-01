'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, Database, LogOut, Monitor, Shield } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useAuth } from '@/contexts/AuthContext'

const navigation = [
  {
    name: 'Security',
    href: '/account/security',
    icon: Shield,
  },
  {
    name: 'Sessions',
    href: '/account/sessions',
    icon: Monitor,
  },
  {
    name: 'Activity',
    href: '/account/activity',
    icon: Activity,
  },
  {
    name: 'Data & privacy',
    href: '/account/data',
    icon: Database,
  },
]

export function AccountSidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()

  return (
    <nav className="space-y-1" aria-label="Account settings">
      {navigation.map(item => {
        const isActive = pathname === item.href
        const Icon = item.icon

        return (
          <Link
            key={item.name}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
              isActive
                ? 'bg-onprez-blue text-white'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-950'
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span>{item.name}</span>
          </Link>
        )
      })}

      <div className="mt-4 border-t border-gray-200 pt-4">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </div>
    </nav>
  )
}
