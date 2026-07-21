export const ONBOARDING_TASK_IDS = [
  'claim-handle',
  'business-profile',
  'add-service',
  'set-availability',
  'preview',
  'publish',
  'share',
] as const

export type OnboardingTaskId = (typeof ONBOARDING_TASK_IDS)[number]

export interface OnboardingTask {
  id: OnboardingTaskId
  title: string
  description: string
  href: string
  actionLabel: string
  optional: boolean
  status: 'pending' | 'completed' | 'skipped'
}

export interface OnboardingState {
  skippedTasks: OnboardingTaskId[]
  previewedAt?: string
  sharedAt?: string
}

export interface OnboardingSource {
  businessName: string
  slug: string
  description: string | null
  tagline: string | null
  isPublished: boolean
  activeServiceCount: number
  configuredHoursCount: number
  hasPublishedPage: boolean
  state: OnboardingState
}

export interface OnboardingProgress {
  businessName: string
  slug: string
  publicUrl: string
  isPublished: boolean
  tasks: OnboardingTask[]
  completedCount: number
  totalCount: number
  percent: number
  isComplete: boolean
  nextTask: OnboardingTask | null
}

const optionalTaskIds = new Set<OnboardingTaskId>(['preview', 'share'])

export function isOptionalOnboardingTask(id: OnboardingTaskId): boolean {
  return optionalTaskIds.has(id)
}

export function parseOnboardingState(settings: unknown): OnboardingState {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return { skippedTasks: [] }
  }

  const onboarding = (settings as Record<string, unknown>).onboarding
  if (!onboarding || typeof onboarding !== 'object' || Array.isArray(onboarding)) {
    return { skippedTasks: [] }
  }

  const value = onboarding as Record<string, unknown>
  const skippedTasks = Array.isArray(value.skippedTasks)
    ? value.skippedTasks.filter(
        (task): task is OnboardingTaskId =>
          typeof task === 'string' &&
          ONBOARDING_TASK_IDS.includes(task as OnboardingTaskId) &&
          isOptionalOnboardingTask(task as OnboardingTaskId)
      )
    : []

  return {
    skippedTasks,
    previewedAt: typeof value.previewedAt === 'string' ? value.previewedAt : undefined,
    sharedAt: typeof value.sharedAt === 'string' ? value.sharedAt : undefined,
  }
}

export function buildOnboardingProgress(source: OnboardingSource): OnboardingProgress {
  const completed: Record<OnboardingTaskId, boolean> = {
    'claim-handle': source.slug.trim().length >= 3,
    'business-profile':
      source.businessName.trim().length > 0 &&
      Boolean(source.description?.trim() || source.tagline?.trim()),
    'add-service': source.activeServiceCount > 0,
    'set-availability': source.configuredHoursCount > 0,
    preview: Boolean(source.state.previewedAt),
    publish: source.isPublished && source.hasPublishedPage,
    share: Boolean(source.state.sharedAt),
  }

  const definitions: Array<Omit<OnboardingTask, 'status'>> = [
    {
      id: 'claim-handle',
      title: 'Claim your handle',
      description: `Your public address is onprez.com/${source.slug}.`,
      href: '/dashboard/settings/profile',
      actionLabel: 'View handle',
      optional: false,
    },
    {
      id: 'business-profile',
      title: 'Introduce your business',
      description: 'Add a useful description or tagline so visitors know what you offer.',
      href: '/dashboard/settings/profile',
      actionLabel: 'Complete profile',
      optional: false,
    },
    {
      id: 'add-service',
      title: 'Add your first service',
      description: 'Set a bookable service with a clear price and duration.',
      href: '/dashboard/services/new',
      actionLabel: 'Add service',
      optional: false,
    },
    {
      id: 'set-availability',
      title: 'Set your availability',
      description: 'Choose at least one day when customers can book you.',
      href: '/dashboard/settings/hours',
      actionLabel: 'Set hours',
      optional: false,
    },
    {
      id: 'preview',
      title: 'Preview your presence',
      description: 'Check your page from a customer’s point of view before launch.',
      href: '/dashboard/presence/editor?pane=preview',
      actionLabel: 'Preview page',
      optional: true,
    },
    {
      id: 'publish',
      title: 'Publish your presence',
      description: 'Make your page visible and ready to receive bookings.',
      href: '/dashboard/presence/editor',
      actionLabel: 'Publish page',
      optional: false,
    },
    {
      id: 'share',
      title: 'Share your link',
      description: 'Send your live OnPrez link to your first customers.',
      href: '/dashboard/sharing',
      actionLabel: 'Share link',
      optional: true,
    },
  ]

  const tasks = definitions.map<OnboardingTask>(task => ({
    ...task,
    status: completed[task.id]
      ? 'completed'
      : source.state.skippedTasks.includes(task.id)
        ? 'skipped'
        : 'pending',
  }))
  const completedCount = tasks.filter(task => task.status !== 'pending').length
  const nextTask = tasks.find(task => task.status === 'pending') || null

  return {
    businessName: source.businessName,
    slug: source.slug,
    publicUrl: `/${source.slug}`,
    isPublished: completed.publish,
    tasks,
    completedCount,
    totalCount: tasks.length,
    percent: Math.round((completedCount / tasks.length) * 100),
    isComplete: completedCount === tasks.length,
    nextTask,
  }
}
