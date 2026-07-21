'use client'

import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ActionFeedbackProps {
  status: 'success' | 'error'
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function ActionFeedback({
  status,
  title,
  message,
  actionLabel,
  onAction,
  className,
}: ActionFeedbackProps) {
  const isSuccess = status === 'success'
  const Icon = isSuccess ? CheckCircle2 : AlertCircle

  return (
    <div
      role={isSuccess ? 'status' : 'alert'}
      aria-live={isSuccess ? 'polite' : 'assertive'}
      className={cn(
        'flex items-start gap-3 rounded-xl border-2 p-4',
        isSuccess
          ? 'border-green-200 bg-green-50 text-green-800'
          : 'border-red-200 bg-red-50 text-red-800',
        className
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-sm">{message}</p>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="mt-2 text-sm font-semibold underline underline-offset-2 hover:no-underline"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}
