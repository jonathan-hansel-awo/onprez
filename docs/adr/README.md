# Architecture Decision Records

Architecture Decision Records (ADRs) preserve the reasoning behind OnPrez's durable technical
boundaries. They complement [`CURRENT_STATE.md`](../../CURRENT_STATE.md): the current-state guide
describes the system contributors operate today, while ADRs explain why important choices were
made and which trade-offs must be reconsidered before changing them.

## Lifecycle

Every numbered ADR has one of these statuses:

- **Proposed** — under review and not yet an architectural contract.
- **Accepted** — the current decision. Implementation should remain consistent with it.
- **Superseded** — replaced by a newer ADR; the replacement must be linked from the old record.
- **Deprecated** — retained for history but no longer recommended, without a direct replacement.

Accepted records are historical documents. Do not rewrite their reasoning after the architecture
changes. Add a new numbered ADR, mark the old record superseded or deprecated, and link the two.
Corrections that do not change the decision—such as broken evidence links or spelling—may be made
in place.

## Required record shape

Every ADR must include:

1. a numbered title matching its filename;
2. an ISO decision date and lifecycle status;
3. **Context**, **Decision**, **Consequences**, **Alternatives considered**, and
   **Implementation evidence** sections; and
4. an entry in the index below.

## Index

| ADR                                                          | Decision                                                       | Status   |
| ------------------------------------------------------------ | -------------------------------------------------------------- | -------- |
| [ADR-0001](./0001-neon-postgresql.md)                        | Use Neon PostgreSQL as the durable system of record            | Accepted |
| [ADR-0002](./0002-custom-authentication.md)                  | Own authentication and revocable sessions in the application   | Accepted |
| [ADR-0003](./0003-vercel-deployment.md)                      | Deploy the Next.js application on Vercel                       | Accepted |
| [ADR-0004](./0004-prisma-data-access.md)                     | Use Prisma for schema, migrations, and typed data access       | Accepted |
| [ADR-0005](./0005-cloudinary-media.md)                       | Store and deliver tenant media through Cloudinary              | Accepted |
| [ADR-0006](./0006-business-identity-and-public-handles.md)   | Separate immutable tenant identity from public handles         | Accepted |
| [ADR-0007](./0007-transactional-booking-conflict-control.md) | Serialize booking writes and recheck conflicts transactionally | Accepted |
| [ADR-0008](./0008-public-presence-caching.md)                | Cache only published presence reads with explicit invalidation | Accepted |
