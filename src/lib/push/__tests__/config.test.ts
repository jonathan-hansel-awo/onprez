/** @jest-environment node */

import { createECDH } from 'crypto'
import {
  getPublicVapidKey,
  getPushConfigurationStatus,
  getVapidDetails,
  isPushConfigured,
} from '@/lib/push/config'

const originalEnvironment = { ...process.env }

function generateVapidPair() {
  const ecdh = createECDH('prime256v1')
  ecdh.generateKeys()

  return {
    publicKey: ecdh.getPublicKey(undefined, 'uncompressed').toString('base64url'),
    privateKey: ecdh.getPrivateKey().toString('base64url'),
  }
}

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
      keyPairMatches: false,
    })
    expect(isPushConfigured()).toBe(false)
    expect(getPublicVapidKey()).toBeNull()
    expect(() => getVapidDetails()).toThrow('Web Push is not configured')
  })

  it('accepts a complete reusable VAPID configuration', () => {
    const { publicKey, privateKey } = generateVapidPair()
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = publicKey
    process.env.VAPID_PRIVATE_KEY = privateKey
    process.env.VAPID_SUBJECT = 'mailto:support@onprez.com'

    expect(getPushConfigurationStatus()).toEqual({
      publicKeyConfigured: true,
      privateKeyConfigured: true,
      subjectConfigured: true,
      keyPairMatches: true,
    })
    expect(isPushConfigured()).toBe(true)
    expect(getPublicVapidKey()).toBe(publicKey)
    expect(getVapidDetails()).toEqual({
      publicKey,
      privateKey,
      subject: 'mailto:support@onprez.com',
    })
  })

  it('rejects public and private VAPID keys from different pairs', () => {
    const first = generateVapidPair()
    const second = generateVapidPair()
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = first.publicKey
    process.env.VAPID_PRIVATE_KEY = second.privateKey
    process.env.VAPID_SUBJECT = 'mailto:support@onprez.com'

    expect(getPushConfigurationStatus()).toEqual({
      publicKeyConfigured: true,
      privateKeyConfigured: true,
      subjectConfigured: true,
      keyPairMatches: false,
    })
    expect(isPushConfigured()).toBe(false)
    expect(getPublicVapidKey()).toBeNull()
  })

  it('rejects malformed subjects and base64url keys', () => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'not a key'
    process.env.VAPID_PRIVATE_KEY = Buffer.alloc(32, 2).toString('base64url')
    process.env.VAPID_SUBJECT = 'http://onprez.test'

    expect(getPushConfigurationStatus()).toEqual({
      publicKeyConfigured: false,
      privateKeyConfigured: true,
      subjectConfigured: false,
      keyPairMatches: false,
    })
    expect(isPushConfigured()).toBe(false)
  })
})
