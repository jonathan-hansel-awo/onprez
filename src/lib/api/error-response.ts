import { NextResponse } from 'next/server'

import { captureCaughtException } from '@/lib/monitoring/capture-exception'
import { logger, traceHeaders, type LogFields } from '@/lib/observability/logger'

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'INVALID_CREDENTIALS'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'

export type ApiErrorStatus = 400 | 401 | 403 | 404 | 409 | 429 | 500

type ApiErrorOptions = {
  details?: unknown
  headers?: HeadersInit
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: ApiErrorStatus,
  options: ApiErrorOptions = {}
) {
  const headers = new Headers(options.headers)
  for (const [name, value] of Object.entries(traceHeaders())) headers.set(name, value)

  return NextResponse.json(
    {
      success: false,
      // Temporary compatibility field for existing clients during migration.
      message,
      error: {
        code,
        message,
        ...(options.details === undefined ? {} : { details: options.details }),
      },
    },
    { status, headers }
  )
}

export function logApiError(context: string, error: unknown, fields: LogFields = {}): void {
  captureCaughtException(error, context)
  logger.error('api.error', { context, error, ...fields })
}
