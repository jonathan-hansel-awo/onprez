'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  PartyPopper,
  Rocket,
  RotateCcw,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Confetti } from '@/components/animations/confetti'
import type {
  OnboardingProgress,
  OnboardingTask,
  OnboardingTaskId,
} from '@/lib/onboarding/progress'

interface OnboardingResponse {
  success: boolean
  data?: { onboarding: OnboardingProgress }
  error?: string
}

export function OnboardingChecklist() {
  const router = useRouter()
  const [progress, setProgress] = useState<OnboardingProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingTask, setUpdatingTask] = useState<OnboardingTaskId | null>(null)
  const [expanded, setExpanded] = useState(true)
  const [celebrate, setCelebrate] = useState(false)

  const loadProgress = useCallback(async () => {
    setError('')
    try {
      const response = await fetch('/api/dashboard/onboarding')
      const result = (await response.json()) as OnboardingResponse
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || 'Your setup progress could not be loaded.')
      }
      setProgress(result.data.onboarding)
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Your setup progress could not be loaded.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProgress()
  }, [loadProgress])

  async function updateTask(taskId: OnboardingTaskId, action: 'complete' | 'skip' | 'restore') {
    if (updatingTask) return false

    setUpdatingTask(taskId)
    setError('')
    try {
      const response = await fetch('/api/dashboard/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, action }),
      })
      const result = (await response.json()) as OnboardingResponse
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || 'Your setup progress could not be updated.')
      }

      const becameComplete = !progress?.isComplete && result.data.onboarding.isComplete
      setProgress(result.data.onboarding)
      if (becameComplete || action === 'complete') {
        setCelebrate(true)
        window.setTimeout(() => setCelebrate(false), 3000)
      }
      return true
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : 'Your setup progress could not be updated.'
      )
      return false
    } finally {
      setUpdatingTask(null)
    }
  }

  async function handlePreview(task: OnboardingTask) {
    const updated = await updateTask(task.id, 'complete')
    if (updated) router.push(task.href)
  }

  if (loading) {
    return (
      <div
        className="h-48 animate-pulse rounded-2xl bg-white shadow-sm"
        aria-label="Loading setup progress"
      />
    )
  }

  if (!progress) {
    return (
      <Card hover={false} className="border-amber-200 bg-amber-50 p-5">
        <p className="font-semibold text-amber-950">Setup guidance is temporarily unavailable.</p>
        <p className="mt-1 text-sm text-amber-800">{error}</p>
        <button
          type="button"
          onClick={() => {
            setLoading(true)
            void loadProgress()
          }}
          className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-amber-950 hover:bg-amber-100"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
      </Card>
    )
  }

  const nextTask = progress.nextTask
  const publishedMilestone = progress.isPublished && !progress.isComplete

  return (
    <Card hover={false} className="relative overflow-hidden border-onprez-blue/20">
      <Confetti active={celebrate} />
      <div className="bg-gradient-to-r from-onprez-blue/10 via-white to-onprez-purple/10 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-onprez-blue to-onprez-purple text-white">
              {progress.isComplete || publishedMilestone ? (
                <PartyPopper className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Rocket className="h-5 w-5" aria-hidden="true" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-onprez-blue">
                {progress.isComplete
                  ? 'Launch complete'
                  : publishedMilestone
                    ? 'You’re live'
                    : 'Your launch plan'}
              </p>
              <h2 className="mt-1 text-xl font-bold text-gray-950 sm:text-2xl">
                {progress.isComplete
                  ? `${progress.businessName} is ready to grow`
                  : publishedMilestone
                    ? `${progress.businessName} is live!`
                    : nextTask
                      ? `Next: ${nextTask.title}`
                      : 'Your presence is ready'}
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-600">
                {progress.isComplete
                  ? 'Your setup is complete. Keep sharing your link and managing new bookings here.'
                  : publishedMilestone
                    ? 'Your presence is public and ready for customers. Share your link to complete your launch.'
                    : nextTask?.description || 'Complete the steps below to start taking bookings.'}
              </p>
            </div>
          </div>

          {progress.isComplete ? (
            <Link
              href="/dashboard/sharing"
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-onprez-blue to-onprez-purple px-4 py-2 text-sm font-semibold text-white shadow-sm"
            >
              Share again
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : nextTask?.id === 'preview' ? (
            <button
              type="button"
              onClick={() => void handlePreview(nextTask)}
              disabled={Boolean(updatingTask)}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-onprez-blue to-onprez-purple px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
            >
              {updatingTask === nextTask.id ? 'Opening…' : nextTask.actionLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : nextTask ? (
            <Link
              href={nextTask.href}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-onprez-blue to-onprez-purple px-4 py-2 text-sm font-semibold text-white shadow-sm"
            >
              {nextTask.actionLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : null}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <div
            className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-200"
            role="progressbar"
            aria-label="Onboarding progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress.percent}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-onprez-blue to-onprez-purple transition-[width]"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <span className="shrink-0 text-sm font-semibold text-gray-700">
            {progress.completedCount}/{progress.totalCount}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setExpanded(value => !value)}
        className="flex min-h-11 w-full items-center justify-between border-t border-gray-100 px-5 py-3 text-left text-sm font-semibold text-gray-800 hover:bg-gray-50 sm:px-6"
        aria-expanded={expanded}
      >
        {expanded ? 'Hide setup steps' : 'Show setup steps'}
        <ChevronDown
          className={`h-5 w-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {expanded && (
        <ol className="divide-y divide-gray-100 border-t border-gray-100">
          {progress.tasks.map((task, index) => (
            <li key={task.id} className="flex gap-3 px-5 py-4 sm:px-6">
              <div className="pt-0.5">
                {task.status === 'completed' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                ) : task.status === 'skipped' ? (
                  <Check className="h-5 w-5 text-gray-400" aria-hidden="true" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-300" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={`font-semibold ${
                      task.status === 'pending' ? 'text-gray-950' : 'text-gray-500'
                    }`}
                  >
                    {index + 1}. {task.title}
                  </p>
                  {task.optional && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      Optional
                    </span>
                  )}
                  {task.status === 'skipped' && (
                    <span className="text-xs font-medium text-gray-500">Skipped</span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-gray-600">{task.description}</p>

                {task.status === 'pending' && (
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {task.id === 'preview' ? (
                      <button
                        type="button"
                        onClick={() => void handlePreview(task)}
                        disabled={Boolean(updatingTask)}
                        className="inline-flex min-h-11 items-center text-sm font-semibold text-onprez-blue disabled:opacity-60"
                      >
                        {updatingTask === task.id ? 'Opening…' : task.actionLabel}
                        <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                      </button>
                    ) : (
                      <Link
                        href={task.href}
                        className="inline-flex min-h-11 items-center text-sm font-semibold text-onprez-blue"
                      >
                        {task.actionLabel}
                        <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                      </Link>
                    )}
                    {task.optional && (
                      <button
                        type="button"
                        onClick={() => void updateTask(task.id, 'skip')}
                        disabled={Boolean(updatingTask)}
                        className="min-h-11 text-sm font-medium text-gray-500 hover:text-gray-800 disabled:opacity-60"
                      >
                        Skip for now
                      </button>
                    )}
                  </div>
                )}

                {task.status === 'skipped' && (
                  <button
                    type="button"
                    onClick={() => void updateTask(task.id, 'restore')}
                    disabled={Boolean(updatingTask)}
                    className="mt-2 min-h-11 text-sm font-semibold text-onprez-blue disabled:opacity-60"
                  >
                    Add back to checklist
                  </button>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      {error && (
        <div
          role="alert"
          className="border-t border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700 sm:px-6"
        >
          {error} Your progress is unchanged; please try again.
        </div>
      )}
    </Card>
  )
}
