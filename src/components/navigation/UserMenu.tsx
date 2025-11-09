'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { LogoutModal } from '@/components/auth/LogoutModal'
import { User, Settings, Shield, Monitor, Activity, LogOut, ChevronDown } from 'lucide-react'

export function UserMenu() {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await logout()
    setIsLoggingOut(false)
    setShowLogoutModal(false)
  }

  if (!user) return null

  const menuItems = [
    { icon: Settings, label: 'Account Settings', href: '/account/security' },
    { icon: Shield, label: 'Security', href: '/account/security' },
    { icon: Monitor, label: 'Sessions', href: '/account/sessions' },
    { icon: Activity, label: 'Activity Log', href: '/account/activity' },
  ]

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-onprez-blue to-onprez-purple flex items-center justify-center text-white font-semibold text-sm">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <span className="hidden md:block text-sm font-medium text-gray-700">
            {user.email.split('@')[0]}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
            >
              {/* User Info */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  {user.emailVerified && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Verified
                    </span>
                  )}
                  {user.mfaEnabled && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      MFA
                    </span>
                  )}
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                {menuItems.map(item => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 hover:text-onprez-blue"
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  )
                })}
              </div>

              {/* Logout */}
              <div className="border-t border-gray-200 p-2">
                <button
                  onClick={() => {
                    setIsOpen(false)
                    setShowLogoutModal(true)
                  }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-red-600 w-full rounded-lg"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        isLoading={isLoggingOut}
      />
    </>
  )
}
