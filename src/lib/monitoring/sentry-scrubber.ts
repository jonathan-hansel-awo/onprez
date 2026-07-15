const FILTERED = '[Filtered]'

const SENSITIVE_KEY =
  /(?:authorization|cookie|credential|password|passcode|secret|token|api[_-]?key|session[_-]?id|customer(?:email|name|note|phone|address)|email|phone|ip[_-]?address|username|notes?)/i
const SENSITIVE_QUERY_PARAM =
  /^(?:authorization|code|credential|password|passcode|secret|token|api[_-]?key|session[_-]?id)$/i
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
const BEARER_TOKEN = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi
const JWT = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g

function scrubString(value: string): string {
  let scrubbed = value.replace(BEARER_TOKEN, `Bearer ${FILTERED}`).replace(JWT, FILTERED)

  try {
    const url = new URL(scrubbed)
    let changed = false

    for (const key of url.searchParams.keys()) {
      if (SENSITIVE_QUERY_PARAM.test(key)) {
        url.searchParams.set(key, FILTERED)
        changed = true
      }
    }

    if (changed) scrubbed = url.toString()
  } catch {
    // Most event strings are not URLs.
  }

  return scrubbed.replace(EMAIL, FILTERED)
}

function scrubValue(value: unknown, seen: WeakSet<object>, depth: number): unknown {
  if (typeof value === 'string') return scrubString(value)
  if (value === null || typeof value !== 'object') return value
  if (depth > 10 || seen.has(value)) return FILTERED

  seen.add(value)

  if (Array.isArray(value)) {
    return value.map(item => scrubValue(item, seen, depth + 1))
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      SENSITIVE_KEY.test(key) ? FILTERED : scrubValue(item, seen, depth + 1),
    ])
  )
}

/**
 * Returns a scrubbed copy of a Sentry event. Request payloads and user identity
 * are removed wholesale; common secrets and contact details are filtered from
 * the remaining structured context and strings.
 */
export function scrubSentryEvent<T>(event: T): T {
  const scrubbed = scrubValue(event, new WeakSet(), 0) as Record<string, unknown>

  delete scrubbed.user

  if (scrubbed.request && typeof scrubbed.request === 'object') {
    const request = scrubbed.request as Record<string, unknown>
    delete request.data
    delete request.cookies
    delete request.query_string
  }

  return scrubbed as T
}
