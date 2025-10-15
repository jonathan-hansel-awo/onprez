'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

export interface Avatar {
  src: string
  alt: string
  name?: string
}

export interface AvatarStackProps extends HTMLAttributes<HTMLDivElement> {
  avatars: Avatar[]
  max?: number
  size?: 'sm' | 'md' | 'lg'
}

const AvatarStack = forwardRef<HTMLDivElement, AvatarStackProps>(
  ({ className, avatars, max = 5, size = 'md', ...props }, ref) => {
    const displayAvatars = avatars.slice(0, max)
    const remaining = Math.max(0, avatars.length - max)

    // Only pass motion.div-compatible props
    // Remove known incompatible props like onDrag, onDragStart, onDragEnd, etc.
    const {
      style,
      id,
      tabIndex,
      role,
      // Remove all event handlers and props not supported by motion.div
      onAnimationStart,
      onAnimationEnd,
      onDrag,
      onDragStart,
      onDragEnd,
      onDragEnter,
      onDragLeave,
      onDragOver,
      onDrop,
      onTransitionEnd,
      ...motionProps
    } = props

    const sizes = {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
    }

    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.08,
          delayChildren: 0.2,
        },
      },
    }

    const avatarVariants = {
      hidden: { scale: 0, opacity: 0 },
      visible: {
        scale: 1,
        opacity: 1,
        transition: {
          type: 'spring',
          stiffness: 260,
          damping: 20,
        },
      },
    }

    return (
      <motion.div
        ref={ref}
        className={cn('flex items-center -space-x-2', className)}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={style}
        id={id}
        tabIndex={tabIndex}
        role={role}
        {...motionProps}
      >
        {displayAvatars.map((avatar, index) => (
          <motion.div
            key={index}
            variants={avatarVariants}
            className="relative"
            whileHover={{ scale: 1.1, zIndex: 10 }}
          >
            <img
              src={avatar.src}
              alt={avatar.alt}
              className={cn(
                sizes[size],
                'rounded-full border-2 border-white object-cover shadow-md'
              )}
              title={avatar.name}
            />
          </motion.div>
        ))}

        {remaining > 0 && (
          <motion.div
            variants={avatarVariants}
            className={cn(
              sizes[size],
              'rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600 shadow-md'
            )}
          >
            +{remaining}
          </motion.div>
        )}
      </motion.div>
    )
  }
)

AvatarStack.displayName = 'AvatarStack'

export { AvatarStack }
