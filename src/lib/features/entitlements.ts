import { EntitlementSource, FeatureKey, Prisma, type FeatureEntitlement } from '@prisma/client'

import { prisma } from '@/lib/prisma'

export class FeatureNotEntitledError extends Error {
  readonly code = 'FEATURE_NOT_ENTITLED'

  constructor(
    readonly businessId: string,
    readonly feature: FeatureKey
  ) {
    super(`Business ${businessId} is not entitled to ${feature}`)
    this.name = 'FeatureNotEntitledError'
  }
}

export interface FeatureEntitlementState {
  enabled: boolean
  expiresAt: Date | null
}

export interface SetFeatureEntitlementInput {
  businessId: string
  feature: FeatureKey
  enabled: boolean
  source: EntitlementSource
  expiresAt?: Date | null
  metadata?: Prisma.InputJsonValue
}

export function isFeatureEntitlementActive(
  entitlement: FeatureEntitlementState | null | undefined,
  now = new Date()
): boolean {
  if (!entitlement?.enabled) return false
  return entitlement.expiresAt === null || entitlement.expiresAt > now
}

export async function getFeatureEntitlement(
  businessId: string,
  feature: FeatureKey
): Promise<FeatureEntitlement | null> {
  return prisma.featureEntitlement.findUnique({
    where: {
      businessId_feature: {
        businessId,
        feature,
      },
    },
  })
}

export async function canUseFeature(
  businessId: string,
  feature: FeatureKey,
  now = new Date()
): Promise<boolean> {
  const entitlement = await getFeatureEntitlement(businessId, feature)
  return isFeatureEntitlementActive(entitlement, now)
}

export async function requireFeatureEntitlement(
  businessId: string,
  feature: FeatureKey,
  now = new Date()
): Promise<FeatureEntitlement> {
  const entitlement = await getFeatureEntitlement(businessId, feature)

  if (!isFeatureEntitlementActive(entitlement, now) || !entitlement) {
    throw new FeatureNotEntitledError(businessId, feature)
  }

  return entitlement
}

export async function setFeatureEntitlement({
  businessId,
  feature,
  enabled,
  source,
  expiresAt = null,
  metadata,
}: SetFeatureEntitlementInput): Promise<FeatureEntitlement> {
  const data = {
    enabled,
    source,
    expiresAt,
    ...(metadata === undefined ? {} : { metadata }),
  }

  return prisma.featureEntitlement.upsert({
    where: {
      businessId_feature: {
        businessId,
        feature,
      },
    },
    create: {
      businessId,
      feature,
      ...data,
    },
    update: data,
  })
}
