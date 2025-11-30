'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Settings,
  Package,
  Calendar,
  Users,
  BarChart3,
  Share2,
  Menu,
  X,
  ChevronRight,
  Palette,
  MessageSquare,
  HelpCircle,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
import { UserMenu } from '@/components/navigation/UserMenu'
import { Logo } from '@/components/navigation'

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Presence', href: '/dashboard/presence', icon: Palette },
  { name: 'Services', href: '/dashboard/services', icon: Package },
  { name: 'Bookings', href: '/dashboard/bookings', icon: Calendar },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Inquiries', href: '/dashboard/inquiries', icon: MessageSquare },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Sharing', href: '/dashboard/sharing', icon: Share2 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false) // Mobile sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false) // Desktop collapse
  const pathname = usePathname()

  // Check if we're in the presence editor
  const isPresenceEditor = pathname.includes('/dashboard/presence/editor')

  return (
    <div className="min-h-screen bg-gray-50">
      {!isPresenceEditor && (
        <>
          {/* Mobile sidebar backdrop */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
              />
            )}
          </AnimatePresence>

          {/* Sidebar */}
          <aside
            className={`
          fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200
          transform transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}
          w-64
        `}
          >
            <div className="flex flex-col h-full">
              {/* Logo & Collapse Button */}
              <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
                {!sidebarCollapsed && <Logo />}

                {/* Desktop collapse button */}
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="hidden lg:block p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {sidebarCollapsed ? (
                    <PanelLeft className="w-5 h-5 text-gray-600" />
                  ) : (
                    <PanelLeftClose className="w-5 h-5 text-gray-600" />
                  )}
                </button>

                {/* Mobile close button */}
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navigation.map((item, index) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  const Icon = item.icon

                  return (
                    <Link
                      key={index}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative
                    ${
                      isActive
                        ? 'bg-gradient-to-r from-onprez-blue to-onprez-purple text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }
                    ${sidebarCollapsed ? 'lg:justify-center' : ''}
                  `}
                      title={sidebarCollapsed ? item.name : undefined}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!sidebarCollapsed && <span className="lg:inline">{item.name}</span>}
                    </Link>
                  )
                })}
              </nav>

              {/* Help link */}
              <div className="p-4 border-t border-gray-200">
                <Link
                  href="/help"
                  className={`
                flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors
                ${sidebarCollapsed ? 'lg:justify-center' : ''}
              `}
                  title={sidebarCollapsed ? 'Help & Support' : undefined}
                >
                  <HelpCircle className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span className="lg:inline">Help & Support</span>}
                </Link>
              </div>
            </div>
          </aside>
        </>
      )}
      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center">
          <div className="flex items-center justify-between w-full px-4 sm:px-6 lg:px-8">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Breadcrumbs */}
            <div className="flex-1">
              <Breadcrumbs />
            </div>

            {/* User menu */}
            <UserMenu />
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}

function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  // Don't show breadcrumbs if only on /dashboard
  if (segments.length <= 1) {
    return null
  }

  return (
    <nav className="hidden sm:flex items-center gap-2 text-sm">
      {segments.map((segment, index) => {
        const href = '/' + segments.slice(0, index + 1).join('/')
        const isLast = index === segments.length - 1
        const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')

        return (
          <div key={index} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
            {isLast ? (
              <span className="font-medium text-gray-900">{label}</span>
            ) : (
              <Link href={href} className="text-gray-600 hover:text-gray-900 transition-colors">
                {label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
