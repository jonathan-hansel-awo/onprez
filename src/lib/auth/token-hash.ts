import { createHash } from 'crypto'

/**
 * Produce a deterministic lookup value for an opaque bearer token.
 * Only this digest is persisted; the raw token remains client-side.
 */
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
