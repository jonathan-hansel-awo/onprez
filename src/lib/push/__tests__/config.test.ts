/** @jest-environment node */

import {
  getPublicVapidKey,
  getPushConfigurationStatus,
  getVapidDetails,
  isPushConfigured,
} from '@/lib/push/config'

const originalEnvironment = { ...process.env }

describe('Web Push server configuration', () => {
  beforeEach(() => {
    process.env = { ...originalEnvironment }
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    delete process.env.VAPID_PRIVATE_KEY
    delete process.env.VAPID_SUBJECT
  })

  afterAll(() => {
    process.env = originalEnvironment
  })

  it('stays optional until all valid VAPID values are configured', () => {
    expect(getPushConfigurationStatus()).toEqual({
      publicKeyConfigured: false,
      privateKeyConfigured: false,
      subjectConfigured: false,
    })
    expect(isPushConfigured()).toBe(false)
    expect(getPublicVapidKey()).toBeNull()
    expect(() => getVapidDetails()).toThrow('Web Push is not configured')
  })

  it('accepts a complete reusable VAPID configuration', () => {
    const publicKey = Buffer.alloc(65, 1).toString('base64url')
    const privateKey = Buffer.alloc(32, 2).toString('base64url')
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = publicKey
    process.env.VAPID_PRIVATE_KEY = privateKey
    process.env.VAPID_SUBJECT = 'mailto:support@onprez.com'

    expect(isPushConfigured()).toBe(true)
    expect(getPublicVapidKey()).toBe(publicKey)
    expect(getVapidDetails()).toEqual({
      publicKey,
      privateKey,
      subject: 'mailto:support@onprez.com',
    })
  })

  it('rejects malformed subjects and base64url keys', () => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'not a key'
    process.env.VAPID_PRIVATE_KEY = Buffer.alloc(32, 2).toString('base64url')
    process.env.VAPID_SUBJECT = 'http://onprez.test'

    expect(getPushConfigurationStatus()).toEqual({
      publicKeyConfigured: false,
      privateKeyConfigured: true,
      subjectConfigured: false,
    })
    expect(isPushConfigured()).toBe(false)
  })
})
