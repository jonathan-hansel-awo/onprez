import { EntitlementSource, FeatureKey, type FeatureEntitlement } from '@prisma/client'

import {
  canUseFeature,
  FeatureNotEntitledError,
  isFeatureEntitlementActive,
  requireFeatureEntitlement,
  setFeatureEntitlement,
} from '@/lib/features/entitlements'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    featureEntitlement: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}))

const mockedFeatureEntitlement = prisma.featureEntitlement as unknown as {
  findUnique: jest.Mock
  upsert: jest.Mock
}

const activeEntitlement: FeatureEntitlement = {
  id: 'entitlement-1',
  businessId: 'business-1',
  feature: FeatureKey.BOOKING_DEPOSITS,
  enabled: true,
  source: EntitlementSource.ALPHA,
  expiresAt: null,
  metadata: null,
  createdAt: new Date('2026-07-22T10:00:00.000Z'),
  updatedAt: new Date('2026-07-22T10:00:00.000Z'),
}

describe('feature entitlements', () => {
  beforeEach(() => {
    mockedFeatureEntitlement.findUnique.mockReset()
    mockedFeatureEntitlement.upsert.mockReset()
  })

  it('treats enabled non-expiring alpha access as active', () => {
    expect(isFeatureEntitlementActive(activeEntitlement)).toBe(true)
  })

  it('rejects disabled and expired entitlements', () => {
    const now = new Date('2026-07-22T12:00:00.000Z')

    expect(isFeatureEntitlementActive({ enabled: false, expiresAt: null }, now)).toBe(false)
    expect(
      isFeatureEntitlementActive(
        { enabled: true, expiresAt: new Date('2026-07-22T11:59:59.000Z') },
        now
      )
    ).toBe(false)
  })

  it('checks one business and feature through the composite key', async () => {
    mockedFeatureEntitlement.findUnique.mockResolvedValue(activeEntitlement)

    await expect(
      canUseFeature('business-1', FeatureKey.BOOKING_DEPOSITS)
    ).resolves.toBe(true)
    expect(mockedFeatureEntitlement.findUnique).toHaveBeenCalledWith({
      where: {
        businessId_feature: {
          businessId: 'business-1',
          feature: FeatureKey.BOOKING_DEPOSITS,
        },
      },
    })
  })

  it('throws a typed error when access is unavailable', async () => {
    mockedFeatureEntitlement.findUnique.mockResolvedValue(null)

    await expect(
      requireFeatureEntitlement('business-1', FeatureKey.BOOKING_DEPOSITS)
    ).rejects.toEqual(
      expect.objectContaining<Partial<FeatureNotEntitledError>>({
        code: 'FEATURE_NOT_ENTITLED',
        businessId: 'business-1',
        feature: FeatureKey.BOOKING_DEPOSITS,
      })
    )
  })

  it('upserts a manually managed alpha entitlement', async () => {
    mockedFeatureEntitlement.upsert.mockResolvedValue(activeEntitlement)

    await expect(
      setFeatureEntitlement({
        businessId: 'business-1',
        feature: FeatureKey.BOOKING_DEPOSITS,
        enabled: true,
        source: EntitlementSource.ALPHA,
      })
    ).resolves.toEqual(activeEntitlement)

    expect(mockedFeatureEntitlement.upsert).toHaveBeenCalledWith({
      where: {
        businessId_feature: {
          businessId: 'business-1',
          feature: FeatureKey.BOOKING_DEPOSITS,
        },
      },
      create: {
        businessId: 'business-1',
        feature: FeatureKey.BOOKING_DEPOSITS,
        enabled: true,
        source: EntitlementSource.ALPHA,
        expiresAt: null,
      },
      update: {
        enabled: true,
        source: EntitlementSource.ALPHA,
        expiresAt: null,
      },
    })
  })
})
