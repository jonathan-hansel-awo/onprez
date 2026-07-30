import {
  FIRST_SELLABLE_LOOP_STEPS,
  FIRST_SELLABLE_LOOP_TARGET_SECONDS,
  buildFirstSellableLoopProgress,
} from './first-sellable-loop'

describe('first sellable user loop', () => {
  it('keeps the complete acceptance budget below ten minutes', () => {
    const budget = FIRST_SELLABLE_LOOP_STEPS.reduce(
      (total, step) => total + step.targetSeconds,
      0
    )

    expect(budget).toBe(FIRST_SELLABLE_LOOP_TARGET_SECONDS)
    expect(budget).toBeLessThan(600)
    expect(FIRST_SELLABLE_LOOP_STEPS.map(step => step.id)).toEqual([
      'claim-handle',
      'add-service',
      'set-availability',
      'publish-presence',
      'share-link',
      'receive-booking',
      'manage-booking',
    ])
  })

  it('reports the first incomplete milestone and funnel percentage', () => {
    const progress = buildFirstSellableLoopProgress({
      claimedHandleAt: '2026-07-30T10:00:00.000Z',
      firstServiceAt: '2026-07-30T10:01:00.000Z',
    })

    expect(progress.completedCount).toBe(2)
    expect(progress.percent).toBe(29)
    expect(progress.isComplete).toBe(false)
    expect(progress.nextStep?.id).toBe('set-availability')
    expect(progress.elapsedSeconds).toBeNull()
    expect(progress.withinTarget).toBeNull()
  })

  it('measures a completed loop against the sellable target', () => {
    const progress = buildFirstSellableLoopProgress({
      claimedHandleAt: '2026-07-30T10:00:00.000Z',
      firstServiceAt: '2026-07-30T10:01:00.000Z',
      firstAvailabilityAt: '2026-07-30T10:02:00.000Z',
      publishedAt: '2026-07-30T10:03:00.000Z',
      sharedAt: '2026-07-30T10:03:30.000Z',
      firstBookingAt: '2026-07-30T10:06:00.000Z',
      firstManagedBookingAt: '2026-07-30T10:08:30.000Z',
    })

    expect(progress.isComplete).toBe(true)
    expect(progress.nextStep).toBeNull()
    expect(progress.elapsedSeconds).toBe(510)
    expect(progress.withinTarget).toBe(true)
    expect(progress.steps.every(step => step.completedAt)).toBe(true)
  })

  it('does not count a received booking as managed without an owner transition', () => {
    const progress = buildFirstSellableLoopProgress({
      claimedHandleAt: new Date('2026-07-30T10:00:00.000Z'),
      firstServiceAt: new Date('2026-07-30T10:01:00.000Z'),
      firstAvailabilityAt: new Date('2026-07-30T10:02:00.000Z'),
      publishedAt: new Date('2026-07-30T10:03:00.000Z'),
      sharedAt: new Date('2026-07-30T10:04:00.000Z'),
      firstBookingAt: new Date('2026-07-30T10:05:00.000Z'),
    })

    expect(progress.nextStep?.id).toBe('manage-booking')
    expect(progress.steps.at(-1)).toMatchObject({
      id: 'manage-booking',
      status: 'pending',
      completedAt: null,
    })
  })
})
