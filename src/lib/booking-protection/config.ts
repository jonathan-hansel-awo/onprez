import { Prisma, ServiceDepositMode } from '@prisma/client'

// This version will be snapshotted with each customer policy acceptance in the payment phase.
export const BOOKING_PROTECTION_POLICY_VERSION = 'booking-deposit-v1'

export interface BookingProtectionDefaults {
  enabled: boolean
  depositAmount: number
  cancellationWindowHours: number
  deductFromTotal: true
  policyVersion: string
}

export interface EffectiveServiceDeposit {
  requiresDeposit: boolean
  depositAmount: number | null
  remainingAmount: number
  cancellationWindowHours: number | null
  deductFromTotal: true
  source: 'NONE' | 'BUSINESS_DEFAULT' | 'CUSTOM'
  unavailableReason:
    | 'FEATURE_NOT_ENTITLED'
    | 'STRIPE_NOT_READY'
    | 'DEFAULT_DISABLED'
    | 'FREE_SERVICE'
    | 'DEPOSIT_EXCEEDS_PRICE'
    | null
}

export const DEFAULT_BOOKING_PROTECTION: BookingProtectionDefaults = {
  enabled: false,
  depositAmount: 10,
  cancellationWindowHours: 24,
  deductFromTotal: true,
  policyVersion: BOOKING_PROTECTION_POLICY_VERSION,
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function finiteNumber(value: unknown, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function readBookingProtectionDefaults(
  settings: Prisma.JsonValue | null | undefined
): BookingProtectionDefaults {
  const root = toRecord(settings)
  const stored = toRecord(root.bookingProtection)

  return {
    enabled: stored.enabled === true,
    depositAmount: Math.max(0, finiteNumber(stored.depositAmount, 10)),
    cancellationWindowHours: Math.max(1, finiteNumber(stored.cancellationWindowHours, 24)),
    deductFromTotal: true,
    policyVersion:
      typeof stored.policyVersion === 'string' && stored.policyVersion.trim()
        ? stored.policyVersion
        : BOOKING_PROTECTION_POLICY_VERSION,
  }
}

export function mergeBookingProtectionDefaults(
  settings: Prisma.JsonValue | null | undefined,
  defaults: BookingProtectionDefaults
): Prisma.InputJsonValue {
  const root = toRecord(settings)

  return {
    ...root,
    bookingProtection: {
      enabled: defaults.enabled,
      depositAmount: defaults.depositAmount,
      cancellationWindowHours: defaults.cancellationWindowHours,
      deductFromTotal: true,
      policyVersion: defaults.policyVersion,
      updatedAt: new Date().toISOString(),
    },
  } as Prisma.InputJsonValue
}

export function resolveEffectiveServiceDeposit({
  mode,
  customDepositAmount,
  servicePrice,
  defaults,
  entitled,
  stripeReady,
}: {
  mode: ServiceDepositMode
  customDepositAmount: number | null
  servicePrice: number
  defaults: BookingProtectionDefaults
  entitled: boolean
  stripeReady: boolean
}): EffectiveServiceDeposit {
  const price = Math.max(0, Number(servicePrice) || 0)
  const source = mode

  const unavailable = (
    unavailableReason: EffectiveServiceDeposit['unavailableReason']
  ): EffectiveServiceDeposit => ({
    requiresDeposit: false,
    depositAmount: null,
    remainingAmount: price,
    cancellationWindowHours: null,
    deductFromTotal: true,
    source,
    unavailableReason,
  })

  if (mode === ServiceDepositMode.NONE) return unavailable(null)
  if (!entitled) return unavailable('FEATURE_NOT_ENTITLED')
  if (!stripeReady) return unavailable('STRIPE_NOT_READY')
  if (price <= 0) return unavailable('FREE_SERVICE')

  if (mode === ServiceDepositMode.BUSINESS_DEFAULT && !defaults.enabled) {
    return unavailable('DEFAULT_DISABLED')
  }

  const amount =
    mode === ServiceDepositMode.CUSTOM
      ? Math.max(0, Number(customDepositAmount) || 0)
      : defaults.depositAmount

  if (amount <= 0 || amount > price) return unavailable('DEPOSIT_EXCEEDS_PRICE')

  return {
    requiresDeposit: true,
    depositAmount: amount,
    remainingAmount: Math.max(0, price - amount),
    cancellationWindowHours: defaults.cancellationWindowHours,
    deductFromTotal: true,
    source,
    unavailableReason: null,
  }
}
