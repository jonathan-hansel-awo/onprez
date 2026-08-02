# Core Loop Browser E2E

## Acceptance boundary

`e2e/core-loop.spec.ts` is the launch-blocking browser proof for OnPrez's first sellable loop. One
professional browser and a separate guest browser context complete the following durable journey:

1. claim a unique handle and create an account;
2. verify the email address through the real verification page and API;
3. sign in and open all business hours;
4. create an active service;
5. publish the presence page and mark its link shared;
6. visit the published page and book an available time as a guest;
7. find and cancel that booking as the professional; and
8. assert the tenant-scoped first-sellable-loop record reports all seven milestones within the
   8 minute 45 second product target.

The verification fixture changes only the synthetic token hash so the private test can open a
known link. It never sets `emailVerified`, publishes a page, creates a booking, or completes a
milestone directly in the database.

## Isolation and provider safety

The suite refuses any `DATABASE_URL` whose host is not `localhost`, `127.0.0.1`, or `::1`. CI creates
an empty PostgreSQL 16 database, replays the full migration history, and checks it against
`schema.prisma` before the browser starts. All fixture addresses use the reserved `.invalid` domain,
and deleting the synthetic user cascades the owned business and journey data after the run.

Outbound email is suppressed only when `LOAD_TEST_DISABLE_EXTERNAL_SIDE_EFFECTS=true` and `APP_URL`
is a loopback URL. The Playwright-managed local server and CI workflow set this boundary. No
production, preview or shared database is permitted, and no production personal data belongs in a
fixture or artifact.

## Local run

Create a disposable PostgreSQL database and export both Prisma URLs to it. Generate fresh local
values rather than reusing application secrets:

```bash
export DATABASE_URL='postgresql://onprez@127.0.0.1:5432/onprez_e2e'
export DIRECT_URL="$DATABASE_URL"
export JWT_SECRET="$(openssl rand -hex 32)"
export EMAIL_VERIFICATION_TOKEN_PEPPER="$(openssl rand -hex 32)"
npm run db:migrate:deploy
npx playwright install chromium
npm run test:e2e
```

Playwright starts the development server when `PLAYWRIGHT_EXTERNAL_SERVER` is absent. To test an
already-running local production build, set `PLAYWRIGHT_EXTERNAL_SERVER=true` and
`PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000`; the external server must separately set
`LOAD_TEST_DISABLE_EXTERNAL_SIDE_EFFECTS=true` and the same loopback `APP_URL`.

## CI and failure triage

`.github/workflows/e2e.yml` runs on pull requests, `main`, a daily schedule and manual dispatch.
The workflow uses a production build, Chromium and one worker to preserve deterministic state. It
uploads `artifacts/playwright` for 30 days even on success.

When the workflow fails:

1. inspect `server.log` for route, database and runtime failures;
2. open the HTML report and the failed step's screenshot;
3. use the retained trace to inspect browser actions, network responses and console errors;
4. use video only when timing or animation matters; and
5. reproduce on a disposable local database and fix the product, fixture or selector at its cause.

Do not approve a release by rerunning a flaky failure, adding a skip, weakening the journey, or
changing the test to mutate a completed state directly.
