'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface EmptyStateAction {
  label: string
  href?: string
  onClick?: () => void
}

interface GuidedEmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action: EmptyStateAction
  secondaryAction?: EmptyStateAction
  className?: string
}

const primaryActionClassName =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-onprez-blue to-onprez-purple px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-onprez-blue focus-visible:ring-offset-2'

const secondaryActionClassName =
  'inline-flex min-h-11 items-center justify-center rounded-lg border-2 border-onprez-blue px-5 py-2.5 text-sm font-semibold text-onprez-blue transition hover:bg-onprez-blue/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-onprez-blue focus-visible:ring-offset-2'

function EmptyStateActionControl({
  action,
  secondary = false,
}: {
  action: EmptyStateAction
  secondary?: boolean
}) {
  const className = secondary ? secondaryActionClassName : primaryActionClassName
  const content = (
    <>
      {action.label}
      {!secondary && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
    </>
  )

  if (action.href) {
    return (
      <Link href={action.href} className={className}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" onClick={action.onClick} className={className}>
      {content}
    </button>
  )
}

export function GuidedEmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: GuidedEmptyStateProps) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-dashed border-onprez-blue/30 bg-gradient-to-b from-onprez-blue/[0.06] to-white px-6 py-12 text-center sm:px-10',
        className
      )}
      aria-labelledby={`empty-state-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
    >
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-onprez-blue/10 text-onprez-blue">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </div>
      <h2
        id={`empty-state-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
        className="text-xl font-bold text-gray-900"
      >
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-600 sm:text-base">
        {description}
      </p>
      <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
        <EmptyStateActionControl action={action} />
        {secondaryAction && <EmptyStateActionControl action={secondaryAction} secondary />}
      </div>
    </section>
  )
}
