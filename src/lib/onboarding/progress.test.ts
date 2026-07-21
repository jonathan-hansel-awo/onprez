import { buildOnboardingProgress, parseOnboardingState, type OnboardingSource } from './progress'

const newBusiness: OnboardingSource = {
  businessName: 'Crown Studio',
  slug: 'crown-studio',
  description: null,
  tagline: null,
  isPublished: false,
  activeServiceCount: 0,
  configuredHoursCount: 0,
  hasPublishedPage: false,
  state: { skippedTasks: [] },
}

describe('onboarding progress', () => {
  it('recommends the first incomplete setup action from real business data', () => {
    const progress = buildOnboardingProgress(newBusiness)

    expect(progress.tasks[0]).toMatchObject({ id: 'claim-handle', status: 'completed' })
    expect(progress.nextTask).toMatchObject({ id: 'business-profile' })
    expect(progress.percent).toBe(14)
    expect(progress.isComplete).toBe(false)
  })

  it('counts skipped optional tasks without allowing malformed settings through', () => {
    const state = parseOnboardingState({
      onboarding: {
        skippedTasks: ['preview', 'publish', 'share', 'unknown'],
      },
    })
    const progress = buildOnboardingProgress({
      ...newBusiness,
      description: 'A specialist textured-hair studio.',
      activeServiceCount: 1,
      configuredHoursCount: 5,
      state,
    })

    expect(state.skippedTasks).toEqual(['preview', 'share'])
    expect(progress.tasks.find(task => task.id === 'preview')?.status).toBe('skipped')
    expect(progress.nextTask?.id).toBe('publish')
  })

  it('celebrates a fully launched and shared business', () => {
    const progress = buildOnboardingProgress({
      ...newBusiness,
      description: 'A specialist textured-hair studio.',
      isPublished: true,
      activeServiceCount: 1,
      configuredHoursCount: 5,
      hasPublishedPage: true,
      state: {
        skippedTasks: [],
        previewedAt: '2026-07-21T10:00:00.000Z',
        sharedAt: '2026-07-21T10:05:00.000Z',
      },
    })

    expect(progress.completedCount).toBe(7)
    expect(progress.percent).toBe(100)
    expect(progress.isComplete).toBe(true)
    expect(progress.nextTask).toBeNull()
  })
})
