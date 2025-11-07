interface ParsedDevice {
  browser: string
  os: string
  device: string
  icon: 'desktop' | 'mobile' | 'tablet'
}

/**
 * Parse user agent string to extract device information
 */
export function parseUserAgent(userAgent: string): ParsedDevice {
  const ua = userAgent.toLowerCase()

  // Detect browser
  let browser = 'Unknown Browser'
  if (ua.includes('chrome') && !ua.includes('edg')) {
    browser = 'Chrome'
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari'
  } else if (ua.includes('firefox')) {
    browser = 'Firefox'
  } else if (ua.includes('edg')) {
    browser = 'Edge'
  } else if (ua.includes('opera') || ua.includes('opr')) {
    browser = 'Opera'
  }

  // Detect OS
  let os = 'Unknown OS'
  if (ua.includes('windows')) {
    os = 'Windows'
  } else if (ua.includes('mac os')) {
    os = 'macOS'
  } else if (ua.includes('linux')) {
    os = 'Linux'
  } else if (ua.includes('android')) {
    os = 'Android'
  } else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS'
  }

  // Detect device type
  let device = 'Desktop'
  let icon: 'desktop' | 'mobile' | 'tablet' = 'desktop'

  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    device = 'Mobile'
    icon = 'mobile'
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    device = 'Tablet'
    icon = 'tablet'
  }

  return { browser, os, device, icon }
}

/**
 * Get device display name
 */
export function getDeviceDisplayName(userAgent: string): string {
  const { browser, os } = parseUserAgent(userAgent)
  return `${browser} on ${os}`
}

/**
 * Parse device info JSON
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseDeviceInfo(deviceInfo: any): {
  browser?: string
  os?: string
  platform?: string
} {
  try {
    if (typeof deviceInfo === 'string') {
      return JSON.parse(deviceInfo)
    }
    return deviceInfo || {}
  } catch {
    return {}
  }
}
