# OnPrez Current State

**Canonical as of:** 3 August 2026

**Repository:** [`jonathan-hansel-awo/onprez`](https://github.com/jonathan-hansel-awo/onprez)

**Production application:** [onprez.com](https://onprez.com)

**Product phase:** MVP hardening, real-user validation, and pre-monetisation operations

This is the canonical ten-minute orientation for OnPrez. It records what the product is, how the
running system is shaped, what is built or incomplete, and which documents govern current work.
When this file conflicts with an archived guide, this file and the linked executable sources win.

## Ten-minute orientation

| Question                          | Current answer                                                                                                                                                                                               |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| What is OnPrez?                   | A branded online presence with services, availability, booking, and business management under one memorable handle.                                                                                          |
| Who is the first launch audience? | Independent beauty and wellness professionals and small teams. Other appointment-led service categories remain supported.                                                                                    |
| What is the core success path?    | Claim handle → add service → set availability → publish → share → receive booking → manage booking.                                                                                                          |
| Where does it run?                | Next.js on Vercel, backed by Neon PostgreSQL and Prisma.                                                                                                                                                     |
| How is authentication handled?    | Custom email/password authentication with hashed passwords, JWT cookies, database sessions, verification/reset tokens, MFA, trusted devices, and security logging. Supabase is not the active auth provider. |
| Is it production-ready?           | The core loop and automated release gates are built. Real-user evidence, provider/live checks, legal review, and several production-readiness drills remain open.                                            |
| What should be built next?        | Central usage and provider-cost tracking before paid-plan limits (P3-002).                                                                                                                                   |
| Where is the roadmap?             | [`docs/CRITICAL_ACTION_PLAN_PROGRESS.md`](./docs/CRITICAL_ACTION_PLAN_PROGRESS.md), with evidence-gated deferred work in [`docs/product/LATER.md`](./docs/product/LATER.md).                                 |

## Product definition

OnPrez is a stylised short form of **Online Presence**. It is deliberately more than a booking
calendar: the public presence should be credible enough for a business to use as its main web link,
while booking remains native to the page rather than being sent to a disconnected tool.

The current product contract is the
[`first sellable user loop`](./docs/product/FIRST_SELLABLE_USER_LOOP.md). The first launch niche is
defined in [`FIRST_LAUNCH_NICHE.md`](./docs/product/FIRST_LAUNCH_NICHE.md), and scope decisions are
governed by [`MVP_SCOPE.md`](./docs/product/MVP_SCOPE.md).

## Capability status

The status below describes repository evidence. A provider-backed feature can be implemented while
its production account, secret, webhook, OAuth consent, billing, or live-delivery check still needs
operator verification.

### Built

| Area                         | Current capability                                                                                                                                                                                                                             | Primary evidence                                                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Accounts and security        | Signup, email verification, login/logout, password reset, database sessions, account activity, trusted-device controls, TOTP MFA, backup codes, rate limiting, CSRF checks, and security logs.                                                 | `src/lib/auth`, `src/lib/services`, `src/app/api/auth`, `src/app/account`, `src/proxy.ts`                                   |
| Tenancy and teams            | Business-scoped access helpers, OWNER/ADMIN/STAFF/VIEWER roles, invitations, membership management, and platform ADMIN/SUPERADMIN assisted setup.                                                                                              | `src/lib/auth/business-access.ts`, `src/app/api/team`, `src/app/admin`, `docs/security/API_ROUTE_ACCESS_MATRIX.md`          |
| Branded presence             | Template catalogue, realistic demos, draft editing, private preview links, explicit publication snapshots, responsive public rendering, custom branding, canonical URLs, structured data, and durable handle redirects.                        | `src/components/presence`, `src/lib/templates`, `src/app/[handle]`, `docs/product/PRESENCE_PUBLICATION_STATE_ACCEPTANCE.md` |
| Services                     | Service and category CRUD, variants/add-ons, images and galleries, ordering, duplication, active/featured states, duration, price, buffers, preparation, and aftercare data.                                                                   | `src/app/dashboard/services`, `src/app/api/services`, `src/app/api/service-categories`                                      |
| Availability and booking     | Weekly business hours, special dates, timezone-aware slot generation, guest booking, transactional conflict protection, idempotency, approval expiry, rescheduling, cancellation, status transitions, reminders, and calendar views.           | `src/lib/booking`, `src/app/api/availability`, `src/app/api/bookings`, `src/app/api/dashboard/bookings`                     |
| Booking Protection           | Stripe Connect onboarding, deposit checkout, signed/idempotent webhooks, entitlement checks, approval/refund/retention rules, reconciliation, and operational runbooks.                                                                        | `src/lib/stripe`, `src/lib/booking-protection`, `docs/operations/BOOKING_PROTECTION_OPERATIONS.md`                          |
| Customers and inquiries      | Business-scoped customer records, history/stats, search, notes, inquiry capture/replies, and privacy-safe personal-data access.                                                                                                                | `src/app/dashboard/customers`, `src/app/api/dashboard/customers`, `src/app/api/public/inquiries`                            |
| Communications               | Transactional email through Resend, delivery/event history, retry and suppression handling, booking calendar links, browser push subscriptions, preferences, outbox delivery, and deep links.                                                  | `src/lib/email-delivery`, `src/lib/push`, `src/app/api/webhooks/resend`, `public/sw.js`                                     |
| Calendar integration         | Google Calendar OAuth connect/status/disconnect flow and encrypted provider-token handling.                                                                                                                                                    | `src/lib/integrations/google-calendar.ts`, `src/app/api/business/calendar/google`                                           |
| Privacy and lifecycle        | Cookie consent, privacy/legal pages, machine-audited PII inventory, password-verified exports, staged deletion, customer anonymisation, and lifecycle audit evidence.                                                                          | `docs/privacy`, `src/lib/data-lifecycle`, `src/app/account/data`                                                            |
| Operations and observability | Health endpoint, structured request/correlation logging, Sentry integration, uptime workflow, backup/restore and incident runbooks, Web Vitals, email/payment/push operational surfaces.                                                       | `src/lib/observability`, `.github/workflows`, `docs/operations`                                                             |
| PWA                          | Installable manifest, generated icons, service worker, offline fallback, dashboard install guidance, and booking-notification deep links.                                                                                                      | `src/app/manifest.ts`, `src/app/api/pwa`, `src/components/pwa`, `public/sw.js`                                              |
| Quality gates                | Enforced test pyramid, 981 Jest assertions at this baseline, production build, Prisma/privacy/SEO checks, fresh migration and capacity runs, core-loop Playwright, WCAG A/AA axe audits, keyboard/focus checks, and retained failure evidence. | `config/test-pyramid.json`, `.github/workflows/test.yml`, `.github/workflows/e2e.yml`, `.github/workflows/load-testing.yml` |

### Partial or operationally unverified

| Area                     | What exists                                                                                                                               | What remains                                                                                                                                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Real-user validation     | The seven-step loop, completion telemetry, niche protocol, and browser proof exist.                                                       | Record at least three unassisted fresh-account sessions under ten minutes and the niche evidence sessions described in the product contracts.                                                     |
| Production readiness     | Automated security, quality, accessibility, migration, load, and preview checks exist.                                                    | Complete and date the manual provider, secret, restore, live-delivery, browser/device, incident, legal, and operational evidence in `docs/production/PRODUCTION_READINESS_CHECKLIST.md`.          |
| Provider-backed delivery | Resend, Stripe, Cloudinary, Google Calendar, Sentry, Analytics, and Web Push integrations are implemented.                                | Verify each required production credential, webhook, OAuth consent, cron, domain, account permission, billing alert, and live smoke test outside the repository.                                  |
| Plans and entitlements   | Free (£0), Professional (£8), and Business (£20) value propositions are published; booking deposits have an explicit feature entitlement. | Do not enforce service, media, booking, or fair-use plan limits until P3-002 records usage and provider cost centrally. Subscription billing is not the current plan-enforcement source of truth. |
| Analytics                | Consented Google Analytics hooks, first-sellable-loop progress, dashboard metrics, Web Vitals, and operational reports exist.             | Broader commercial analytics, referral attribution, and provider-cost reporting remain intentionally limited or deferred.                                                                         |
| Legal assurance          | Privacy, cookie, and terms pages plus engineering privacy controls exist.                                                                 | Professional legal review and a current processor/DPA record remain launch-operator responsibilities.                                                                                             |

### Planned next

1. **P3-002 — Usage before limits:** add a central usage ledger and admin overhead dashboard for
   media storage/delivery, emails, bookings, provider-cost estimates, and thresholds before paid
   plan enforcement.
2. **Evidence-gated later queue:** native mobile apps, custom domains, SMS, public APIs/webhooks,
   campaigns, advanced analytics, referral tooling, and broader workforce tools remain in
   [`docs/product/LATER.md`](./docs/product/LATER.md) until their stated triggers are met.

### Deprecated, legacy, or not active

| Item                                                            | Current rule                                                                                                                                                                |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase authentication variables/helpers                       | Legacy scaffolding only. The active system is custom authentication backed by PostgreSQL. Do not add Supabase credentials for normal OnPrez operation.                      |
| UploadThing and Twilio environment fields                       | Reserved legacy schema entries without an active product integration. Cloudinary is the active media provider; SMS is deferred.                                             |
| `npm run db:seed` and the old demo accounts                     | Not part of the current repository. Use purpose-built synthetic Jest, Playwright, or load-test fixtures and never seed a shared/production database.                        |
| Next.js 14 and “future database/auth/provider milestone” claims | Obsolete. The locked versions and built capabilities below are authoritative.                                                                                               |
| Old landing-page manual checklist                               | Replaced by the testing strategy, browser core-loop gate, accessibility gate, SEO validator, and production-readiness checklist.                                            |
| `docs/archive/**`                                               | Historical context only. Archived documents are explicitly non-normative and must not be linked as current setup guidance.                                                  |
| Neon adapter packages                                           | Installed, but `src/lib/prisma.ts` currently constructs the standard Prisma Client. Do not assume the adapter is active without changing and testing that runtime boundary. |

## Actual stack versions

Versions are the resolved values in `package-lock.json`, not marketing labels or semver ranges. Node
20 is the runtime enforced by GitHub workflows. Update this table in the same pull request as a
critical dependency upgrade.

| Layer                  | Resolved version / provider | Notes                                                                                                     |
| ---------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------- |
| Node.js                | `20`                        | CI and supported project runtime.                                                                         |
| Next.js                | `16.2.12`                   | App Router, route handlers, proxy, metadata, image and PWA routes.                                        |
| React / React DOM      | `18.3.1`                    | Client components and server-rendered application UI.                                                     |
| TypeScript             | `5.9.3`                     | Strict compile-time checks via `npm run type-check`.                                                      |
| Tailwind CSS           | `4.1.17`                    | PostCSS-based application styling.                                                                        |
| Prisma CLI             | `6.19.3`                    | Schema validation, client generation, and migrations. Kept aligned with the runtime client.               |
| Prisma Client          | `6.19.3`                    | Current application runtime client. This mixed Prisma baseline must be validated as a unit when upgraded. |
| Prisma Neon adapter    | `7.9.1`                     | Installed dependency; not wired into the active Prisma singleton.                                         |
| Neon serverless driver | `1.1.0`                     | Installed PostgreSQL provider library.                                                                    |
| Zod                    | `4.4.3`                     | Request and configuration validation.                                                                     |
| Jest / jsdom           | `30.2.0` / `30.2.0`         | Unit, component, integration, and contract tests.                                                         |
| Playwright             | `1.62.1`                    | Chromium core-loop and accessibility journeys.                                                            |
| axe Playwright         | `4.12.1`                    | WCAG A/AA automated audits, including colour contrast.                                                    |
| Sentry Next.js SDK     | `10.69.0`                   | Client, server, and edge error monitoring.                                                                |
| Resend                 | `6.18.1`                    | Transactional email provider SDK.                                                                         |
| Stripe                 | `22.4.0`                    | Stripe Connect, checkout, webhook, refund, and reconciliation SDK.                                        |
| Cloudinary             | `2.10.0`                    | Active media storage/delivery SDK; `next-cloudinary` is `6.17.5`.                                         |
| Framer Motion          | `11.18.2`                   | UI motion with reduced-motion accessibility handling.                                                     |

The installed Neon adapter remains on Prisma 7 but is not imported by the application. The active
CLI and runtime client are both Prisma 6.19.3. A future adapter migration must change that runtime
boundary deliberately and keep generation, validation, build, migration replay, schema comparison,
tests, and the isolated browser/load workflows green.

## Architecture

Durable architectural choices and their trade-offs are recorded in the
[`Architecture Decision Record index`](./docs/adr/README.md). When an accepted boundary changes,
add a superseding ADR instead of rewriting the original decision.

### Runtime topology

1. **Browser/PWA:** public presence and booking pages, authenticated dashboard/account/admin pages,
   cookie consent, service worker, push subscriptions, and client-side interactions.
2. **Next.js application on Vercel:** App Router server/client components and route handlers.
   `src/proxy.ts` supplies request IDs, correlation IDs, CSRF checks for unsafe API requests, and a
   first protected-page cookie gate. Server layouts and handlers perform authoritative auth.
3. **Domain and integration services:** reusable auth, booking, presence, payment, notification,
   privacy, SEO, upload, and observability logic under `src/lib`.
4. **Persistence:** Prisma accesses PostgreSQL. Neon supplies separated development/preview and
   production databases; migrations are immutable, ordered SQL under `prisma/migrations`.
5. **External providers:** Cloudinary for media, Resend for email, Stripe Connect for booking
   deposits, Google OAuth/Calendar for calendar integration, browser push services for Web Push,
   Sentry for error monitoring, and consent-gated Google Analytics/Web Vitals reporting.

### Trust and tenancy boundaries

- Public endpoints return explicit published/business-safe fields and never rely on a supplied
  object ID as proof of access.
- Authenticated handlers resolve the server session and then the caller's business role. Every
  business-owned lookup must include `businessId` or use a reviewed business-access helper.
- The proxy is defence in depth, not the final authorisation boundary.
- Passwords, verification/reset tokens, session tokens, backup codes, and provider tokens use
  hashing, peppering, or encryption appropriate to their recovery needs. Secrets remain server-side.
- The canonical route classifications and role expectations live in
  [`docs/security/API_ROUTE_ACCESS_MATRIX.md`](./docs/security/API_ROUTE_ACCESS_MATRIX.md).

### Booking write path

1. The guest submits business, service, local date/time, contact details, and the policy decision.
2. The route validates size/format, applies rate limiting, verifies that the business and active
   service match, and converts the local time with the business timezone.
3. The booking service performs conflict/idempotency checks inside the database write boundary and
   creates or reuses the business-scoped customer.
4. When an entitled deposit is required, Stripe checkout and signed webhook reconciliation update
   explicit booking-payment state; external failures do not silently fabricate booking success.
5. Email and push work is recorded/delivered through tracked boundaries so retry state is inspectable.

### Presence publication path

- Editors write a private draft. Preview links are signed, revocable, non-indexable, and no-store.
- Publishing creates the explicit public snapshot consumed by the canonical renderer.
- Public reads use cache tags and only published state. Mutations invalidate the affected current and
  historical handle routes.
- Handle changes reserve history and resolve old public/booking URLs directly to the current handle
  with a permanent redirect, without chains.

### Deployment and data change path

- Pull requests run security, formatting, lint, TypeScript, Prisma, privacy, SEO, Jest, build,
  disposable-database load, core-loop browser, and accessibility workflows as applicable.
- Vercel builds application code; `npm run build` never applies database migrations.
- Production migrations run from `main` through guarded GitHub workflows using protected direct
  database credentials. Applied migrations are never edited; fixes use forward migrations.
- Operational evidence that cannot be automated is recorded in the production-readiness checklist
  and the relevant runbook.

## Repository map

| Path                            | Responsibility                                                                                |
| ------------------------------- | --------------------------------------------------------------------------------------------- |
| `src/app`                       | Pages, layouts, metadata, route handlers, webhooks, cron routes, and PWA endpoints.           |
| `src/components`                | Landing, dashboard, booking, presence, form, privacy, PWA, and shared UI components.          |
| `src/lib`                       | Domain rules, auth, tenancy, booking, integrations, privacy, uploads, SEO, and observability. |
| `src/data`                      | Pricing, demos, template catalogue, and static product data.                                  |
| `prisma/schema.prisma`          | Current relational data model and constraints.                                                |
| `prisma/migrations`             | Ordered immutable database history.                                                           |
| `__tests__`, `src/**/__tests__` | Jest unit, component, integration, and contract evidence.                                     |
| `e2e`                           | Real Chromium core-loop and WCAG journeys.                                                    |
| `.github/workflows`             | Quality, security, migrations, privacy, load, browser, restore, and uptime automation.        |
| `docs`                          | Current product contracts, runbooks, testing, privacy, security, and roadmap evidence.        |
| `docs/archive`                  | Clearly labelled historical material; never current guidance.                                 |

## Environment and provider boundaries

Copy `.env.example` to `.env.local` and replace placeholders. Never copy a production secret into a
local file, test fixture, issue, PR, screenshot, or retained artifact.

| Group          | Canonical variables                                                                | Rule                                                                                                                                 |
| -------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Application    | `APP_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_NAME`                           | Set canonical origins explicitly outside local development.                                                                          |
| Database       | `DATABASE_URL`, `DIRECT_URL`                                                       | Runtime uses the pooled/application URL; migrations use the protected direct URL. Local/CI databases must be disposable or isolated. |
| Authentication | `JWT_SECRET`, verification/reset peppers, MFA key/peppers, trusted-device pepper   | Use independent high-entropy values per environment. Rotate with a reviewed session/token impact plan.                               |
| Email          | `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, sender/support values                   | Verify the sending domain and signed webhook before live use.                                                                        |
| Media          | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cloud name is public; key/secret remain server-only.                                                                                 |
| Payments       | Stripe secret, publishable key, and webhook secret                                 | Enable Booking Protection only after Connect, webhook, refund, and low-value live checks pass.                                       |
| Calendar       | Google client, secret, redirect URI, and token-encryption key                      | Redirect URI must match the provider; encrypted tokens are server-side only.                                                         |
| Push           | VAPID public/private keys, subject, and `CRON_SECRET`                              | Keep one stable keypair across deployments; the cron secret protects delivery/approval routes.                                       |
| Monitoring     | Sentry DSNs/project/auth/release values and optional consented GA ID               | Browser-exposed values are limited to documented public identifiers. Sentry auth remains build/server-only.                          |

`.env.example` is the committed name inventory. Runtime schemas and provider modules remain the
executable authority for validation. External production configuration is intentionally not stored
in Git.

## Testing and release evidence

The canonical policy is [`docs/testing/TESTING_STRATEGY.md`](./docs/testing/TESTING_STRATEGY.md),
backed by `config/test-pyramid.json`.

| Evidence                        | Command / workflow                                                                |
| ------------------------------- | --------------------------------------------------------------------------------- |
| Formatting, lint, TypeScript    | `npm run format:check`, `npm run lint`, `npm run type-check`                      |
| Prisma schema                   | `npm run db:validate`                                                             |
| Privacy and SEO contracts       | `npm run privacy:audit`, `npm run seo:validate`                                   |
| Test inventory and layer policy | `npm run test:pyramid`                                                            |
| Full Jest suite                 | `npm run test:ci`                                                                 |
| Production build                | `npm run build`                                                                   |
| Core-loop browser               | `npm run test:e2e -- e2e/core-loop.spec.ts` with isolated PostgreSQL and Chromium |
| WCAG browser audit              | `npm run test:a11y` with the same isolation                                       |
| Capacity/concurrency            | `.github/workflows/load-testing.yml` against disposable PostgreSQL                |

Never point Jest, Playwright, migrations, load tests, repair scripts, or seed-like helpers at
production. Provider deliveries are suppressed in isolated browser/load runs.

## Canonical documentation map

| Need                             | Source of truth                                                                                            |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Current product and architecture | **This document**, especially [`Architecture`](#architecture)                                              |
| Architecture decisions           | [`docs/adr/README.md`](./docs/adr/README.md)                                                               |
| Roadmap and completion evidence  | [`docs/CRITICAL_ACTION_PLAN_PROGRESS.md`](./docs/CRITICAL_ACTION_PLAN_PROGRESS.md)                         |
| Current MVP scope                | [`docs/product/MVP_SCOPE.md`](./docs/product/MVP_SCOPE.md)                                                 |
| Evidence-gated deferred work     | [`docs/product/LATER.md`](./docs/product/LATER.md)                                                         |
| First commercial loop            | [`docs/product/FIRST_SELLABLE_USER_LOOP.md`](./docs/product/FIRST_SELLABLE_USER_LOOP.md)                   |
| Production acceptance            | [`docs/production/PRODUCTION_READINESS_CHECKLIST.md`](./docs/production/PRODUCTION_READINESS_CHECKLIST.md) |
| Database change process          | [`docs/MIGRATIONS.md`](./docs/MIGRATIONS.md)                                                               |
| Environment names                | [`.env.example`](./.env.example) and runtime validation sources                                            |
| Test ownership and gates         | [`docs/testing/TESTING_STRATEGY.md`](./docs/testing/TESTING_STRATEGY.md)                                   |
| Privacy/data map                 | [`docs/privacy/PII_HANDLING_REVIEW.md`](./docs/privacy/PII_HANDLING_REVIEW.md) and `PII_INVENTORY.json`    |
| API access policy                | [`docs/security/API_ROUTE_ACCESS_MATRIX.md`](./docs/security/API_ROUTE_ACCESS_MATRIX.md)                   |
| Historical documents             | [`docs/archive/README.md`](./docs/archive/README.md) — non-normative                                       |

Feature-specific acceptance documents and operational runbooks remain authoritative within their
narrow boundary. Historical implementation notes do not override the current architecture, schema,
tests, or tracker.

## Known limitations and update rules

- Repository evidence cannot prove live provider configuration, billing, consent approval, DNS,
  secret rotation, backup retention, or successful real-world drills.
- The public legal pages are operational drafts, not a substitute for professional legal review.
- Plan limits are promises, not centrally measured enforcement, until P3-002 is complete.
- Human MVP and niche validation logs are still pending.
- An unused Prisma 7 Neon adapter remains installed alongside the active Prisma 6 CLI/client, and
  legacy/reserved configuration fields remain in the environment schema. Treat both as explicit
  maintenance debt, not architecture guidance.

Update `CURRENT_STATE.md` in the same pull request when any of these changes:

1. a critical locked stack version or runtime changes;
2. a provider, persistence, auth, publication, booking, payment, or deployment boundary changes;
3. a capability moves between built, partial, planned, deprecated, or removed;
4. a canonical document moves or is superseded; or
5. the next roadmap item changes materially.

Prefer links to executable sources and narrowly owned acceptance documents over copying long-lived
details here. Archive superseded documents with a warning banner instead of leaving contradictory
guidance active.

When a change reverses or materially alters an accepted architectural decision, add a new ADR and
supersede the old record in the same pull request.
