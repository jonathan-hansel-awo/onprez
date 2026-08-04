# ADR-0004: Use Prisma for schema, migrations, and typed data access

- **Status:** Accepted
- **Date:** 2026-08-04

## Context

The application has a large relational model and many tenant-scoped queries. Contributors need one
reviewable schema, generated TypeScript types, ordered production migrations, and an escape hatch for
PostgreSQL-specific correctness operations such as advisory locks. A clean install must generate the
same client version used at runtime.

## Decision

Use Prisma Schema Language as the application data-model source, Prisma Client as the standard typed
query layer, and Prisma Migrate for immutable ordered SQL migrations. Keep the Prisma CLI and runtime
client on the same supported version. Use reviewed parameterised raw SQL only where Prisma does not
express a required PostgreSQL capability.

The active singleton uses the standard Prisma Client. Installed Neon adapter packages are not part of
the runtime boundary until a separate decision and full migration/load/browser validation establish
that change.

## Consequences

- Schema relationships and most queries are typed and discoverable in the TypeScript codebase.
- Generated-client and migration validation become required clean-install and CI gates.
- Prisma abstractions do not remove the need to understand indexes, transactions, query plans, or
  connection behaviour.
- PostgreSQL-specific raw SQL must remain narrow, parameterised, tested, and documented.
- Breaking schema work requires expand-and-contract releases because builds and migrations are
  intentionally separate.

## Alternatives considered

- **Direct SQL everywhere:** maximises database control but increases repetitive mapping and reduces
  shared type safety.
- **Drizzle or another TypeScript ORM:** viable, but migration cost is high and does not solve a
  current product limitation.
- **A Prisma Neon adapter immediately:** could change connection behaviour, but the installed adapter
  is not wired into the application and must not be documented as active without evidence.
- **Schema push in production:** rejected because it does not provide the reviewed, immutable release
  history required for production recovery.

## Implementation evidence

- [`prisma/schema.prisma`](../../prisma/schema.prisma)
- [`prisma/migrations`](../../prisma/migrations)
- [`src/lib/prisma.ts`](../../src/lib/prisma.ts)
- [`docs/MIGRATIONS.md`](../MIGRATIONS.md)
- [`CURRENT_STATE.md`](../../CURRENT_STATE.md#actual-stack-versions)
