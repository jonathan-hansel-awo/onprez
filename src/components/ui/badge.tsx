'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

import { ComponentPropsWithoutRef } from 'react'

export interface BadgeProps extends ComponentPropsWithoutRef<typeof motion.div> {
  variant?:
    | 'default'
    | 'success'
    | 'warning'
    | 'error'
    | 'purple'
    | 'destructive'
    | 'primary'
    | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const variants = {
      default: 'bg-onprez-blue/10 text-onprez-blue border-onprez-blue/20',
      secondary: 'bg-onprez-blue/10 text-onprez-blue border-onprez-blue/20',
      success: 'bg-onprez-green/10 text-onprez-green border-onprez-green/20',
      warning: 'bg-amber-100 text-amber-700 border-amber-200',
      error: 'bg-red-100 text-red-700 border-red-200',
      destructive: 'bg-red-100 text-red-700 border-red-200',
      purple: 'bg-onprez-purple/10 text-onprez-purple border-onprez-purple/20',
      primary: 'bg-onprez-purple/10 text-onprez-purple border-onprez-purple/20',
    }

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
      lg: 'px-4 py-1.5 text-base',
    }

    return (
      <motion.div
        ref={ref}
        className={cn(
          'inline-flex items-center font-semibold rounded-full border',
          variants[variant],
          sizes[size],
          className
        )}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }
