'use client'

import { motion } from 'framer-motion'
import { Activity } from '@/data/activities'
import { cn } from '@/lib/utils/cn'

interface ActivityCardProps {
  activity: Activity
  isPaused?: boolean
}

export function ActivityCard({ activity, isPaused }: ActivityCardProps) {
  const getTypeColor = (type: Activity['type']) => {
    switch (type) {
      case 'handle_claimed':
        return 'from-onprez-blue/10 to-onprez-blue/5 border-onprez-blue/20'
      case 'booking_received':
        return 'from-onprez-green/10 to-onprez-green/5 border-onprez-green/20'
      case 'upgrade':
        return 'from-onprez-purple/10 to-onprez-purple/5 border-onprez-purple/20'
      case 'milestone':
        return 'from-amber-100/50 to-amber-50/50 border-amber-200/50'
      default:
        return 'from-gray-100 to-gray-50 border-gray-200'
    }
  }

  return (
    <motion.div
      className={cn(
        'relative flex items-center gap-3 px-4 py-3 rounded-xl border bg-gradient-to-br backdrop-blur-sm shadow-sm min-w-[320px]',
        getTypeColor(activity.type)
      )}
      whileHover={{
        scale: 1.05,
        y: -4,
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
      }}
      transition={{ duration: 0.2 }}
    >
      {/* Avatar */}
      <motion.div
        className="relative flex-shrink-0"
        animate={
          !isPaused
            ? {
                scale: [1, 1.05, 1],
              }
            : {}
        }
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <img
          src={activity.user.avatar}
          alt={activity.user.name}
          className="w-10 h-10 rounded-full border-2 border-white shadow-md"
        />

        {/* Icon Badge */}
        <motion.div
          className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center text-xs shadow-md"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 15,
            delay: 0.1,
          }}
        >
          {activity.icon}
        </motion.div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 font-medium truncate">{activity.user.name}</p>
        <p className="text-xs text-gray-600 truncate">{activity.action}</p>
      </div>

      {/* Timestamp */}
      <div className="flex-shrink-0 text-xs text-gray-400">{activity.timestamp}</div>

      {/* Hover Glow Effect */}
      <motion.div
        className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0"
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  )
}
