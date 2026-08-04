# ADR-0006: Separate immutable tenant identity from public handles

- **Status:** Accepted
- **Date:** 2026-08-04

## Context

Every business needs a memorable public route such as `/{handle}`, but owners may rename or rebrand
their public handle. Internal ownership, memberships, services, appointments, storage paths, audit
records, and authorisation cannot safely change identity when a route string changes. Old shared and
booking URLs must also continue resolving without allowing another tenant to claim the old handle.

## Decision

Use the immutable `Business.id` as the tenant identity and foreign-key boundary. Use the unique,
normalised `Business.slug` as a changeable public routing and branding handle only. All authenticated
business access and owned-resource queries resolve the session's membership and constrain by the
immutable business ID.

When a handle changes, reserve the previous value in business-handle history and permanently redirect
old public and booking routes directly to the current canonical handle. Prevent cycles, chains,
case-only collisions, and cross-business reuse with transactional database constraints and locks.

## Consequences

- Public rebranding does not rewrite tenant foreign keys or media ownership.
- Shared historical URLs remain useful and search engines can converge on one canonical route.
- Handle changes require transactional reservation, cache invalidation, canonical metadata, and
  redirect tests.
- Public handles are identifiers exposed to untrusted callers, never proof of authorisation.
- Retaining old handles reduces the pool of reusable names but prevents impersonation and link theft.

## Alternatives considered

- **Use the handle as the tenant primary key:** superficially simple, but makes rebranding a dangerous
  cross-system identity migration.
- **Make handles immutable:** simplifies routing but conflicts with legitimate business rebranding.
- **Release old handles immediately:** maximises name reuse but enables broken links, impersonation,
  and another tenant inheriting historical traffic.
- **Keep redirect chains:** easy to append, but produces avoidable latency, ambiguity, and SEO drift.

## Implementation evidence

- [`prisma/schema.prisma`](../../prisma/schema.prisma)
- [`src/lib/auth/business-access.ts`](../../src/lib/auth/business-access.ts)
- [`src/lib/business/handle-changes.ts`](../../src/lib/business/handle-changes.ts)
- [`docs/product/HANDLE_CHANGE_REDIRECTS.md`](../product/HANDLE_CHANGE_REDIRECTS.md)
- [`prisma/migrations/20260802000000_business_handle_redirects/migration.sql`](../../prisma/migrations/20260802000000_business_handle_redirects/migration.sql)
