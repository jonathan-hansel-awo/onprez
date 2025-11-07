import {
  Shield,
  LogIn,
  LogOut,
  Lock,
  Unlock,
  Key,
  Mail,
  UserCheck,
  Smartphone,
  AlertTriangle,
  XCircle,
  CheckCircle,
  type LucideIcon,
} from 'lucide-react'

export interface ActivityLogConfig {
  icon: LucideIcon
  label: string
  description: string
  color: string
}

/**
 * Get configuration for activity log action
 */
export function getActivityConfig(action: string): ActivityLogConfig {
  const configs: Record<string, ActivityLogConfig> = {
    // Authentication
    login_success: {
      icon: LogIn,
      label: 'Successful Login',
      description: 'You signed in to your account',
      color: 'text-green-600 bg-green-100',
    },
    login_failed: {
      icon: XCircle,
      label: 'Failed Login Attempt',
      description: 'Someone tried to sign in with incorrect credentials',
      color: 'text-red-600 bg-red-100',
    },
    logout: {
      icon: LogOut,
      label: 'Logged Out',
      description: 'You signed out of your account',
      color: 'text-gray-600 bg-gray-100',
    },
    new_device_login: {
      icon: Smartphone,
      label: 'New Device Login',
      description: 'You signed in from a new device',
      color: 'text-blue-600 bg-blue-100',
    },

    // MFA
    mfa_setup_initiated: {
      icon: Shield,
      label: 'MFA Setup Started',
      description: 'You began setting up two-factor authentication',
      color: 'text-blue-600 bg-blue-100',
    },
    mfa_enabled: {
      icon: Shield,
      label: 'MFA Enabled',
      description: 'Two-factor authentication was enabled',
      color: 'text-green-600 bg-green-100',
    },
    mfa_disabled: {
      icon: Shield,
      label: 'MFA Disabled',
      description: 'Two-factor authentication was disabled',
      color: 'text-amber-600 bg-amber-100',
    },
    mfa_challenge_initiated: {
      icon: Key,
      label: 'MFA Challenge',
      description: 'Two-factor authentication code was requested',
      color: 'text-blue-600 bg-blue-100',
    },
    mfa_login_success: {
      icon: CheckCircle,
      label: 'MFA Login Success',
      description: 'You successfully verified your identity with MFA',
      color: 'text-green-600 bg-green-100',
    },
    mfa_login_failed: {
      icon: XCircle,
      label: 'MFA Login Failed',
      description: 'MFA verification failed',
      color: 'text-red-600 bg-red-100',
    },
    mfa_backup_code_used: {
      icon: Key,
      label: 'Backup Code Used',
      description: 'A backup code was used to sign in',
      color: 'text-amber-600 bg-amber-100',
    },
    mfa_backup_codes_regenerated: {
      icon: Key,
      label: 'Backup Codes Regenerated',
      description: 'New backup codes were generated',
      color: 'text-blue-600 bg-blue-100',
    },
    backup_codes_viewed: {
      icon: Key,
      label: 'Backup Codes Viewed',
      description: 'Backup codes status was viewed',
      color: 'text-gray-600 bg-gray-100',
    },

    // Password
    password_reset_requested: {
      icon: Lock,
      label: 'Password Reset Requested',
      description: 'A password reset was requested',
      color: 'text-amber-600 bg-amber-100',
    },
    password_reset_completed: {
      icon: Unlock,
      label: 'Password Reset Completed',
      description: 'Your password was successfully reset',
      color: 'text-green-600 bg-green-100',
    },
    password_changed: {
      icon: Lock,
      label: 'Password Changed',
      description: 'Your password was changed',
      color: 'text-blue-600 bg-blue-100',
    },

    // Email
    email_verification_sent: {
      icon: Mail,
      label: 'Verification Email Sent',
      description: 'A verification email was sent',
      color: 'text-blue-600 bg-blue-100',
    },
    email_verified: {
      icon: UserCheck,
      label: 'Email Verified',
      description: 'Your email address was verified',
      color: 'text-green-600 bg-green-100',
    },

    // Account
    account_locked: {
      icon: Lock,
      label: 'Account Locked',
      description: 'Your account was locked due to security concerns',
      color: 'text-red-600 bg-red-100',
    },
    account_unlocked: {
      icon: Unlock,
      label: 'Account Unlocked',
      description: 'Your account was unlocked',
      color: 'text-green-600 bg-green-100',
    },

    // Sessions & Devices
    session_terminated: {
      icon: LogOut,
      label: 'Session Terminated',
      description: 'A session was terminated',
      color: 'text-gray-600 bg-gray-100',
    },
    all_sessions_terminated: {
      icon: LogOut,
      label: 'All Sessions Terminated',
      description: 'All sessions were terminated',
      color: 'text-amber-600 bg-amber-100',
    },
    trusted_device_added: {
      icon: Smartphone,
      label: 'Trusted Device Added',
      description: 'A device was marked as trusted',
      color: 'text-green-600 bg-green-100',
    },
    trusted_device_removed: {
      icon: Smartphone,
      label: 'Trusted Device Removed',
      description: 'A trusted device was removed',
      color: 'text-amber-600 bg-amber-100',
    },
  }

  return (
    configs[action] || {
      icon: AlertTriangle,
      label: action,
      description: 'Security event',
      color: 'text-gray-600 bg-gray-100',
    }
  )
}

/**
 * Get severity badge color
 */
export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    info: 'bg-blue-100 text-blue-700 border-blue-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    error: 'bg-red-100 text-red-700 border-red-200',
    critical: 'bg-red-200 text-red-900 border-red-300',
  }
  return colors[severity] || colors.info
}

/**
 * Format log details for display
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatLogDetails(details: any): string {
  if (!details) return ''

  try {
    const parsed = typeof details === 'string' ? JSON.parse(details) : details

    // Remove sensitive data
    const { password, token, secret, ...safeDetails } = parsed

    return Object.entries(safeDetails)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ')
  } catch {
    return ''
  }
}
