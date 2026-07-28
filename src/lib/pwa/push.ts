export function urlBase64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (value.length % 4)) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const decoded = window.atob(base64)
  const bytes = new Uint8Array(decoded.length)

  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index)
  }

  return bytes
}

export function getPushDeviceName(platform: 'ios' | 'android' | 'desktop'): string {
  if (platform === 'ios') return 'iPhone or iPad'
  if (platform === 'android') return 'Android device'

  const browserPlatform = navigator.platform?.trim()
  return browserPlatform ? `${browserPlatform} browser` : 'Desktop browser'
}
