export const FIRST_SELLABLE_LOOP_TARGET_SECONDS = 525

export const FIRST_SELLABLE_LOOP_STEPS = [
  {
    id: 'claim-handle',
    title: 'Claim a handle',
    eventName: 'first_sellable_loop.claim_handle.completed',
    targetSeconds: 45,
  },
  {
    id: 'add-service',
    title: 'Add the first service',
    eventName: 'first_sellable_loop.add_service.completed',
    targetSeconds: 120,
  },
  {
    id: 'set-availability',
    title: 'Set bookable availability',
    eventName: 'first_sellable_loop.set_availability.completed',
    targetSeconds: 90,
  },
  {
    id: 'publish-presence',
    title: 'Publish the presence page',
    eventName: 'first_sellable_loop.publish_presence.completed',
    targetSeconds: 60,
  },
  {
    id: 'share-link',
    title: 'Share the public link',
    eventName: 'first_sellable_loop.share_link.completed',
    targetSeconds: 30,
  },
  {
    id: 'receive-booking',
    title: 'Receive the first booking',
    eventName: 'first_sellable_loop.receive_booking.completed',
    targetSeconds: 120,
  },
  {
    id: 'manage-booking',
    title: 'Manage the first booking',
    eventName: 'first_sellable_loop.manage_booking.completed',
    targetSeconds: 60,
  },
] as const

export type FirstSellableLoopStepId = (typeof FIRST_SELLABLE_LOOP_STEPS)[number]['id']

export interface FirstSellableLoopSource {
  claimedHandleAt?: Date | string | null
  firstServiceAt?: Date | string | null
  firstAvailabilityAt?: Date | string | null
  publishedAt?: Date | string | null
  sharedAt?: Date | string | null
  firstBookingAt?: Date | string | null
  firstManagedBookingAt?: Date | string | null
}

export interface FirstSellableLoopStepProgress {
  id: FirstSellableLoopStepId
  title: string
  eventName: string
  targetSeconds: number
  status: 'pending' | 'completed'
  completedAt: string | null
}

export interface FirstSellableLoopProgress {
  targetSeconds: number
  steps: FirstSellableLoopStepProgress[]
  completedCount: number
  totalCount: number
  percent: number
  isComplete: boolean
  nextStep: FirstSellableLoopStepProgress | null
  startedAt: string | null
  completedAt: string | null
  elapsedSeconds: number | null
  withinTarget: boolean | null
}

const completionSourceByStep: Record<FirstSellableLoopStepId, keyof FirstSellableLoopSource> = {
  'claim-handle': 'claimedHandleAt',
  'add-service': 'firstServiceAt',
  'set-availability': 'firstAvailabilityAt',
  'publish-presence': 'publishedAt',
  'share-link': 'sharedAt',
  'receive-booking': 'firstBookingAt',
  'manage-booking': 'firstManagedBookingAt',
}

function toIsoString(value: Date | string | null | undefined): string | null {
  if (!value) return null

  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function buildFirstSellableLoopProgress(
  source: FirstSellableLoopSource
): FirstSellableLoopProgress {
  const steps = FIRST_SELLABLE_LOOP_STEPS.map<FirstSellableLoopStepProgress>(definition => {
    const completedAt = toIsoString(source[completionSourceByStep[definition.id]])

    return {
      ...definition,
      status: completedAt ? 'completed' : 'pending',
      completedAt,
    }
  })

  const completedCount = steps.filter(step => step.status === 'completed').length
  const isComplete = completedCount === steps.length
  const startedAt = steps[0].completedAt
  const completedAt = isComplete ? steps[steps.length - 1].completedAt : null
  const elapsedSeconds =
    startedAt && completedAt
      ? Math.max(
          0,
          Math.round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000)
        )
      : null

  return {
    targetSeconds: FIRST_SELLABLE_LOOP_TARGET_SECONDS,
    steps,
    completedCount,
    totalCount: steps.length,
    percent: Math.round((completedCount / steps.length) * 100),
    isComplete,
    nextStep: steps.find(step => step.status === 'pending') || null,
    startedAt,
    completedAt,
    elapsedSeconds,
    withinTarget:
      elapsedSeconds === null ? null : elapsedSeconds <= FIRST_SELLABLE_LOOP_TARGET_SECONDS,
  }
}
