from pathlib import Path

path = Path('docs/CRITICAL_ACTION_PLAN_PROGRESS.md')
content = path.read_text()

replacements = {
    '**Audit baseline:** `1226a07`': '**Audit baseline:** `455ad32`',
    '**Next planned item:** P2-017 — Add Core Web Vitals Monitoring': '**Next planned item:** P2-018 — Cache Public Presence Pages by Handle',
    '| Phase 9 — Performance and Scalability                 |        0 |       2 |           2 |      4 |': '| Phase 9 — Performance and Scalability                 |        1 |       2 |           1 |      4 |',
    '| **Total**                                             |   **46** |   **7** |       **8** | **61** |': '| **Total**                                             |   **47** |   **7** |       **7** | **61** |',
    '**Strict completion:** 46 of 61 items — approximately **75%**.  \n**Items with at least meaningful implementation:** 53 of 61 — approximately **87%**.': '**Strict completion:** 47 of 61 items — approximately **77%**.  \n**Items with at least meaningful implementation:** 54 of 61 — approximately **89%**.',
    '1. Complete **P2-017**, then add public-page caching and measured load tests under **P2-018** and **P2-020**. Continue the P2-001 and P2-003 real-user sessions as launch validation.\n2. Optimise image delivery under **P2-019** and review real-user mobile and desktop performance separately after major UI releases.': '1. Merge and deploy **P2-018**, then add measured load tests under **P2-020**. Continue the P2-001 and P2-003 real-user sessions as launch validation.\n2. Optimise image delivery under **P2-019** and review cached public-page performance separately on mobile and desktop after major UI releases.',
}

for old, new in replacements.items():
    if old not in content:
        raise SystemExit(f'Missing tracker text: {old[:80]}')
    content = content.replace(old, new)

old_block = '''- [ ] **P2-017 — Add Core Web Vitals Monitoring** — **Partial — implementation awaiting merge**
  - [PR #127](https://github.com/jonathan-hansel-awo/onprez/pull/127) adds consent-gated production reporting for LCP, INP, CLS, FCP, and TTFB through Next.js `useReportWebVitals`.
  - Measurements use coarse page groups and separate mobile and desktop classes without sending business handles, customer routes, query strings, full URLs, or form data.
  - A strict same-origin endpoint recomputes ratings server-side, records structured metrics with environment and release data, and creates grouped Sentry warnings for poor results.
  - Public and dashboard thresholds are explicit, Google Analytics receives the same dimensions when configured, and `docs/product/WEB_VITALS_MONITORING.md` defines 75th-percentile, release-comparison, and major-UI-change review procedures.
  - Focused tests protect metric coverage, segmentation, thresholds, privacy-safe payloads, server-side rating, validation, and alert behaviour.
  - Mark Complete after PR #127 merges successfully into `main`.

- [ ] **P2-018 — Cache Public Presence Pages by Handle** — **Not started**
  - `src/app/[handle]/page.tsx` is currently `force-dynamic` and performs direct Prisma queries on each request.
  - No handle cache, ISR/revalidation policy, or explicit invalidation architecture was found.
'''

new_block = '''- [x] **P2-017 — Add Core Web Vitals Monitoring** — **Complete**
  - Merged [PR #127](https://github.com/jonathan-hansel-awo/onprez/pull/127) adds consent-gated production reporting for LCP, INP, CLS, FCP, and TTFB through Next.js `useReportWebVitals`.
  - Measurements use coarse page groups and separate mobile and desktop classes without sending business handles, customer routes, query strings, full URLs, or form data.
  - A strict same-origin endpoint recomputes ratings server-side, records structured metrics with environment and release data, and creates grouped Sentry warnings for poor results.
  - Public and dashboard thresholds are explicit, Google Analytics receives the same dimensions when configured, and `docs/product/WEB_VITALS_MONITORING.md` defines 75th-percentile, release-comparison, and major-UI-change review procedures.
  - Focused tests protect metric coverage, segmentation, thresholds, privacy-safe payloads, server-side rating, validation, and alert behaviour.

- [ ] **P2-018 — Cache Public Presence Pages by Handle** — **Partial — implementation awaiting merge**
  - [PR #128](https://github.com/jonathan-hansel-awo/onprez/pull/128) replaces per-request public-route Prisma reads with one handle-scoped cache shared by page rendering and metadata.
  - The cache contains only published business fields, the protected published page snapshot, and published-review aggregates; services and next availability remain live through their public APIs.
  - A five-minute fallback lifetime is paired with immediate tag and rendered-route invalidation after publication, assisted live saves, profile/settings/branding/social updates, and theme changes.
  - Ordinary editor saves remain draft-only and do not invalidate or replace the customer-visible published snapshot.
  - `docs/product/PUBLIC_PRESENCE_CACHE_ACCEPTANCE.md` defines the cache identity, mutation matrix, privacy boundary, operational checks, and future invalidation rule.
  - Focused tests cover key construction, publication filtering, TTL, invalidation, assisted saves, publication changes, and architecture regressions.
  - Mark Complete after PR #128 merges successfully into `main`.
'''

if old_block not in content:
    raise SystemExit('Missing Phase 9 tracker block')

path.write_text(content.replace(old_block, new_block))
