# ADR-0007: Serialize booking writes and recheck conflicts transactionally

- **Status:** Accepted
- **Date:** 2026-08-04

## Context

Availability shown to two visitors is only a read-time view. Concurrent guest, quick-create, or
multi-day requests can choose the same slot before either write is visible. A preflight availability
check alone therefore permits double booking. Network retries can also repeat a valid request after
the first response is lost.

## Decision

Treat availability queries as guidance and make the database write transaction authoritative. For a
booking mutation, acquire a PostgreSQL transaction-scoped advisory lock keyed by immutable business
ID, re-evaluate overlapping blocking appointments and business rules inside the transaction, then
create the appointment and related customer/idempotency records before releasing the lock.

Accept a bounded business-scoped idempotency key for retryable booking entry points. Reuse the prior
result only when the request fingerprint matches; return a conflict for the same key with different
content. Preserve explicit 409 conflict responses rather than silently choosing another slot.

## Consequences

- Competing writes for one business are serialised, and the final overlap check sees the latest
  committed schedule.
- Different businesses can still book concurrently because the lock scope is per business.
- A popular business's booking writes may queue briefly, so transaction work must stay bounded and
  observable.
- PostgreSQL advisory locking is a deliberate provider/database coupling.
- Every new booking creation path must use the same service boundary; direct appointment writes can
  bypass the invariant.

## Alternatives considered

- **Preflight checks only:** rejected because of the time-of-check/time-of-use race.
- **In-memory or distributed application locks:** harder to make atomic with the database commit and
  unreliable across serverless instances without another coordination system.
- **A unique start-time constraint:** insufficient for variable duration, buffer, resource, status,
  and multi-day overlap rules.
- **Serializable isolation for every booking:** can be correct, but broad retries and contention are
  less explicit than the current per-business critical section.

## Implementation evidence

- [`src/lib/services/booking.ts`](../../src/lib/services/booking.ts)
- [`src/lib/services/multi-day-booking.ts`](../../src/lib/services/multi-day-booking.ts)
- [`src/app/api/bookings/route.ts`](../../src/app/api/bookings/route.ts)
- [`prisma/migrations/20260713003000_add_booking_idempotency/migration.sql`](../../prisma/migrations/20260713003000_add_booking_idempotency/migration.sql)
- [`docs/operations/INCIDENT_RUNBOOKS.md`](../operations/INCIDENT_RUNBOOKS.md)
