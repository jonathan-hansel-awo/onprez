/** @jest-environment node */

import { NextRequest } from 'next/server'

import { getCurrentUser } from '@/lib/auth/get-user'
import { sendPushTestNotification } from '@/lib/push/test-delivery'
import { POST } from '../route'

jest.mock('@/lib/auth/get-user', () => ({ getCurrentUser: jest.fn() }))
jest.mock('@/lib/push/test-delivery', () => ({ sendPushTestNotification: jest.fn() }))

const mockedUser = getCurrentUser as jest.Mock
const mockedSend = sendPushTestNotification as jest.Mock

function request(origin = 'https://onprez.test') {
  return new NextRequest('https://onprez.test/api/account/push-subscriptions/test', {
    method: 'POST',
    headers: { origin },
  })
}

describe('push notification test route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedUser.mockResolvedValue({ id: 'user-1' })
    mockedSend.mockResolvedValue({ total: 1, delivered: 1, failed: 0, expired: 0 })
  })

  it('rejects cross-origin attempts before authentication', async () => {
    const response = await POST(request('https://attacker.test'))

    expect(response.status).toBe(403)
    expect(mockedUser).not.toHaveBeenCalled()
    expect(mockedSend).not.toHaveBeenCalled()
  })

  it('requires an authenticated account', async () => {
    mockedUser.mockResolvedValue(null)

    const response = await POST(request())

    expect(response.status).toBe(401)
    expect(mockedSend).not.toHaveBeenCalled()
  })

  it('reports when no active browser subscription exists', async () => {
    mockedSend.mockResolvedValue({ total: 0, delivered: 0, failed: 0, expired: 0 })

    const response = await POST(request())
    const payload = await response.json()

    expect(response.status).toBe(409)
    expect(payload.message).toContain('no active push subscription')
  })

  it('reports provider delivery failure without claiming success', async () => {
    mockedSend.mockResolvedValue({ total: 1, delivered: 0, failed: 1, expired: 0 })

    const response = await POST(request())

    expect(response.status).toBe(502)
  })

  it('confirms a successful test delivery', async () => {
    const response = await POST(request())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(mockedSend).toHaveBeenCalledWith('user-1')
    expect(payload.message).toContain('1 device')
  })
})
