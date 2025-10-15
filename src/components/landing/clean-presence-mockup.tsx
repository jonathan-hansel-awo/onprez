'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

export function CleanPresenceMockup() {
  return (
    <motion.div
      className="relative w-full max-w-md mx-auto"
      initial={{ scale: 0.8, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {/* Glow Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-onprez-blue/20 to-onprez-purple/20 rounded-2xl blur-3xl"
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Presence Page Mockup */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-onprez-blue to-onprez-purple p-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-2xl shadow-lg">
              ✨
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Your Business</h3>
              <p className="text-white/80 text-sm">onprez.com/yourbrand</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Services */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '💼', label: 'Services', color: 'from-blue-50 to-blue-100' },
              { icon: '📅', label: 'Booking', color: 'from-green-50 to-green-100' },
            ].map((item, i) => (
              <motion.div
                key={i}
                className={`bg-gradient-to-br ${item.color} rounded-lg p-3 relative overflow-hidden`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <div className="text-2xl mb-1">{item.icon}</div>
                <p className="text-xs font-semibold text-gray-700">{item.label}</p>

                {/* Checkmark */}
                <motion.div
                  className="absolute top-1 right-1 w-5 h-5 bg-onprez-green rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + i * 0.1, type: 'spring' }}
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* Gallery */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <div className="grid grid-cols-3 gap-1.5">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="aspect-square rounded-lg overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, 
                      hsl(${210 + i * 10}, 70%, 60%), 
                      hsl(${220 + i * 10}, 70%, 70%))`,
                  }}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 + i * 0.05, type: 'spring' }}
                />
              ))}
            </div>
          </motion.div>

          {/* Testimonial */}
          <motion.div
            className="bg-gray-50 rounded-lg p-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.9 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-400" />
              <div>
                <p className="text-xs font-semibold text-gray-900">Happy Client</p>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xs">
                      ★
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-600">&quot;Everything in one place!&quot;</p>
          </motion.div>
        </div>

        {/* CTA Button */}
        <motion.div
          className="p-4 pt-0"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 1.1 }}
        >
          <div className="bg-gradient-to-r from-onprez-blue to-onprez-purple text-white text-center py-3 rounded-lg font-semibold text-sm">
            Book Now
          </div>
        </motion.div>
      </div>

      {/* Floating animation */}
      <motion.div
        className="absolute inset-0"
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  )
}
