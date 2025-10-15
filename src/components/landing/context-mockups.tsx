'use client'

import { motion } from 'framer-motion'

interface ContextMockupProps {
  type: 'instagram' | 'business-card' | 'email' | 'google' | 'speech'
  handle?: string
}

export function ContextMockup({ type, handle = 'your-name' }: ContextMockupProps) {
  switch (type) {
    case 'instagram':
      return (
        <div className="w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          {/* Instagram Header */}
          <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 p-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white" />
              <div>
                <p className="text-white font-semibold text-sm">{handle.replace(/-/g, '_')}</p>
                <p className="text-white/80 text-xs">Professional</p>
              </div>
            </div>
          </div>
          {/* Bio */}
          <div className="p-4 bg-white">
            <p className="text-sm text-gray-700 mb-2">✨ Professional Services</p>
            <p className="text-sm text-gray-700 mb-3">📍 Your Location</p>
            <motion.div
              className="bg-blue-50 border-2 border-onprez-blue rounded-lg p-2 text-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <p className="text-onprez-blue font-bold text-sm break-all">🔗 onprez.com/{handle}</p>
            </motion.div>
          </div>
        </div>
      )

    case 'business-card':
      return (
        <motion.div
          className="w-80 h-48 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-2 text-white relative overflow-hidden"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Decorative pattern */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />

          {/* Front side content */}
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-1 capitalize">{handle.replace(/-/g, ' ')}</h3>
            <p className="text-gray-300 text-sm mb-4">Professional Services</p>

            <div className="space-y-2 mt-6">
              <p className="text-sm text-gray-400">📞 (555) 123-4567</p>
              <p className="text-sm text-gray-400 break-all">📧 {handle}@email.com</p>
              <motion.p
                className="text-sm font-bold text-onprez-blue bg-white/10 px-3 py-1.5 rounded-lg inline-block break-all"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🌐 onprez.com/{handle}
              </motion.p>
            </div>
          </div>
        </motion.div>
      )

    case 'email':
      return (
        <div className="w-96 bg-white rounded-lg shadow-xl border border-gray-200">
          {/* Email header */}
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-6 rounded-full bg-gradient-to-br from-onprez-blue to-onprez-purple" />
              <div>
                <p className="text-sm font-semibold text-gray-900 capitalize">
                  {handle.replace(/-/g, ' ')}
                </p>
                <p className="text-xs text-gray-500 break-all">{handle}@email.com</p>
              </div>
            </div>
          </div>

          {/* Email body */}
          <div className="p-2">
            <p className="text-sm text-gray-700 mb-2">
              Hi there,
              <br />
              <br />
              Thank you for your inquiry! I&apos;d love to help you with your needs.
            </p>

            {/* Signature */}
            <div className="border-t border-gray-200 pt-4 mt-2">
              <p className="text-sm font-semibold text-gray-900">Best regards,</p>
              <p className="text-sm font-semibold text-gray-900 mb-2 capitalize">
                {handle.replace(/-/g, ' ')}
              </p>
              <p className="text-xs text-gray-600">Professional Services</p>
              <p className="text-xs text-gray-600 mb-2">Your Business Name</p>
              <motion.a
                className="text-sm font-bold text-onprez-blue hover:underline inline-block break-all"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                📎 onprez.com/{handle}
              </motion.a>
            </div>
          </div>
        </div>
      )

    case 'google':
      return (
        <div className="w-[500px] bg-white rounded-lg shadow-xl border border-gray-200">
          {/* Search bar */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3 bg-gray-100 rounded-full px-4 py-2">
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              <span className="text-sm text-gray-600 break-all">{handle.replace(/-/g, ' ')}</span>
            </div>
          </div>

          {/* Search result */}
          <div className="p-4">
            <motion.div
              className="mb-4 border-l-4 border-onprez-blue pl-3"
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <p className="text-xs text-gray-600 mb-1 break-all">onprez.com › {handle}</p>
              <h3 className="text-lg text-blue-600 font-medium mb-1 hover:underline cursor-pointer capitalize">
                {handle.replace(/-/g, ' ')} - Book Your Appointment
              </h3>
              <p className="text-sm text-gray-600 break-all">
                Professional services and booking. Visit onprez.com/{handle} to learn more and
                schedule your appointment online...
              </p>
            </motion.div>

            <div className="space-y-3 opacity-50">
              <div>
                <p className="text-xs text-gray-500">example.com</p>
                <h3 className="text-base text-gray-700">Another result...</h3>
              </div>
              <div>
                <p className="text-xs text-gray-500">sample.com</p>
                <h3 className="text-base text-gray-700">More results...</h3>
              </div>
            </div>
          </div>
        </div>
      )

    case 'speech':
      return (
        <div className="relative">
          {/* Speech bubble */}
          <motion.div
            className="bg-white rounded-2xl shadow-2xl p-6 border-2 border-gray-200 relative max-w-sm"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <p className="text-2xl font-bold text-gray-900 mb-2">&quot;Just visit&quot;</p>
            <p className="text-3xl font-bold text-onprez-blue break-all">onprez.com/{handle}</p>

            {/* Tail */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border-b-2 border-r-2 border-gray-200 transform rotate-45" />
          </motion.div>

          {/* Sound waves */}
          <div className="flex justify-center gap-1 mt-6">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-onprez-blue rounded-full"
                animate={{
                  height: ['20px', '40px', '20px'],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>
        </div>
      )

    default:
      return null
  }
}
