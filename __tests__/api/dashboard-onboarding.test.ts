/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET, PATCH } from '@/app/api/dashboard/onboarding/route'
import { getCurrentUser } from '@/lib/auth/get-user'
import {
  resolveReadableBusinessContext,
  resolveWritableBusinessContext,
} from '@/lib/auth/business-route-utils'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/auth/get-user', () => ({ getCurrentUser: jest.fn() }))
jest.mock('@/lib/auth/business-route-utils', () => ({
  resolveReadableBusinessContext: jest.fn(),
  resolveWritableBusinessContext: jest.fn(),
}))
jest.mock('@/lib/auth/business-access', () => ({
  businessAuthErrorResponse: jest.fn(() => undefined),
}))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    business: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

const mockedGetCurrentUser = getCurrentUser as jest.Mock
const mockedResolveReadableBusinessContext = resolveReadableBusinessContext as jest.Mock
const mockedResolveWritableBusinessContext = resolveWritableBusinessContext as jest.Mock
const mockedBusiness = prisma.business as unknown as {
  findUnique: jest.Mock
  update: jest.Mock
}

const user = { id: 'user-1', email: 'owner@example.com' }
const context = { businessId: 'business-1', role: 'OWNER', isOwner: true }
const progressBusiness = {
  name: 'Crown Studio',
  slug: 'crown-studio',
  description: null,
  tagline: null,
  isPublished: false,
  settings: {},
  services: [],
  businessHours: [],
  pages: [],
}

function request(method = 'GET', body?: unknown) {
  return new NextRequest('http://localhost:3000/api/dashboard/onboarding', {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

describe('dashboard onboarding API', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockedGetCurrentUser.mockResolvedValue(user)
    mockedResolveReadableBusinessContext.mockResolvedValue(context)
    mockedResolveWritableBusinessContext.mockResolvedValue(context)
  })

  it('returns unauthorized before resolving a business', async () => {
    mockedGetCurrentUser.mockResolvedValue(null)

    const response = await GET(request())

    expect(response.status).toBe(401)
    expect(mockedResolveReadableBusinessContext).not.toHaveBeenCalled()
  })

  it('derives the next best action from the selected tenant', async () => {
    mockedBusiness.findUnique.mockResolvedValue(progressBusiness)

    const response = await GET(request())
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(mockedResolveReadableBusinessContext).toHaveBeenCalledWith(
      'user-1',
      expect.any(NextRequest)
    )
    expect(mockedBusiness.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'business-1' } })
    )
    expect(result.data.onboarding.nextTask.id).toBe('business-profile')
  })

  it('persists an optional skip without replacing other business settings', async () => {
    mockedBusiness.findUnique
      .mockResolvedValueOnce({
        id: 'business-1',
        settings: { emailNotifications: true },
      })
      .mockResolvedValueOnce({
        ...progressBusiness,
        settings: {
          emailNotifications: true,
          onboarding: { skippedTasks: ['preview'] },
        },
      })
    mockedBusiness.update.mockResolvedValue({ id: 'business-1' })

    const response = await PATCH(request('PATCH', { taskId: 'preview', action: 'skip' }))

    expect(response.status).toBe(200)
    expect(mockedResolveWritableBusinessContext).toHaveBeenCalledWith(
      'user-1',
      expect.any(NextRequest)
    )
    expect(mockedBusiness.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'business-1' },
        data: {
          settings: expect.objectContaining({
            emailNotifications: true,
            onboarding: expect.objectContaining({ skippedTasks: ['preview'] }),
          }),
        },
      })
    )
  })

  it('rejects attempts to mutate required checklist tasks', async () => {
    const response = await PATCH(request('PATCH', { taskId: 'business-profile', action: 'skip' }))

    expect(response.status).toBe(400)
    expect(mockedBusiness.update).not.toHaveBeenCalled()
  })
})
