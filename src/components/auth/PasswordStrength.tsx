'use client'

import { calculatePasswordStrength, PasswordStrength as StrengthLevel } from '@/lib/auth/password'

interface PasswordStrengthProps {
  password: string
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null

  const strength = calculatePasswordStrength(password)

  const strengthConfig = {
    [StrengthLevel.WEAK]: {
      label: 'Weak',
      color: 'bg-red-500',
      width: 'w-1/4',
      textColor: 'text-red-600',
    },
    [StrengthLevel.FAIR]: {
      label: 'Fair',
      color: 'bg-orange-500',
      width: 'w-2/4',
      textColor: 'text-orange-600',
    },
    [StrengthLevel.GOOD]: {
      label: 'Good',
      color: 'bg-yellow-500',
      width: 'w-3/4',
      textColor: 'text-yellow-600',
    },
    [StrengthLevel.STRONG]: {
      label: 'Strong',
      color: 'bg-green-500',
      width: 'w-full',
      textColor: 'text-green-600',
    },
  }

  const config = strengthConfig[strength]

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">Password strength:</span>
        <span className={`text-xs font-medium ${config.textColor}`}>{config.label}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full transition-all duration-300 ${config.color} ${config.width}`} />
      </div>
    </div>
  )
}
