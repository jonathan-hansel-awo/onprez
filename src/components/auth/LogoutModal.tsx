'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { LogOut, AlertTriangle } from 'lucide-react'

interface LogoutModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading?: boolean
}

export function LogoutModal({ isOpen, onClose, onConfirm, isLoading = false }: LogoutModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <LogOut className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Sign Out?</h2>
                  <p className="text-sm text-gray-600">
                    Are you sure you want to sign out of your account?
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  You&apos;ll need to sign in again to access your account.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" onClick={onClose} disabled={isLoading} className="flex-1">
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Signing out...' : 'Sign Out'}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
