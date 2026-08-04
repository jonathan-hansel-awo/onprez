import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { v2 as cloudinary } from 'cloudinary'

const prisma = new PrismaClient()
const BUSINESS_ASSET_PATTERN = /^onprez\/businesses\/([^/]+)\/([^/]+)\/([^/]+)$/

type CloudinaryResource = {
  public_id: string
  secure_url: string
  bytes: number
  width: number
  height: number
  format: string
}

type ResourcePage = {
  resources: CloudinaryResource[]
  next_cursor?: string
}

export function parseBusinessAssetPublicId(publicId: string) {
  const match = BUSINESS_ASSET_PATTERN.exec(publicId)
  if (!match) return null

  return {
    businessId: match[1],
    purpose: match[2],
    fingerprint: match[3],
  }
}

async function main() {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })

  if (
    !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new Error('Cloudinary credentials are required to backfill media usage')
  }

  const businesses = await prisma.business.findMany({ select: { id: true } })
  const businessIds = new Set(businesses.map(business => business.id))
  let nextCursor: string | undefined
  let scanned = 0
  let recorded = 0
  let skipped = 0

  do {
    const page = (await cloudinary.api.resources({
      resource_type: 'image',
      type: 'upload',
      prefix: 'onprez/businesses/',
      max_results: 500,
      ...(nextCursor ? { next_cursor: nextCursor } : {}),
    })) as ResourcePage

    for (const resource of page.resources) {
      scanned += 1
      const parsed = parseBusinessAssetPublicId(resource.public_id)

      if (!parsed || !businessIds.has(parsed.businessId)) {
        skipped += 1
        continue
      }

      await prisma.mediaAsset.upsert({
        where: { publicId: resource.public_id },
        create: {
          businessId: parsed.businessId,
          provider: 'CLOUDINARY',
          publicId: resource.public_id,
          fingerprint: parsed.fingerprint,
          purpose: parsed.purpose,
          secureUrl: resource.secure_url,
          bytes: BigInt(resource.bytes),
          width: resource.width,
          height: resource.height,
          format: resource.format,
        },
        update: {
          secureUrl: resource.secure_url,
          bytes: BigInt(resource.bytes),
          width: resource.width,
          height: resource.height,
          format: resource.format,
          lastSeenAt: new Date(),
        },
      })
      recorded += 1
    }

    nextCursor = page.next_cursor
  } while (nextCursor)

  process.stdout.write(`${JSON.stringify({ scanned, recorded, skipped }, null, 2)}\n`)
}

if (process.env.NODE_ENV !== 'test') {
  main()
    .catch(error => {
      console.error(error instanceof Error ? error.message : error)
      process.exitCode = 1
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
