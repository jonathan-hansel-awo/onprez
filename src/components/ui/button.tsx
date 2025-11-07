'use client'

import { forwardRef, ReactNode, ComponentPropsWithRef } from 'react'
import { motion, MotionProps } from 'framer-motion'
// Update the path below to the correct relative path if needed
import { cn } from '@/lib/utils/cn'

type OverlappingMotionProps =
  | 'onAnimationStart'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onDrag'
  | 'onPointerDown'
  | 'onPointerUp'
  | 'onPointerCancel'
  | 'onPointerMove'
  | 'onPointerEnter'
  | 'onPointerLeave'
  | 'onPointerOver'
  | 'onPointerOut'

export interface ButtonProps
  extends Omit<ComponentPropsWithRef<'button'>, OverlappingMotionProps | 'style'>,
    MotionProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  style?: React.CSSProperties | MotionProps['style']
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles =
      'font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
      primary:
        'bg-gradient-to-r from-onprez-blue to-onprez-purple text-white shadow-lg hover:shadow-xl hover:scale-105 animate-glow-pulse',
      secondary:
        'bg-white text-onprez-blue border-2 border-onprez-blue hover:bg-onprez-blue hover:text-white',
      ghost: 'bg-transparent text-onprez-blue hover:bg-onprez-blue/10 border border-onprez-blue/20',
      destructive: 'bg-red-600 text-white hover:bg-red-700 border border-red-700 hover:scale-105',
    }

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    }

    return (
      <motion.button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {children}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
