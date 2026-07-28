/** @jest-environment node */

import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { DELETE } from '../route'

jest.mock('@/lib/auth/get-user', () => ({ getCurrentUser: jest.fn() }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    pushSubscription: { deleteMany: jest.fn() },
  },
}))

const mockedUser = getCurrentUser as jest.Mock
const mockedDeleteMany = prisma.pushSubscription.deleteMany as jest.Mock

function request(origin = 'https://onprez.test') {
  return new NextRequest('https://onprez.test/api/account/push-subscriptions/subscription-1', {
    method: 'DELETE',
    headers: { origin },
  })
}

describe('DELETE push subscription', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedUser.mockResolvedValue({ id: 'user-1' })
    mockedDeleteMany.mockResolvedValue({ count: 1 })
  })

  it('removes only a subscription belonging to the authenticated user', async () => {
    const response = await DELETE(request(), {
      params: Promise.resolve({ id: 'subscription-1' }),
    })

    expect(response.status).toBe(200)
    expect(mockedDeleteMany).toHaveBeenCalledWith({
      where: { id: 'subscription-1', userId: 'user-1' },
    })
  })

  it('returns not found instead of revealing another account subscription', async () => {
    mockedDeleteMany.mockResolvedValue({ count: 0 })

    const response = await DELETE(request(), {
      params: Promise.resolve({ id: 'subscription-1' }),
    })

    expect(response.status).toBe(404)
  })

  it('rejects cross-origin removal before authentication', async () => {
    const response = await DELETE(request('https://attacker.test'), {
      params: Promise.resolve({ id: 'subscription-1' }),
    })

    expect(response.status).toBe(403)
    expect(mockedUser).not.toHaveBeenCalled()
  })
})
