# ADR-0003: Deploy the Next.js application on Vercel

- **Status:** Accepted
- **Date:** 2026-08-04

## Context

OnPrez is a Next.js App Router application with server-rendered public pages, route handlers,
image/metadata routes, scheduled endpoints, preview deployments, and a PWA. The team needs a low-
operations deployment path with per-pull-request previews while retaining explicit control over
database migrations and external-provider credentials.

## Decision

Deploy the web application on Vercel using the repository's locked Node and Next.js versions.
Pull requests may receive isolated previews and `main` is the production application source.
Vercel builds application code only: production database migrations run separately through guarded
GitHub Actions using protected Neon credentials.

Long-running or retryable work is represented by durable application records and invoked through
protected scheduled endpoints rather than assumed to remain alive after a serverless response.

## Consequences

- Next.js runtime features and preview deployments require little custom infrastructure.
- Serverless execution limits, cold starts, regional/database latency, and platform quotas must be
  considered in route and job design.
- The application needs connection reuse/pooling and must not depend on process-local durable state.
- Hosting portability is possible but not free because routing, scheduled invocations, previews, and
  build behaviour use Vercel conventions.
- Migration deployment remains observable and approval-gated instead of racing an automatic build.

## Alternatives considered

- **A self-managed Node server:** offers runtime control but adds patching, scaling, deployment, and
  observability work that is not justified at the current stage.
- **Container platforms:** improve workload flexibility but add operational surface while most of the
  product fits the Vercel execution model.
- **Other edge/serverless hosts:** plausible, but Vercel provides the most direct current fit for the
  chosen Next.js features and preview workflow.
- **Running migrations during the Vercel build:** rejected because concurrent builds and rollbacks can
  race or apply production data changes without a protected approval boundary.

## Implementation evidence

- [`next.config.js`](../../next.config.js)
- [`package.json`](../../package.json)
- [`.github/workflows/test.yml`](../../.github/workflows/test.yml)
- [`.github/workflows/migrate.yml`](../../.github/workflows/migrate.yml)
- [`docs/MIGRATIONS.md`](../MIGRATIONS.md)
