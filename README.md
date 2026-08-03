# OnPrez

OnPrez is an online-presence and booking platform for service professionals. A business can claim
one memorable handle, publish a branded page, show its services and availability, accept bookings,
and manage the customer relationship from one dashboard.

The first launch niche is independent beauty and wellness professionals and small teams, while the
underlying product supports a wider range of appointment-led service businesses.

## Start here

- [`CURRENT_STATE.md`](./CURRENT_STATE.md) — canonical product, architecture, version, capability,
  limitation, and documentation overview.
- [`docs/product/FIRST_SELLABLE_USER_LOOP.md`](./docs/product/FIRST_SELLABLE_USER_LOOP.md) — the
  launch-critical user journey.
- [`docs/product/MVP_SCOPE.md`](./docs/product/MVP_SCOPE.md) — current scope boundaries.
- [`docs/CRITICAL_ACTION_PLAN_PROGRESS.md`](./docs/CRITICAL_ACTION_PLAN_PROGRESS.md) — living
  implementation roadmap and evidence tracker.
- [`docs/production/PRODUCTION_READINESS_CHECKLIST.md`](./docs/production/PRODUCTION_READINESS_CHECKLIST.md)
  — manual and automated launch evidence.

Read `CURRENT_STATE.md` before using older feature notes. Files under `docs/archive` are historical
and are not implementation guidance.

## Local setup

### Prerequisites

- Node.js 20
- npm
- PostgreSQL, normally an isolated Neon development branch

### Install and configure

```bash
git clone https://github.com/jonathan-hansel-awo/onprez.git
cd onprez
npm ci
cp .env.example .env.local
```

Replace every required placeholder in `.env.local`. At minimum the application needs database,
JWT, Resend, and Cloudinary values to build and exercise the complete flow. Keep local and preview
credentials isolated from production. See the environment section in
[`CURRENT_STATE.md`](./CURRENT_STATE.md#environment-and-provider-boundaries) and the comments in
[`.env.example`](./.env.example).

Generate the Prisma client and validate the schema:

```bash
npm run db:generate
npm run db:validate
```

Start development:

```bash
npm run dev
```

Open <http://localhost:3000>.

## Required checks

```bash
npm run format:check
npm run lint
npm run type-check
npm run db:validate
npm run privacy:audit
npm run seo:validate
npm run test:pyramid
npm run test:ci
npm run build
```

Playwright and accessibility journeys require a disposable PostgreSQL database and Chromium. Their
isolation and provider-suppression contract is documented in
[`docs/testing/CORE_LOOP_E2E.md`](./docs/testing/CORE_LOOP_E2E.md) and
[`docs/testing/ACCESSIBILITY_TESTING.md`](./docs/testing/ACCESSIBILITY_TESTING.md).

## Deployment

The web application is deployed on Vercel from GitHub. Database migrations are deliberately
separate from `npm run build` and run through guarded GitHub workflows. Do not run production
migrations from a local checkout. See [`docs/MIGRATIONS.md`](./docs/MIGRATIONS.md).
