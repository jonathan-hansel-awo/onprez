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

export function pushSubscriptionUsesVapidKey(
  subscription: Pick<PushSubscription, 'options'>,
  vapidPublicKey: string
): boolean {
  const applicationServerKey = subscription.options.applicationServerKey
  if (!applicationServerKey) return false

  const actual = new Uint8Array(applicationServerKey)
  const expected = urlBase64ToUint8Array(vapidPublicKey)

  if (actual.length !== expected.length) return false
  return actual.every((byte, index) => byte === expected[index])
}

export function getPushDeviceName(platform: 'ios' | 'android' | 'desktop'): string {
  if (platform === 'ios') return 'iPhone or iPad'
  if (platform === 'android') return 'Android device'

  const browserPlatform = navigator.platform?.trim()
  return browserPlatform ? `${browserPlatform} browser` : 'Desktop browser'
}
