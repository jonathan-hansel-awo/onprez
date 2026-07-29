import {
  getPushDeviceName,
  pushSubscriptionUsesVapidKey,
  urlBase64ToUint8Array,
} from '../push'

describe('Web Push browser helpers', () => {
  it('converts URL-safe VAPID keys to bytes', () => {
    expect(Array.from(urlBase64ToUint8Array('SGVsbG8'))).toEqual([72, 101, 108, 108, 111])
  })

  it('detects whether a browser subscription uses the current VAPID public key', () => {
    const publicKey = 'SGVsbG8'
    const expected = urlBase64ToUint8Array(publicKey)
    const matchingSubscription = {
      options: { applicationServerKey: expected.buffer },
    } as Pick<PushSubscription, 'options'>
    const staleSubscription = {
      options: { applicationServerKey: new Uint8Array([1, 2, 3]).buffer },
    } as Pick<PushSubscription, 'options'>

    expect(pushSubscriptionUsesVapidKey(matchingSubscription, publicKey)).toBe(true)
    expect(pushSubscriptionUsesVapidKey(staleSubscription, publicKey)).toBe(false)
  })

  it('uses clear device labels without exposing a full user agent', () => {
    expect(getPushDeviceName('ios')).toBe('iPhone or iPad')
    expect(getPushDeviceName('android')).toBe('Android device')
    expect(getPushDeviceName('desktop')).toContain('browser')
  })
})
