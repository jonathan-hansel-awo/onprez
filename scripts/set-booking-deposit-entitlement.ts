import { EntitlementSource, FeatureKey, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function readArgument(name: string): string | undefined {
  const prefix = `--${name}=`
  return process.argv.find(argument => argument.startsWith(prefix))?.slice(prefix.length)
}

function parseEnabled(value: string | undefined): boolean {
  if (value === 'true') return true
  if (value === 'false') return false
  throw new Error('Pass --enabled=true or --enabled=false')
}

function parseExpiry(value: string | undefined): Date | null {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error('--expires must be a valid ISO date')
  }

  return date
}

async function main() {
  const businessSelector = readArgument('business')
  const enabled = parseEnabled(readArgument('enabled'))
  const expiresAt = parseExpiry(readArgument('expires'))

  if (!businessSelector) {
    throw new Error('Pass --business=<business-id-or-slug>')
  }

  const business = await prisma.business.findFirst({
    where: {
      OR: [{ id: businessSelector }, { slug: businessSelector }],
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  })

  if (!business) {
    throw new Error(`No business found for ${businessSelector}`)
  }

  const entitlement = await prisma.featureEntitlement.upsert({
    where: {
      businessId_feature: {
        businessId: business.id,
        feature: FeatureKey.BOOKING_DEPOSITS,
      },
    },
    create: {
      businessId: business.id,
      feature: FeatureKey.BOOKING_DEPOSITS,
      enabled,
      source: EntitlementSource.ALPHA,
      expiresAt,
    },
    update: {
      enabled,
      source: EntitlementSource.ALPHA,
      expiresAt,
    },
  })

  console.log(
    JSON.stringify(
      {
        business: {
          id: business.id,
          name: business.name,
          slug: business.slug,
        },
        entitlement: {
          feature: entitlement.feature,
          enabled: entitlement.enabled,
          source: entitlement.source,
          expiresAt: entitlement.expiresAt,
        },
      },
      null,
      2
    )
  )
}

main()
  .catch(error => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
