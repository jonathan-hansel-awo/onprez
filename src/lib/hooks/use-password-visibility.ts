import { useState, useEffect, useCallback } from 'react'

export function usePasswordVisibility(timeout: number = 3000) {
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (!showPassword) return

    const timer = setTimeout(() => {
      setShowPassword(false)
    }, timeout)

    return () => clearTimeout(timer)
  }, [showPassword, timeout])

  const toggleVisibility = useCallback(() => {
    setShowPassword(prev => !prev)
  }, [])

  return { showPassword, toggleVisibility, setShowPassword }
}
