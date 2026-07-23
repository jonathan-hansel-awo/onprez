/** @jest-environment node */

import { decideCancellationRefund } from '@/lib/booking-protection/cancellation'

const startTime = new Date('2026-08-10T12:00:00.000Z')

function base() {
  return {
    reason: 'CUSTOMER_REQUEST' as const,
    startTime,
    now: new Date('2026-08-08T10:00:00.000Z'),
    depositPaid: true,
    refundableAmount: 10,
    policySnapshot: { cancellationWindowHours: 24 },
  }
}

describe('booking deposit cancellation outcomes', () => {
  it('forces a refund when the business cannot provide the service', () => {
    const decision = decideCancellationRefund({ ...base(), reason: 'BUSINESS_UNAVAILABLE' })

    expect(decision).toMatchObject({ shouldRefund: true, forced: true, refundableAmount: 10 })
  })

  it('retains a no-show deposit', () => {
    const decision = decideCancellationRefund({ ...base(), reason: 'NO_SHOW_POLICY' })

    expect(decision).toMatchObject({ shouldRefund: false, forced: true })
  })

  it('recommends a refund outside the cancellation window', () => {
    const decision = decideCancellationRefund(base())

    expect(decision).toMatchObject({ shouldRefund: true, forced: false })
  })

  it('recommends retention for a late customer cancellation', () => {
    const decision = decideCancellationRefund({
      ...base(),
      now: new Date('2026-08-10T00:30:00.000Z'),
    })

    expect(decision).toMatchObject({ shouldRefund: false, forced: false })
  })

  it('allows the business to waive a late-cancellation charge', () => {
    const decision = decideCancellationRefund({
      ...base(),
      now: new Date('2026-08-10T00:30:00.000Z'),
      waiveCancellationFee: true,
    })

    expect(decision.shouldRefund).toBe(true)
  })

  it('does not attempt a refund when no refundable amount remains', () => {
    const decision = decideCancellationRefund({ ...base(), refundableAmount: 0 })

    expect(decision).toMatchObject({ shouldRefund: false, forced: true, refundableAmount: 0 })
  })
})
