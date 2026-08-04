import { prisma } from '@/lib/prisma'

export interface BusinessMediaAssetInput {
  businessId: string
  purpose: string
  fingerprint: string
  image: {
    secure_url: string
    public_id: string
    width: number
    height: number
    format: string
    bytes: number
  }
}

export async function recordBusinessMediaAsset({
  businessId,
  purpose,
  fingerprint,
  image,
}: BusinessMediaAssetInput) {
  const now = new Date()

  return prisma.mediaAsset.upsert({
    where: { publicId: image.public_id },
    create: {
      businessId,
      provider: 'CLOUDINARY',
      publicId: image.public_id,
      fingerprint,
      purpose,
      secureUrl: image.secure_url,
      bytes: BigInt(image.bytes),
      width: image.width,
      height: image.height,
      format: image.format,
      lastSeenAt: now,
    },
    update: {
      secureUrl: image.secure_url,
      bytes: BigInt(image.bytes),
      width: image.width,
      height: image.height,
      format: image.format,
      lastSeenAt: now,
    },
  })
}
