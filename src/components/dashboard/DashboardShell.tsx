'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Package,
  Palette,
  PanelLeft,
  PanelLeftClose,
  Settings,
  Share2,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react'
import { UserMenu } from '@/components/navigation/UserMenu'
import { Logo } from '@/components/navigation'
import {
  dashboardMoreToolsNavigation,
  dashboardPrimaryNavigationGroups,
  isDashboardNavigationGroupActive,
  isDashboardNavigationItemActive,
  type DashboardNavigationIcon,
  type DashboardNavigationItem,
} from '@/lib/dashboard/navigation'

const navigationIconComponents: Record<DashboardNavigationIcon, LucideIcon> = {
  overview: LayoutDashboard,
  bookings: Calendar,
  customers: Users,
  presence: Palette,
  services: Package,
  inquiries: MessageSquare,
  analytics: BarChart3,
  sharing: Share2,
  settings: Settings,
}

interface DashboardNavigationLinkProps {
  item: DashboardNavigationItem
  pathname: string
  sidebarCollapsed: boolean
  onNavigate: () => void
  nested?: boolean
}

function DashboardNavigationLink({
  item,
  pathname,
  sidebarCollapsed,
  onNavigate,
  nested = false,
}: DashboardNavigationLinkProps) {
  const isActive = isDashboardNavigationItemActive(pathname, item.href)
  const Icon = navigationIconComponents[item.icon]

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isActive ? 'page' : undefined}
      className={`relative flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        isActive
          ? 'bg-gradient-to-r from-onprez-blue to-onprez-purple text-white'
          : 'text-gray-700 hover:bg-gray-100'
      } ${nested ? 'lg:ml-2' : ''} ${sidebarCollapsed ? 'lg:justify-center' : ''}`}
      title={sidebarCollapsed ? item.name : undefined}
    >
      <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
      <span className={sidebarCollapsed ? 'lg:hidden' : undefined}>{item.name}</span>
    </Link>
  )
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const pathname = usePathname()
  const moreToolsActive = isDashboardNavigationGroupActive(pathname, dashboardMoreToolsNavigation)
  const [moreToolsOpen, setMoreToolsOpen] = useState(moreToolsActive)

  useEffect(() => {
    if (moreToolsActive) {
      setMoreToolsOpen(true)
    }
  }, [moreToolsActive])

  const isPresenceEditor = pathname.includes('/dashboard/presence/editor')

  function handleMoreToolsToggle() {
    if (sidebarCollapsed) {
      setSidebarCollapsed(false)
      setMoreToolsOpen(true)
      return
    }

    setMoreToolsOpen(current => !current)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {!isPresenceEditor && (
        <>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
              />
            )}
          </AnimatePresence>

          <aside
            className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-gray-200 bg-white transition-all duration-300 ease-in-out ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } lg:translate-x-0 ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
          >
            <div className="flex h-full flex-col">
              <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6">
                <div className={sidebarCollapsed ? 'lg:hidden' : undefined}>
                  <Logo />
                </div>

                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(current => !current)}
                  className="hidden min-h-11 min-w-11 items-center justify-center rounded-lg transition-colors hover:bg-gray-100 lg:flex"
                  aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {sidebarCollapsed ? (
                    <PanelLeft className="h-5 w-5 text-gray-600" />
                  ) : (
                    <PanelLeftClose className="h-5 w-5 text-gray-600" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-lg transition-colors hover:bg-gray-100 lg:hidden"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav
                className="flex-1 space-y-5 overflow-y-auto px-3 py-4"
                aria-label="Dashboard navigation"
              >
                {dashboardPrimaryNavigationGroups.map(group => (
                  <div key={group.id} className="space-y-1" role="group" aria-label={group.label}>
                    <p
                      className={`px-3 pb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-gray-600 ${
                        sidebarCollapsed ? 'lg:hidden' : ''
                      }`}
                    >
                      {group.label}
                    </p>

                    {group.items.map(item => (
                      <DashboardNavigationLink
                        key={item.href}
                        item={item}
                        pathname={pathname}
                        sidebarCollapsed={sidebarCollapsed}
                        onNavigate={() => setSidebarOpen(false)}
                      />
                    ))}
                  </div>
                ))}

                <div className="border-t border-gray-200 pt-3">
                  <button
                    type="button"
                    onClick={handleMoreToolsToggle}
                    aria-expanded={moreToolsOpen}
                    aria-controls="dashboard-more-tools"
                    className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                      moreToolsActive
                        ? 'bg-onprez-blue/10 text-onprez-blue'
                        : 'text-gray-700 hover:bg-gray-100'
                    } ${sidebarCollapsed ? 'lg:justify-center' : ''}`}
                    title={sidebarCollapsed ? 'More tools' : undefined}
                  >
                    <Wrench className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                    <span className={sidebarCollapsed ? 'lg:hidden' : undefined}>More tools</span>
                    <ChevronDown
                      className={`ml-auto h-4 w-4 transition-transform ${
                        moreToolsOpen ? 'rotate-180' : ''
                      } ${sidebarCollapsed ? 'lg:hidden' : ''}`}
                      aria-hidden="true"
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {moreToolsOpen && (
                      <motion.div
                        id="dashboard-more-tools"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className={`mt-1 space-y-1 overflow-hidden ${
                          sidebarCollapsed ? 'lg:hidden' : ''
                        }`}
                      >
                        {dashboardMoreToolsNavigation.map(item => (
                          <DashboardNavigationLink
                            key={item.href}
                            item={item}
                            pathname={pathname}
                            sidebarCollapsed={sidebarCollapsed}
                            onNavigate={() => setSidebarOpen(false)}
                            nested
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </nav>

              <div className="border-t border-gray-200 p-4">
                <Link
                  href="/help"
                  onClick={() => setSidebarOpen(false)}
                  className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 ${
                    sidebarCollapsed ? 'lg:justify-center' : ''
                  }`}
                  title={sidebarCollapsed ? 'Help & Support' : undefined}
                >
                  <HelpCircle className="h-5 w-5 flex-shrink-0" />
                  <span className={sidebarCollapsed ? 'lg:hidden' : undefined}>Help & Support</span>
                </Link>
              </div>
            </div>
          </aside>
        </>
      )}

      <div
        className={`min-w-0 overflow-x-clip transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-gray-200 bg-white">
          <div className="flex w-full items-center justify-between px-4 sm:px-6 lg:px-8">
            {isPresenceEditor ? (
              <Link
                href="/dashboard/presence"
                className="flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-onprez-blue hover:bg-onprez-blue/10 lg:hidden"
              >
                <ChevronRight className="mr-1 h-5 w-5 rotate-180" aria-hidden="true" />
                Presence
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg transition-colors hover:bg-gray-100 lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            )}

            <div className="flex-1">
              <Breadcrumbs />
            </div>

            <UserMenu />
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}

function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length <= 1) {
    return null
  }

  return (
    <nav className="hidden items-center gap-2 text-sm sm:flex" aria-label="Breadcrumb">
      {segments.map((segment, index) => {
        const href = '/' + segments.slice(0, index + 1).join('/')
        const isLast = index === segments.length - 1
        const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')

        return (
          <div key={href} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
            {isLast ? (
              <span className="font-medium text-gray-900">{label}</span>
            ) : (
              <Link href={href} className="text-gray-600 transition-colors hover:text-gray-900">
                {label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
