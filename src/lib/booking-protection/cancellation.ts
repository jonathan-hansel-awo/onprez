import type { Prisma } from '@prisma/client'

export type BookingCancellationReason =
  | 'CUSTOMER_REQUEST'
  | 'BUSINESS_UNAVAILABLE'
  | 'STAFF_UNAVAILABLE'
  | 'EMERGENCY'
  | 'DUPLICATE_BOOKING'
  | 'NO_SHOW_POLICY'
  | 'OTHER'

interface CancellationRefundInput {
  reason: BookingCancellationReason
  startTime: Date
  now?: Date
  depositPaid: boolean
  refundableAmount: number
  policySnapshot?: Prisma.JsonValue | null
  requestedRefund?: boolean
  waiveCancellationFee?: boolean
}

export interface CancellationRefundDecision {
  shouldRefund: boolean
  forced: boolean
  refundableAmount: number
  cancellationWindowHours: number
  explanation: string
}

const BUSINESS_FAULT_REASONS = new Set<BookingCancellationReason>([
  'BUSINESS_UNAVAILABLE',
  'STAFF_UNAVAILABLE',
  'EMERGENCY',
  'DUPLICATE_BOOKING',
])

function readCancellationWindowHours(snapshot: Prisma.JsonValue | null | undefined): number {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return 24
  const value = (snapshot as Record<string, unknown>).cancellationWindowHours
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 24
}

export function decideCancellationRefund(
  input: CancellationRefundInput
): CancellationRefundDecision {
  const cancellationWindowHours = readCancellationWindowHours(input.policySnapshot)
  const refundableAmount = Math.max(0, input.refundableAmount)

  if (!input.depositPaid || refundableAmount <= 0) {
    return {
      shouldRefund: false,
      forced: true,
      refundableAmount: 0,
      cancellationWindowHours,
      explanation: 'No refundable booking deposit is available.',
    }
  }

  if (BUSINESS_FAULT_REASONS.has(input.reason)) {
    return {
      shouldRefund: true,
      forced: true,
      refundableAmount,
      cancellationWindowHours,
      explanation: 'Business-caused cancellations must refund the booking deposit.',
    }
  }

  if (input.reason === 'NO_SHOW_POLICY') {
    return {
      shouldRefund: false,
      forced: true,
      refundableAmount,
      cancellationWindowHours,
      explanation: 'The deposit is retained under the no-show policy.',
    }
  }

  if (input.waiveCancellationFee) {
    return {
      shouldRefund: true,
      forced: false,
      refundableAmount,
      cancellationWindowHours,
      explanation: 'The business chose to waive the cancellation charge.',
    }
  }

  const now = input.now ?? new Date()
  const hoursBeforeAppointment = (input.startTime.getTime() - now.getTime()) / 3_600_000
  const outsideLateCancellationWindow = hoursBeforeAppointment >= cancellationWindowHours
  const policyRecommendation = outsideLateCancellationWindow

  return {
    shouldRefund: input.requestedRefund ?? policyRecommendation,
    forced: false,
    refundableAmount,
    cancellationWindowHours,
    explanation:
      (input.requestedRefund ?? policyRecommendation)
        ? outsideLateCancellationWindow
          ? `The cancellation is outside the ${cancellationWindowHours}-hour late-cancellation window.`
          : 'The business chose to refund the deposit.'
        : outsideLateCancellationWindow
          ? 'The business chose to retain the deposit despite the policy recommendation.'
          : `The cancellation is within the ${cancellationWindowHours}-hour late-cancellation window.`,
  }
}
