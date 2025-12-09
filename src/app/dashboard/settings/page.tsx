'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import {
  User,
  Palette,
  Clock,
  CalendarDays,
  Users,
  Settings,
  Calendar,
  Shield,
  Bell,
  CreditCard,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SettingsLink {
  href: string
  label: string
  description: string
  icon: React.ElementType
  category: 'business' | 'booking' | 'team' | 'account'
}

const SETTINGS_LINKS: SettingsLink[] = [
  // Business Settings
  {
    href: '/dashboard/settings/profile',
    label: 'Business Profile',
    description: 'Name, description, contact details, and location',
    icon: User,
    category: 'business',
  },
  {
    href: '/dashboard/settings/branding',
    label: 'Branding',
    description: 'Logo, colors, and visual identity',
    icon: Palette,
    category: 'business',
  },
  {
    href: '/dashboard/settings/features',
    label: 'Features',
    description: 'Enable or disable platform features',
    icon: Settings,
    category: 'business',
  },

  // Booking Settings
  {
    href: '/dashboard/settings/hours',
    label: 'Business Hours',
    description: 'Set your regular operating hours',
    icon: Clock,
    category: 'booking',
  },
  {
    href: '/dashboard/settings/special-dates',
    label: 'Special Dates',
    description: 'Holidays, closures, and special hours',
    icon: CalendarDays,
    category: 'booking',
  },
  {
    href: '/dashboard/settings/booking',
    label: 'Booking Rules',
    description: 'Buffer time, advance booking, cancellation policy',
    icon: Calendar,
    category: 'booking',
  },

  // Team Settings
  {
    href: '/dashboard/settings/team',
    label: 'Team Members',
    description: 'Manage staff and permissions',
    icon: Users,
    category: 'team',
  },

  // Account Settings (future)
  // {
  //   href: '/dashboard/settings/notifications',
  //   label: 'Notifications',
  //   description: 'Email and SMS notification preferences',
  //   icon: Bell,
  //   category: 'account',
  // },
  // {
  //   href: '/dashboard/settings/security',
  //   label: 'Security',
  //   description: 'Password, two-factor authentication',
  //   icon: Shield,
  //   category: 'account',
  // },
  // {
  //   href: '/dashboard/settings/billing',
  //   label: 'Billing',
  //   description: 'Subscription and payment methods',
  //   icon: CreditCard,
  //   category: 'account',
  // },
]

const CATEGORIES = [
  { id: 'business', label: 'Business', description: 'Configure your business information' },
  { id: 'booking', label: 'Booking', description: 'Control how customers book appointments' },
  { id: 'team', label: 'Team', description: 'Manage your team and access' },
  // { id: 'account', label: 'Account', description: 'Your account and billing' },
]

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your business settings and preferences</p>
      </div>

      {/* Settings by Category */}
      {CATEGORIES.map(category => {
        const categoryLinks = SETTINGS_LINKS.filter(link => link.category === category.id)

        if (categoryLinks.length === 0) return null

        return (
          <div key={category.id}>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{category.label}</h2>
              <p className="text-sm text-gray-500">{category.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryLinks.map(link => (
                <Link key={link.href} href={link.href}>
                  <Card className="h-full hover:shadow-md hover:border-onprez-blue/30 transition-all cursor-pointer group">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 rounded-lg bg-gray-100 group-hover:bg-blue-50 transition-colors">
                          <link.icon className="w-5 h-5 text-gray-600 group-hover:text-onprez-blue transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900 group-hover:text-onprez-blue transition-colors">
                              {link.label}
                            </h3>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-onprez-blue group-hover:translate-x-1 transition-all" />
                          </div>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {link.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )
      })}

      {/* Quick Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-5">
          <h3 className="font-medium text-blue-900 mb-2">💡 Quick Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              • Set up your <strong>Business Hours</strong> first to enable online booking
            </li>
            <li>
              • Add <strong>Special Dates</strong> for holidays to prevent unwanted bookings
            </li>
            <li>
              • Configure <strong>Booking Rules</strong> to control buffer time and advance booking
            </li>
            <li>
              • Customize your <strong>Branding</strong> to match your business identity
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
