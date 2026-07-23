/** @jest-environment node */

import { ServiceDepositMode, StripeConnectedAccountStatus } from '@prisma/client'
import { NextRequest } from 'next/server'

import { getCurrentUser } from '@/lib/auth/get-user'
import { resolveWritableBusinessContext } from '@/lib/auth/business-route-utils'
import {
  getFeatureEntitlement,
  isFeatureEntitlementActive,
  requireFeatureEntitlement,
} from '@/lib/features/entitlements'
import { prisma } from '@/lib/prisma'
import { GET, PUT } from '../route'

jest.mock('@/lib/auth/get-user', () => ({ getCurrentUser: jest.fn() }))
jest.mock('@/lib/auth/business-access', () => ({ businessAuthErrorResponse: jest.fn() }))
jest.mock('@/lib/auth/business-route-utils', () => ({
  resolveWritableBusinessContext: jest.fn(),
}))
jest.mock('@/lib/features/entitlements', () => ({
  getFeatureEntitlement: jest.fn(),
  isFeatureEntitlementActive: jest.fn(),
  requireFeatureEntitlement: jest.fn(),
}))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    business: { findUnique: jest.fn(), update: jest.fn() },
    stripeConnectedAccount: { findUnique: jest.fn() },
    service: { findMany: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(),
  },
}))

const mockedUser = getCurrentUser as jest.Mock
const mockedContext = resolveWritableBusinessContext as jest.Mock
const mockedGetEntitlement = getFeatureEntitlement as jest.Mock
const mockedActive = isFeatureEntitlementActive as jest.Mock
const mockedRequireEntitlement = requireFeatureEntitlement as jest.Mock
const mockedBusinessFind = prisma.business.findUnique as jest.Mock
const mockedAccountFind = prisma.stripeConnectedAccount.findUnique as jest.Mock
const mockedServiceFind = prisma.service.findMany as jest.Mock
const mockedServiceUpdate = prisma.service.update as jest.Mock
const mockedBusinessUpdate = prisma.business.update as jest.Mock
const mockedTransaction = prisma.$transaction as jest.Mock

function getRequest() {
  return new NextRequest('https://onprez.test/api/business/payments/booking-protection')
}

function putRequest(body: unknown, origin = 'https://onprez.test') {
  return new NextRequest('https://onprez.test/api/business/payments/booking-protection', {
    method: 'PUT',
    headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify(body),
  })
}

const readyAccount = {
  status: StripeConnectedAccountStatus.READY,
  chargesEnabled: true,
  payoutsEnabled: true,
}

describe('Booking Protection settings API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedUser.mockResolvedValue({ id: 'user-1' })
    mockedContext.mockResolvedValue({
      businessId: 'business-1',
      business: { id: 'business-1', name: 'Studio', slug: 'studio' },
      isOwner: true,
      role: 'OWNER',
    })
    mockedGetEntitlement.mockResolvedValue({ enabled: true, expiresAt: null, source: 'ALPHA' })
    mockedActive.mockReturnValue(true)
    mockedRequireEntitlement.mockResolvedValue({ enabled: true })
    mockedAccountFind.mockResolvedValue(readyAccount)
    mockedBusinessFind.mockResolvedValue({
      id: 'business-1',
      name: 'Studio',
      settings: {},
      services: [
        {
          id: 'service-1',
          name: 'Soft Glam',
          price: 60,
          priceType: 'FIXED',
          depositMode: ServiceDepositMode.BUSINESS_DEFAULT,
          depositAmount: null,
        },
      ],
    })
    mockedServiceFind.mockResolvedValue([{ id: 'service-1', price: 60 }])
    mockedServiceUpdate.mockReturnValue({ serviceUpdate: true })
    mockedBusinessUpdate.mockReturnValue({ businessUpdate: true })
    mockedTransaction.mockResolvedValue([])
  })

  it('returns effective per-service deposit previews', async () => {
    mockedBusinessFind.mockResolvedValue({
      id: 'business-1',
      name: 'Studio',
      settings: { bookingProtection: { enabled: true, depositAmount: 10 } },
      services: [
        {
          id: 'service-1',
          name: 'Soft Glam',
          price: 60,
          priceType: 'FIXED',
          depositMode: ServiceDepositMode.BUSINESS_DEFAULT,
          depositAmount: null,
        },
      ],
    })

    const response = await GET(getRequest())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.data.services[0].effective).toMatchObject({
      requiresDeposit: true,
      depositAmount: 10,
      remainingAmount: 50,
    })
  })

  it('rejects cross-origin updates', async () => {
    const response = await PUT(putRequest({}, 'https://attacker.test'))
    expect(response.status).toBe(403)
    expect(mockedUser).not.toHaveBeenCalled()
  })

  it('requires a fully ready Stripe account before saving', async () => {
    mockedAccountFind.mockResolvedValue({ ...readyAccount, payoutsEnabled: false })

    const response = await PUT(
      putRequest({
        businessId: 'business-1',
        defaults: { enabled: true, depositAmount: 10, cancellationWindowHours: 24 },
        services: [
          {
            serviceId: 'service-1',
            mode: ServiceDepositMode.BUSINESS_DEFAULT,
            customDepositAmount: null,
          },
        ],
      })
    )

    expect(response.status).toBe(409)
    expect(mockedTransaction).not.toHaveBeenCalled()
  })

  it('rejects a custom deposit above the service price', async () => {
    const response = await PUT(
      putRequest({
        businessId: 'business-1',
        defaults: { enabled: true, depositAmount: 10, cancellationWindowHours: 24 },
        services: [
          {
            serviceId: 'service-1',
            mode: ServiceDepositMode.CUSTOM,
            customDepositAmount: 70,
          },
        ],
      })
    )

    expect(response.status).toBe(400)
    expect(mockedTransaction).not.toHaveBeenCalled()
  })

  it('rejects a business default above an inherited service price', async () => {
    mockedServiceFind.mockResolvedValue([{ id: 'service-1', price: 8 }])

    const response = await PUT(
      putRequest({
        businessId: 'business-1',
        defaults: { enabled: true, depositAmount: 10, cancellationWindowHours: 24 },
        services: [
          {
            serviceId: 'service-1',
            mode: ServiceDepositMode.BUSINESS_DEFAULT,
            customDepositAmount: null,
          },
        ],
      })
    )

    expect(response.status).toBe(400)
    expect(mockedTransaction).not.toHaveBeenCalled()
  })

  it('persists business defaults and service overrides atomically', async () => {
    const response = await PUT(
      putRequest({
        businessId: 'business-1',
        defaults: { enabled: true, depositAmount: 10, cancellationWindowHours: 24 },
        services: [
          {
            serviceId: 'service-1',
            mode: ServiceDepositMode.CUSTOM,
            customDepositAmount: 15,
          },
        ],
      })
    )

    expect(response.status).toBe(200)
    expect(mockedRequireEntitlement).toHaveBeenCalled()
    expect(mockedServiceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'service-1' },
        data: expect.objectContaining({
          depositMode: ServiceDepositMode.CUSTOM,
          requiresDeposit: true,
          depositAmount: 15,
        }),
      })
    )
    expect(mockedTransaction).toHaveBeenCalled()
  })
})
