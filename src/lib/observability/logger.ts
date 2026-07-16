import { AsyncLocalStorage } from 'node:async_hooks'

import type { NextRequest, NextResponse } from 'next/server'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LogFields = Record<string, unknown>

export type TraceContext = {
  requestId: string
  correlationId: string
  method?: string
  path?: string
}

const traceStorage = new AsyncLocalStorage<TraceContext>()
const SAFE_ID_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/
const SENSITIVE_KEY_PATTERN =
  /password|passcode|token|secret|authorization|cookie|api[-_]?key|private[-_]?key|credential|session|payload|requestbody|formdata/i
const MAX_DEPTH = 5
const MAX_ARRAY_ITEMS = 20
const MAX_STRING_LENGTH = 1_000

function redactString(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [REDACTED]')
    .replace(
      /\b(password|passcode|token|secret|api[-_]?key)\b(\s*[=:]\s*)[^\s,;&]+/gi,
      '$1$2[REDACTED]'
    )
    .replace(/[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}/g, '[REDACTED]')
}

function safeTraceId(value: string | null): string | undefined {
  const candidate = value?.trim()
  return candidate && SAFE_ID_PATTERN.test(candidate) ? candidate : undefined
}

function sanitize(value: unknown, key = '', depth = 0): unknown {
  if (SENSITIVE_KEY_PATTERN.test(key)) return '[REDACTED]'
  if (value === null || value === undefined || typeof value === 'boolean') return value
  if (typeof value === 'number') return value
  if (typeof value === 'bigint') return value.toString()
  if (typeof value === 'string') {
    const redacted = redactString(value)
    return redacted.length > MAX_STRING_LENGTH
      ? `${redacted.slice(0, MAX_STRING_LENGTH)}…`
      : redacted
  }
  if (value instanceof Date) return value.toISOString()
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message),
      ...(process.env.NODE_ENV === 'production' || !value.stack
        ? {}
        : { stack: redactString(value.stack) }),
    }
  }
  if (depth >= MAX_DEPTH) return '[MAX_DEPTH]'
  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_ITEMS).map(item => sanitize(item, key, depth + 1))
  }
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([childKey, childValue]) => [
        childKey,
        sanitize(childValue, childKey, depth + 1),
      ])
    )
  }

  return String(value)
}

function write(level: LogLevel, event: string, fields: LogFields = {}) {
  const entry = sanitize({
    timestamp: new Date().toISOString(),
    level,
    service: 'onprez',
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
    event,
    ...traceStorage.getStore(),
    ...fields,
  })
  const output = JSON.stringify(entry)

  if (level === 'error') console.error(output)
  else if (level === 'warn') console.warn(output)
  else if (level === 'debug') console.debug(output)
  else console.info(output)
}

export const logger = {
  debug: (event: string, fields?: LogFields) => write('debug', event, fields),
  info: (event: string, fields?: LogFields) => write('info', event, fields),
  warn: (event: string, fields?: LogFields) => write('warn', event, fields),
  error: (event: string, fields?: LogFields) => write('error', event, fields),
}

export function getTraceContext(): TraceContext | undefined {
  return traceStorage.getStore()
}

export function traceHeaders(): Record<string, string> {
  const trace = getTraceContext()
  return trace ? { 'x-request-id': trace.requestId, 'x-correlation-id': trace.correlationId } : {}
}

export async function withRequestLogging<T extends NextResponse>(
  request: NextRequest,
  handler: () => Promise<T>
): Promise<T> {
  const requestId = safeTraceId(request.headers.get('x-request-id')) || crypto.randomUUID()
  const correlationId = safeTraceId(request.headers.get('x-correlation-id')) || requestId
  const context: TraceContext = {
    requestId,
    correlationId,
    method: request.method,
    path: request.nextUrl.pathname,
  }

  return traceStorage.run(context, async () => {
    const startedAt = Date.now()
    logger.info('api.request.started')

    try {
      const response = await handler()
      response.headers.set('x-request-id', requestId)
      response.headers.set('x-correlation-id', correlationId)
      logger.info('api.request.completed', {
        status: response.status,
        durationMs: Date.now() - startedAt,
      })
      return response
    } catch (error) {
      logger.error('api.request.failed', { error, durationMs: Date.now() - startedAt })
      throw error
    }
  })
}
