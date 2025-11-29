'use client'

import { motion } from 'framer-motion'
import type { HTMLMotionProps } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect } from 'react'

interface LogoProps extends Omit<HTMLMotionProps<'a'>, 'children'> {
  href?: string
  className?: string
  variant?: 'gradient' | 'white'
}

export function Logo({ variant = 'gradient', className = '', ...props }: LogoProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const textClass =
    variant === 'white'
      ? 'text-white'
      : 'bg-gradient-to-r from-onprez-blue to-onprez-purple bg-clip-text text-transparent'

  // Prevent hydration mismatch by rendering consistent initial state
  if (!mounted) {
    return (
      <Link
        href="/"
        className={`text-2xl font-bold ${textClass} ${className}`}
        aria-label="OnPrez home"
      >
        OnPrez
      </Link>
    )
  }

  return (
    <motion.a
      href="/"
      className={`text-2xl font-bold ${textClass} ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label="OnPrez home"
      {...props}
    >
      OnPrez
    </motion.a>
  )
}

export function LogoSVG({
  className = '',
  variant = 'gradient',
}: {
  className?: string
  variant?: 'gradient' | 'white'
}) {
  return (
    <svg
      viewBox="0 0 200 60"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="OnPrez"
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill={variant === 'white' ? 'white' : 'url(#logo-gradient)'}
        fontSize="32"
        fontWeight="700"
        fontFamily="Inter, sans-serif"
      >
        OnPrez
      </text>
    </svg>
  )
}
