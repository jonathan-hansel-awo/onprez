# ADR-0001: Use Neon PostgreSQL as the durable system of record

- **Status:** Accepted
- **Date:** 2026-08-04

## Context

OnPrez needs relational consistency across users, businesses, memberships, services, availability,
appointments, payments, publication state, notifications, and audit records. Booking writes and
handle changes also require database transactions, uniqueness constraints, and PostgreSQL advisory
locks. Preview, test, and production data must remain isolated while still supporting normal SQL
operations and recoverable migrations.

## Decision

Use Neon-hosted PostgreSQL as the durable system of record. Application traffic uses the configured
runtime connection, while Prisma Migrate uses a protected direct connection. Development, pull
request, load-test, preview, and production workloads use separate disposable or protected database
branches as appropriate.

Neon stores relational business data and references to provider-owned objects. It does not replace
Cloudinary media bytes, Stripe payment state, or other external provider systems of record.

## Consequences

- Relational constraints, transactions, indexes, and PostgreSQL locking remain available for core
  correctness.
- Database branch isolation fits preview deployments and destructive automated tests.
- Connection limits and pooling must be monitored in serverless workloads.
- Provider availability, restore windows, credentials, and branch lifecycle become operational
  responsibilities.
- PostgreSQL-specific locking and SQL make a move to a non-PostgreSQL store a deliberate migration.

## Alternatives considered

- **SQLite:** simple locally, but unsuitable for the production concurrency, isolation, and
  PostgreSQL-specific locking contracts.
- **Supabase as a combined database/auth platform:** PostgreSQL was viable, but OnPrez does not use
  Supabase authentication and does not need to couple database hosting to auth.
- **Document or key-value databases:** flexible, but weaker for the current relational, transactional,
  and reporting model.
- **Self-managed PostgreSQL:** preserves SQL semantics but adds infrastructure and backup operations
  without a current product advantage.

## Implementation evidence

- [`prisma/schema.prisma`](../../prisma/schema.prisma)
- [`src/lib/prisma.ts`](../../src/lib/prisma.ts)
- [`docs/MIGRATIONS.md`](../MIGRATIONS.md)
- [`docs/operations/BACKUP_RESTORE.md`](../operations/BACKUP_RESTORE.md)
- [`.github/workflows/load-testing.yml`](../../.github/workflows/load-testing.yml)
