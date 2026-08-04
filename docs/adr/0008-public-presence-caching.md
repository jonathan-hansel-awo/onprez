# ADR-0008: Cache only published presence reads with explicit invalidation

- **Status:** Accepted
- **Date:** 2026-08-04

## Context

Public presence pages are read frequently and combine business, published page, service, hours,
review, and handle-redirect data. Caching can reduce database traffic and improve public response
times, but stale private drafts, permissions, live availability, account data, or booking state would
create correctness and privacy failures. Handle changes and publication mutations also need prompt
route convergence.

## Decision

Cache only the business-safe published presence snapshot and public handle redirects. Key entries by
normalised public handle, use a five-minute upper-bound revalidation period, and tag them for targeted
mutation-driven invalidation. Invalidate current and historical handles and their rendered paths when
publication, branding, services, business settings, or handles change.

Do not cache authenticated business data, private previews/drafts, account data, availability,
booking mutations, or provider-token responses. Those paths use request-time authorisation and
`no-store` semantics where applicable. Cache invalidation failure is reported but does not turn an
already successful durable mutation into an apparent failure.

## Consequences

- Popular public pages avoid repeating the full relational read on every request.
- Public content can remain stale for up to the fallback revalidation period if targeted invalidation
  is unavailable.
- Every mutation affecting public output must participate in the invalidation contract.
- Cache keys and tags must use normalised handles and include retained historical routes.
- Live booking correctness continues to come from uncached availability reads and transactional
  writes, not the public page cache.

## Alternatives considered

- **Cache every read:** rejected because private, tenant-scoped, live availability, and account state
  require fresh authorisation or correctness.
- **Never cache public presence:** simplest consistency model, but repeats an avoidable multi-query read
  and increases database/provider cost.
- **Long TTL without invalidation:** operationally simple but makes owner edits and handle changes
  visibly stale for too long.
- **Process-local maps:** not coherent or durable across serverless instances and deployments.

## Implementation evidence

- [`src/lib/presence/public-presence-cache.ts`](../../src/lib/presence/public-presence-cache.ts)
- [`src/app/[handle]/page.tsx`](../../src/app/%5Bhandle%5D/page.tsx)
- [`src/lib/booking/public-booking.ts`](../../src/lib/booking/public-booking.ts)
- [`docs/product/PUBLIC_PRESENCE_CACHE_ACCEPTANCE.md`](../product/PUBLIC_PRESENCE_CACHE_ACCEPTANCE.md)
- [`docs/product/PRIVATE_DRAFT_PREVIEW_ACCEPTANCE.md`](../product/PRIVATE_DRAFT_PREVIEW_ACCEPTANCE.md)
