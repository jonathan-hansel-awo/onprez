# Critical Path Load Testing

## Purpose

P2-020 establishes a repeatable capacity baseline for the customer-facing paths most likely to affect discovery, sign-in, availability, and booking correctness. The suite runs against a production Next.js build backed by an isolated PostgreSQL 16 service in GitHub Actions. It is deliberately unable to target a remote host or non-local database.

## Covered paths and release baseline

| Critical path               | Baseline workload                               | Release gate                                                    |
| --------------------------- | ----------------------------------------------- | --------------------------------------------------------------- |
| Cached public presence page | 12 workers × 8 requests after one warm-up       | Error rate ≤ 1%, p95 ≤ 1,000 ms, throughput ≥ 8 requests/second |
| Availability calculation    | 8 workers × 5 requests for one service and date | Error rate ≤ 1%, p95 ≤ 1,500 ms, throughput ≥ 4 requests/second |
| Handle availability         | 21 requests from one synthetic client           | First 20 return 200, request 21 returns 429, p95 ≤ 1,500 ms     |
| Login                       | 6 valid requests from one synthetic client      | First 5 succeed, request 6 returns 429, p95 ≤ 4,000 ms          |
| Concurrent booking conflict | 5 simultaneous requests for the same slot       | Exactly 1 returns 201, exactly 4 return 409, p95 ≤ 4,000 ms     |

These gates are intentionally modest launch baselines, not a claim about production capacity. GitHub runner CPU, an in-runner PostgreSQL instance, Vercel networking, Neon pooling, regional latency, and provider delivery all differ from production. Raise a gate only after several passing reports and a documented reason; never weaken booking correctness.

## Reproducible measured baseline

The `Critical path load tests` workflow builds the selected revision, deploys all migrations to a disposable database, creates synthetic `.invalid` fixtures, runs the five scenarios, and uploads JSON and Markdown reports for 90 days. Each report records request counts, status counts, throughput, p50, p95, p99, and threshold failures.

The latest passing workflow artifact for a release is the measured repository baseline. Record its workflow URL, commit SHA, runner image, and report values in the release evidence. Do not copy a result from a different commit and do not describe the isolated-runner measurement as live production capacity.

## Known bottlenecks and expected controls

- Public presence performance depends on the handle-scoped published-page cache. The warm scenario detects cache regressions without confusing draft data with the public snapshot.
- Availability performs database reads followed by timezone-aware slot calculation. Its lower throughput and higher p95 allowance reflect that work; new query or calculation growth must remain visible in the report.
- Password verification is intentionally CPU-expensive, while login and handle checks are intentionally capped by atomic database-backed rate limits. The suite verifies both useful work and the protective ceiling.
- Booking writes are intentionally serialized per business by a PostgreSQL advisory transaction lock. Lower write throughput is acceptable; more than one successful appointment for the same slot is not.
- Booking notification delivery and provider latency are not capacity-tested here. A CI-only flag suppresses external side effects only when `APP_URL` is local; provider delivery has separate monitoring and operational drills.

## Running locally

Use only a disposable local PostgreSQL database. The seed and runner both reject remote targets.

```bash
export DATABASE_URL='postgresql://onprez:onprez@127.0.0.1:5432/onprez_load_test'
export DIRECT_URL="$DATABASE_URL"
export LOAD_TEST_BASE_URL='http://127.0.0.1:3000'

npm ci
npm run db:migrate:deploy
npm run load-test:seed
npm run build
npm run start -- -H 127.0.0.1 -p 3000
# In another shell:
npm run load-test:critical
```

Reports are written to `artifacts/load-tests/` by default. The generated fixture contains only synthetic credentials and identifiers and is excluded from uploaded workflow artifacts.

## Interpreting failures

1. Confirm the isolated database and application started cleanly.
2. Compare p95, throughput, and status counts with the last passing report for the same scenario.
3. Inspect application logs for slow queries, cache misses, event-loop pressure, and rate-limit anomalies.
4. Treat any booking result other than one `201` plus four `409` responses as a correctness incident, even when latency gates pass.
5. Document the bottleneck and remediation in the pull request. Re-run the same commit before changing a threshold.

## Production safety

The automated suite does not exercise production, Vercel previews, Neon branches, Resend, Stripe, Cloudinary, or real users. Its remote-target guards and local-only external-side-effect suppression are deliberate safety controls. Any remote or production load test requires a separate approved plan covering traffic limits, provider costs, test data, rollback, monitoring, and cleanup.
