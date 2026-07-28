import { getPushDeviceName, urlBase64ToUint8Array } from '../push'

describe('Web Push browser helpers', () => {
  it('converts URL-safe VAPID keys to bytes', () => {
    expect(Array.from(urlBase64ToUint8Array('SGVsbG8'))).toEqual([72, 101, 108, 108, 111])
  })

  it('uses clear device labels without exposing a full user agent', () => {
    expect(getPushDeviceName('ios')).toBe('iPhone or iPad')
    expect(getPushDeviceName('android')).toBe('Android device')
    expect(getPushDeviceName('desktop')).toContain('browser')
  })
})
