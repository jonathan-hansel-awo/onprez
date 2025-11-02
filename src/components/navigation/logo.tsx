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
