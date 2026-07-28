export type InstallPlatform = 'ios' | 'android' | 'desktop'

interface InstallEnvironment {
  userAgent: string
  platform?: string
  maxTouchPoints?: number
}

export function detectInstallPlatform({
  userAgent,
  platform = '',
  maxTouchPoints = 0,
}: InstallEnvironment): InstallPlatform {
  const isIOSDevice =
    /iPad|iPhone|iPod/i.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)

  if (isIOSDevice) return 'ios'
  if (/Android/i.test(userAgent)) return 'android'

  return 'desktop'
}

export function isStandaloneDisplay(
  displayModeStandalone: boolean,
  navigatorStandalone = false
): boolean {
  return displayModeStandalone || navigatorStandalone
}
