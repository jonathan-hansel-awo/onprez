'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Shield, User, CreditCard, Bell, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const navigation = [
  {
    name: 'Profile',
    href: '/account/profile',
    icon: User,
    badge: null,
  },
  {
    name: 'Security',
    href: '/account/security',
    icon: Shield,
    badge: null,
  },
  {
    name: 'Billing',
    href: '/account/billing',
    icon: CreditCard,
    badge: 'Soon',
  },
  {
    name: 'Notifications',
    href: '/account/notifications',
    icon: Bell,
    badge: 'Soon',
  },
]

export function AccountSidebar() {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      {navigation.map(item => {
        const isActive = pathname === item.href
        const Icon = item.icon

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-onprez-blue text-white'
                : item.badge
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
            )}
            onClick={e => {
              if (item.badge) {
                e.preventDefault()
              }
            }}
          >
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </div>
            {item.badge && (
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </Link>
        )
      })}

      <div className="pt-4 mt-4 border-t border-gray-200">
        <button
          onClick={() => {
            // Handle logout
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            window.location.href = '/login'
          }}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </nav>
  )
}
