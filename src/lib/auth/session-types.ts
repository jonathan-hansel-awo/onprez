/**
 * Device information for session tracking
 */
export interface DeviceInfo {
  browser?: string
  browserVersion?: string
  os?: string
  osVersion?: string
  deviceType?: 'desktop' | 'mobile' | 'tablet'
  deviceName?: string
}

/**
 * Session data structure
 */
export interface SessionData {
  id: string
  userId: string
  token: string
  refreshToken: string
  deviceInfo?: DeviceInfo
  ipAddress?: string
  userAgent?: string
  lastActivity: Date
  expiresAt: Date
  createdAt: Date
}

/**
 * Create session parameters
 */
export interface CreateSessionParams {
  userId: string
  email: string
  businessId?: string
  deviceInfo?: DeviceInfo
  ipAddress?: string
  userAgent?: string
  rememberMe?: boolean
}

/**
 * Session validation result
 */
export interface SessionValidation {
  valid: boolean
  session?: SessionData
  reason?: 'expired' | 'not_found' | 'invalid_token'
}

/**
 * Session list item for display
 */
export interface SessionListItem {
  id: string
  deviceInfo?: DeviceInfo
  ipAddress?: string
  lastActivity: Date
  createdAt: Date
  isCurrent: boolean
}
