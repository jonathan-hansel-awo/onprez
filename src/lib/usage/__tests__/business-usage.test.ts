import { getPlatformUsageReport } from '@/lib/usage/business-usage'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    business: { findMany: jest.fn() },
    page: { groupBy: jest.fn() },
    service: { groupBy: jest.fn() },
    appointment: { groupBy: jest.fn() },
    mediaAsset: { groupBy: jest.fn() },
    businessMember: { groupBy: jest.fn() },
    emailDelivery: { groupBy: jest.fn() },
    providerCostRate: { findMany: jest.fn() },
  },
}))

const mockedPrisma = prisma as unknown as {
  business: { findMany: jest.Mock }
  page: { groupBy: jest.Mock }
  service: { groupBy: jest.Mock }
  appointment: { groupBy: jest.Mock }
  mediaAsset: { groupBy: jest.Mock }
  businessMember: { groupBy: jest.Mock }
  emailDelivery: { groupBy: jest.Mock }
  providerCostRate: { findMany: jest.Mock }
}

const decimal = (value: string) => ({ toString: () => value })

describe('canonical platform usage report', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockedPrisma.business.findMany.mockResolvedValue([
      {
        id: 'business-free',
        name: 'Free Studio',
        slug: 'free-studio',
        planTier: 'FREE',
        isActive: true,
      },
      {
        id: 'business-pro',
        name: 'Professional Studio',
        slug: 'professional-studio',
        planTier: 'PROFESSIONAL',
        isActive: false,
      },
    ])
    mockedPrisma.page.groupBy.mockResolvedValue([
      { businessId: 'business-free', _count: { _all: 1 } },
    ])
    mockedPrisma.service.groupBy.mockResolvedValue([
      { businessId: 'business-free', _count: { _all: 4 } },
      { businessId: 'business-pro', _count: { _all: 19 } },
    ])
    mockedPrisma.appointment.groupBy.mockResolvedValue([
      { businessId: 'business-free', _count: { _all: 7 } },
      { businessId: 'business-pro', _count: { _all: 95 } },
    ])
    mockedPrisma.mediaAsset.groupBy.mockResolvedValue([
      {
        businessId: 'business-free',
        _count: { _all: 5 },
        _sum: { bytes: BigInt(1_073_741_824) },
      },
      {
        businessId: 'business-pro',
        _count: { _all: 21 },
        _sum: { bytes: BigInt(536_870_912) },
      },
    ])
    mockedPrisma.businessMember.groupBy.mockResolvedValue([
      { businessId: 'business-pro', _count: { _all: 2 } },
    ])
    mockedPrisma.emailDelivery.groupBy.mockResolvedValue([
      { businessId: 'business-free', _count: { _all: 10 } },
      { businessId: 'business-pro', _count: { _all: 20 } },
    ])
    mockedPrisma.providerCostRate.findMany.mockResolvedValue([
      {
        provider: 'CLOUDINARY',
        metric: 'MEDIA_STORAGE',
        unit: 'GIB_MONTH',
        rate: decimal('0.4224'),
        currency: 'GBP',
        source: 'Planning snapshot',
        effectiveFrom: new Date('2026-07-26T00:00:00.000Z'),
      },
      {
        provider: 'RESEND',
        metric: 'EMAIL_SEND',
        unit: 'EMAIL',
        rate: decimal('0.000384'),
        currency: 'GBP',
        source: 'Planning snapshot',
        effectiveFrom: new Date('2026-07-26T00:00:00.000Z'),
      },
    ])
  })

  it('derives attributable account usage and estimates without mutable counters', async () => {
    const report = await getPlatformUsageReport(new Date('2026-08-15T12:00:00.000Z'))

    expect(report.period).toEqual({
      start: '2026-08-01T00:00:00.000Z',
      endExclusive: '2026-09-01T00:00:00.000Z',
      timezone: 'UTC',
    })
    expect(mockedPrisma.appointment.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          createdAt: {
            gte: new Date('2026-08-01T00:00:00.000Z'),
            lt: new Date('2026-09-01T00:00:00.000Z'),
          },
        },
      })
    )
    expect(mockedPrisma.emailDelivery.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          sentAt: {
            gte: new Date('2026-08-01T00:00:00.000Z'),
            lt: new Date('2026-09-01T00:00:00.000Z'),
          },
        },
      })
    )

    expect(report.businesses[0]).toEqual(
      expect.objectContaining({
        businessId: 'business-free',
        highestWarning: 'exceeded',
        usage: expect.objectContaining({
          publishedPages: 1,
          activeServices: 4,
          monthlyBookings: 7,
          mediaItems: 5,
          mediaBytes: 1_073_741_824,
          teamMembers: 1,
          monthlyEmailSends: 10,
        }),
        estimatedCosts: {
          cloudinaryStorageGbp: 0.4224,
          resendEmailGbp: 0.0038,
          totalGbp: 0.4262,
          status: 'estimated',
        },
      })
    )
    expect(report.businesses[1]).toEqual(
      expect.objectContaining({
        highestWarning: 'exceeded',
        warnings: expect.objectContaining({
          monthlyBookings: 'critical',
          mediaItems: 'exceeded',
        }),
        usage: expect.objectContaining({ teamMembers: 3 }),
      })
    )
    expect(report.totals).toEqual(
      expect.objectContaining({
        businesses: 2,
        activeBusinesses: 1,
        monthlyBookings: 102,
        mediaItems: 26,
        mediaBytes: 1_610_612_736,
        teamMembers: 4,
        monthlyEmailSends: 30,
        estimatedCostGbp: 0.6451,
      })
    )
    expect(report.coverage.mediaDelivery).toBe('unavailable')
  })

  it('labels cost estimates unavailable when no active stored rate exists', async () => {
    mockedPrisma.providerCostRate.findMany.mockResolvedValue([])

    const report = await getPlatformUsageReport(new Date('2026-08-15T12:00:00.000Z'))

    expect(report.totals.estimatedCostGbp).toBeNull()
    expect(report.businesses[0].estimatedCosts).toEqual({
      cloudinaryStorageGbp: null,
      resendEmailGbp: null,
      totalGbp: null,
      status: 'unavailable',
    })
  })
})
