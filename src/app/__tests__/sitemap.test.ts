import { prisma } from '@/lib/prisma'
import sitemap from '../sitemap'

jest.mock('@/lib/prisma', () => ({
  prisma: { business: { findMany: jest.fn() } },
}))

jest.mock('@/lib/utils/get-app-url', () => ({
  getAppUrl: () => 'https://onprez.com',
}))

const mockFindMany = jest.mocked(prisma.business.findMany)

describe('sitemap', () => {
  beforeEach(() => jest.clearAllMocks())

  it('includes only active, indexable businesses with a published home page', async () => {
    mockFindMany.mockResolvedValue([
      { slug: 'heavenly-pamper-palace', updatedAt: new Date('2026-08-01T12:00:00Z') },
    ] as never)

    const entries = await sitemap()

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isPublished: true,
          isActive: true,
          allowSearchEngineIndexing: true,
          pages: { some: { slug: 'home', isPublished: true } },
        },
      })
    )
    expect(entries).toContainEqual(
      expect.objectContaining({ url: 'https://onprez.com/heavenly-pamper-palace' })
    )
  })

  it('keeps the static sitemap available when dynamic presence lookup fails', async () => {
    mockFindMany.mockRejectedValue(new Error('database unavailable'))
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)

    const entries = await sitemap()

    expect(entries.some(entry => entry.url === 'https://onprez.com')).toBe(true)
    expect(entries.some(entry => entry.url === 'https://onprez.com/pricing')).toBe(true)
    warn.mockRestore()
  })
})
