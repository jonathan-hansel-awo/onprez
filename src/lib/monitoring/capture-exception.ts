import * as Sentry from '@sentry/nextjs'

export function captureCaughtException(error: unknown, context: string): void {
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN

  if (process.env.NODE_ENV !== 'production' || !dsn) return

  Sentry.withScope(scope => {
    scope.setTag('error.context', context)
    Sentry.captureException(error)
  })
}
