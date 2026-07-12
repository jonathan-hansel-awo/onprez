/**
 * Reads both the standard API error envelope and legacy error responses.
 * Legacy support can be removed after all clients and routes use the envelope.
 */
export function getApiErrorMessage(
  value: unknown,
  fallback = 'Something went wrong. Please try again.'
): string {
  if (!value || typeof value !== 'object') return fallback

  const response = value as Record<string, unknown>

  if (response.error && typeof response.error === 'object') {
    const message = (response.error as Record<string, unknown>).message
    if (typeof message === 'string' && message.length > 0) return message
  }

  if (typeof response.message === 'string' && response.message.length > 0) {
    return response.message
  }

  if (typeof response.error === 'string' && response.error.length > 0) {
    return response.error
  }

  return fallback
}
