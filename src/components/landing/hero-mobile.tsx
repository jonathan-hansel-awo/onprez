'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { AvatarStack } from '@/components/ui/avatar-stack'
import { heroAvatars } from '@/data/avatars'
import { ArrowRight, Sparkles } from 'lucide-react'

export function HeroMobile() {
  return (
    <div className="lg:hidden text-center space-y-6 mt-8">
      {/* Simple Mockup Preview */}
      <motion.div
        className="relative max-w-sm mx-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <div className="aspect-[3/4] bg-white rounded-2xl shadow-xl border border-gray-200 p-4 overflow-hidden">
          {/* Simple Static Preview */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-onprez-blue to-onprez-purple flex items-center justify-center text-white font-bold">
                AF
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-gray-900">Alex Johnson</p>
                <p className="text-xs text-gray-600">Personal Trainer</p>
              </div>
            </div>

            <div className="h-24 rounded-lg bg-gradient-to-br from-blue-400 to-purple-400" />

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-100 rounded-lg p-2">
                <p className="text-xs font-semibold text-gray-900">🏋️ Training</p>
                <p className="text-xs text-onprez-blue">$80</p>
              </div>
              <div className="bg-gray-100 rounded-lg p-2">
                <p className="text-xs font-semibold text-gray-900">🥗 Nutrition</p>
                <p className="text-xs text-onprez-blue">$50</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1">
              {[0, 1, 2, 3, 4, 5].map(i => (
                <div
                  key={i}
                  className="aspect-square rounded"
                  style={{
                    background: `linear-gradient(135deg, 
                      hsl(${i * 60}, 70%, 60%), 
                      hsl(${i * 60 + 30}, 70%, 70%))`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <motion.div
          className="absolute -top-3 -right-3 bg-gradient-to-r from-onprez-blue to-onprez-purple text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ✨ Live
        </motion.div>
      </motion.div>

      {/* Trust Indicators */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <AvatarStack avatars={heroAvatars} max={5} size="md" className="justify-center" />
        <p className="text-sm font-semibold text-gray-900 mt-3">Join 2,500+ professionals</p>
        <div className="flex items-center justify-center gap-1 mt-1">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="text-yellow-400 text-sm">
              ★
            </span>
          ))}
          <span className="ml-2 text-xs text-gray-600">4.9/5</span>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        className="grid grid-cols-3 gap-4 max-w-sm mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
      >
        <div>
          <div className="text-2xl font-bold text-gray-900">15min</div>
          <div className="text-xs text-gray-600">To go live</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">45K+</div>
          <div className="text-xs text-gray-600">Bookings</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">Free</div>
          <div className="text-xs text-gray-600">Forever</div>
        </div>
      </motion.div>
    </div>
  )
}
