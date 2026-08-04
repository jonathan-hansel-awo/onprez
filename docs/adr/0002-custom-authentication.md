# ADR-0002: Own authentication and revocable sessions in the application

- **Status:** Accepted
- **Date:** 2026-08-04

## Context

OnPrez requires email verification, password reset, role-aware business access, revocable sessions,
refresh-token reuse detection, MFA, trusted devices, account activity, and security logging. Tenant
authorisation must be enforced by application-owned business membership records rather than inferred
from a third-party identity token. Earlier Supabase-oriented scaffolding no longer represents the
running system.

## Decision

Use first-party email/password authentication. Passwords are hashed, signed access and refresh JWTs
are stored in secure HTTP-only cookies, and only hashed token values are persisted in PostgreSQL
sessions. Each authenticated request verifies the JWT and its revocable database session before
resolving platform and business roles. Verification, reset, MFA, backup-code, trusted-device, and
security-event flows remain application-owned.

The request proxy is defence in depth; server layouts, route handlers, and reviewed business-access
helpers remain the authoritative authentication and authorisation boundaries.

## Consequences

- Sessions can be revoked per device or account, and refresh-token reuse can invalidate compromised
  sessions.
- Auth behaviour can match OnPrez's tenant, MFA, and audit requirements exactly.
- OnPrez owns credential security, token rotation, abuse controls, account recovery, testing, and
  incident response.
- Adding social or enterprise identity later must integrate with the same session and tenant-access
  boundary rather than bypass it.

## Alternatives considered

- **Supabase Auth:** reduces implementation ownership but would leave two competing session and role
  models and does not match the established application boundary.
- **Auth.js or another session framework:** useful abstractions, but migration would add complexity
  without removing the need for OnPrez-specific revocation, MFA, and business authorisation.
- **Stateless JWT-only sessions:** simpler reads, but cannot provide immediate revocation, device
  management, or refresh-token reuse response.
- **Provider identity as tenant authorisation:** rejected because provider claims do not prove access
  to a particular OnPrez business.

## Implementation evidence

- [`src/lib/auth/session-service.ts`](../../src/lib/auth/session-service.ts)
- [`src/lib/auth/business-access.ts`](../../src/lib/auth/business-access.ts)
- [`src/lib/auth/jwt.ts`](../../src/lib/auth/jwt.ts)
- [`src/app/api/auth`](../../src/app/api/auth)
- [`docs/security/API_ROUTE_ACCESS_MATRIX.md`](../security/API_ROUTE_ACCESS_MATRIX.md)
