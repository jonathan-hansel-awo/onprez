import { prisma } from '@/lib/prisma'
import { recordBusinessMediaAsset } from '@/lib/usage/media-asset'

jest.mock('@/lib/prisma', () => ({
  prisma: { mediaAsset: { upsert: jest.fn() } },
}))

const mockedUpsert = prisma.mediaAsset.upsert as jest.Mock

describe('business media asset accounting', () => {
  it('upserts provider metadata by public ID so duplicate reuse cannot inflate storage', async () => {
    mockedUpsert.mockResolvedValue({ id: 'asset-1' })

    await recordBusinessMediaAsset({
      businessId: 'business-1',
      purpose: 'gallery',
      fingerprint: 'abc123',
      image: {
        secure_url: 'https://res.cloudinary.com/onprez/image/upload/asset.jpg',
        public_id: 'onprez/businesses/business-1/gallery/abc123',
        width: 1200,
        height: 800,
        format: 'jpg',
        bytes: 42_000,
      },
    })

    expect(mockedUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { publicId: 'onprez/businesses/business-1/gallery/abc123' },
        create: expect.objectContaining({
          businessId: 'business-1',
          bytes: BigInt(42_000),
          fingerprint: 'abc123',
          purpose: 'gallery',
        }),
        update: expect.objectContaining({ bytes: BigInt(42_000) }),
      })
    )
  })
})
