from pathlib import Path

path = Path('docs/CRITICAL_ACTION_PLAN_PROGRESS.md')
text = path.read_text()
original = text

replacements = {
    '**Audit baseline:** `f9a495a`': '**Audit baseline:** `1226a07`',
    '**Current working phase:** Phase 7 — Dashboard UX': '**Current working phase:** Phase 9 — Performance and Scalability',
    '**Next planned item:** P2-011 — Add Better Preview Workflows': '**Next planned item:** P2-017 — Add Core Web Vitals Monitoring',
    '| Phase 7 — Dashboard UX                                |        2 |       2 |           0 |      4 |': '| Phase 7 — Dashboard UX                                |        4 |       0 |           0 |      4 |',
    '| Phase 8 — Trust, Positioning, and Marketing Integrity |        2 |       2 |           0 |      4 |': '| Phase 8 — Trust, Positioning, and Marketing Integrity |        4 |       0 |           0 |      4 |',
    '| **Total**                                             |   **42** |  **11** |       **8** | **61** |': '| **Total**                                             |   **46** |   **7** |       **8** | **61** |',
    '**Strict completion:** 42 of 61 items — approximately **69%**.': '**Strict completion:** 46 of 61 items — approximately **75%**.',
    '1. Complete **P2-011** and **P2-012** to finish Phase 7. Continue the P2-001 and P2-003 real-user sessions as launch validation.': '1. Complete **P2-017**, then add public-page caching and measured load tests under **P2-018** and **P2-020**. Continue the P2-001 and P2-003 real-user sessions as launch validation.',
    '2. Remove or clearly label the remaining fabricated homepage activity and testimonial claims under **P2-013** and **P2-016**.': '2. Optimise image delivery under **P2-019** and review real-user mobile and desktop performance separately after major UI releases.',
    '3. Add public-page caching and measured load tests before growth work under Phase 9.': '3. Complete the remaining privacy, testing-maturity, and canonical architecture documentation gaps before paid scale.',
    '4. Complete the remaining privacy, testing-maturity, and canonical architecture documentation gaps before paid scale.': '4. Add usage and provider-cost tracking before enforcing paid-plan limits.',
}

for old, new in replacements.items():
    if old not in text:
        raise SystemExit(f'Missing tracker text: {old}')
    text = text.replace(old, new)

old_p2011 = '''- [ ] **P2-011 — Add Better Preview Workflows** — **Partial — implementation awaiting merge**
  - The editor includes real mobile and desktop rendering modes, and the same canonical renderer is reused across examples, editor previews, saved drafts, and public pages.
  - [PR #124](https://github.com/jonathan-hansel-awo/onprez/pull/124) adds an authenticated copy-preview-link action and a private route that renders the latest saved draft through the canonical renderer.
  - Preview links are signed to one business, page, and publication version, expire after 24 hours, become invalid after publishing, and receive no-cache, no-index, and no-referrer controls.
  - The private route carries explicit draft metadata and disables booking and inquiry creation while preserving genuine services, theme, contact data, and trust signals.
  - Mark Complete after PR #124 merges successfully into `main`.
'''
new_p2011 = '''- [x] **P2-011 — Add Better Preview Workflows** — **Complete**
  - Merged [PR #124](https://github.com/jonathan-hansel-awo/onprez/pull/124) adds an authenticated copy-preview-link action and a private route that renders the latest saved draft through the canonical presence renderer.
  - Preview links are signed to one business, page, and publication version, expire after 24 hours, and become invalid automatically when publishing increments the page version.
  - The private preview preserves real services, theme, contact data, and genuine trust signals while disabling booking and inquiry creation.
  - Private responses use no-cache, no-index, and no-referrer controls, and focused tests cover authorization, expiry, invalidation, and response headers.
  - `docs/product/PRIVATE_DRAFT_PREVIEW_ACCEPTANCE.md` distinguishes immediate editor preview, shareable saved-draft preview, and the live customer snapshot.
'''

old_p2012 = '''- [ ] **P2-012 — Simplify Dashboard Navigation** — **Partial**
  - Mobile and desktop navigation, collapsible sidebar behaviour, accessible touch targets, and breadcrumbs are implemented.
  - The current top-level navigation still exposes Overview, Presence, Services, Bookings, Customers, Inquiries, Analytics, Sharing, and Settings as one flat list.
  - Remaining: group routes by intent, reduce the primary list, and move advanced/low-frequency destinations deeper without breaking discoverability.
'''
new_p2012 = '''- [x] **P2-012 — Simplify Dashboard Navigation** — **Complete**
  - Merged [PR #125](https://github.com/jonathan-hansel-awo/onprez/pull/125) reduces the always-visible navigation to five core destinations grouped under Daily work and Your presence.
  - Inquiries, Analytics, Sharing, and Settings remain available behind one accessible More tools disclosure that automatically opens for an active advanced route.
  - The mobile drawer, desktop collapse behaviour, breadcrumbs, 44-pixel touch targets, `aria-current`, and disclosure semantics remain intact.
  - Exact route matching prevents Overview from appearing active on every nested dashboard route while preserving nested ownership for routes such as Settings and Presence.
  - `docs/product/DASHBOARD_NAVIGATION_ACCEPTANCE.md` and focused tests protect the information architecture, route preservation, and active-route rules.
'''

old_p2013 = '''- [ ] **P2-013 — Remove Unverified Metrics** — **Partial**
  - Several fabricated hero and examples claims were removed in [PR #29](https://github.com/jonathan-hansel-awo/onprez/pull/29) and [PR #95](https://github.com/jonathan-hansel-awo/onprez/pull/95).
  - However, `SocialProofStreamDual` currently says “Join Thousands of Professionals,” “Real activity happening right now,” and “Live activity from professionals worldwide.”
  - `TestimonialsBento` also says OnPrez is loved by and used by thousands of professionals while rendering testimonial fixture data.
  - Remaining: remove these claims or label the whole experience unmistakably as fictional product demonstration content.
'''
new_p2013 = '''- [x] **P2-013 — Remove Unverified Metrics** — **Complete**
  - Merged [PR #126](https://github.com/jonathan-hansel-awo/onprez/pull/126) removes the fabricated live-activity stream, fictional testimonials, booking and visit counts, upgrades, ratings, time-saving claims, and before/after outcome metrics from the public homepage.
  - The underlying fictional activity and testimonial fixtures and rendering components were deleted rather than merely relabelled.
  - `docs/product/MARKETING_CLAIMS_POLICY.md` requires durable evidence, an owner, a measurement window, appropriately scoped wording, consent where relevant, and a review date before future quantitative or testimonial claims are published.
  - Regression coverage prevents the deleted sources and known unsupported claims from returning.
'''

old_p2016 = '''- [ ] **P2-016 — Replace Generic Social Proof with Product Proof** — **Partial**
  - Realistic interactive examples, templates, a client journey scenario, and working booking previews now provide strong product proof.
  - The remaining fabricated activity stream and testimonial language still competes with that proof and prevents completion.
'''
new_p2016 = '''- [x] **P2-016 — Replace Generic Social Proof with Product Proof** — **Complete**
  - Realistic interactive examples, catalogue templates, the client journey scenario, working booking previews, feature walkthroughs, and transparent pricing provide inspectable product proof.
  - Merged [PR #126](https://github.com/jonathan-hansel-awo/onprez/pull/126) removes the remaining fabricated activity and testimonial system so unsupported social proof no longer competes with demonstrable product behaviour.
  - Future customer evidence must satisfy the repository marketing-claims policy before it can replace or supplement product proof.
'''

old_p2017 = '''- [ ] **P2-017 — Add Core Web Vitals Monitoring** — **Partial**
  - The `web-vitals` package is installed, performance-oriented lazy loading exists, and consent-gated GA page-view reporting is implemented.
  - No active Web Vitals reporter, regression dashboard, alert threshold, or release comparison was found in `main`.
'''
new_p2017 = '''- [ ] **P2-017 — Add Core Web Vitals Monitoring** — **Partial — implementation awaiting merge**
  - [PR #127](https://github.com/jonathan-hansel-awo/onprez/pull/127) adds consent-gated production reporting for LCP, INP, CLS, FCP, and TTFB through Next.js `useReportWebVitals`.
  - Measurements use coarse page groups and separate mobile and desktop classes without sending business handles, customer routes, query strings, full URLs, or form data.
  - A strict same-origin endpoint recomputes ratings server-side, records structured metrics with environment and release data, and creates grouped Sentry warnings for poor results.
  - Public and dashboard thresholds are explicit, Google Analytics receives the same dimensions when configured, and `docs/product/WEB_VITALS_MONITORING.md` defines 75th-percentile, release-comparison, and major-UI-change review procedures.
  - Focused tests protect metric coverage, segmentation, thresholds, privacy-safe payloads, server-side rating, validation, and alert behaviour.
  - Mark Complete after PR #127 merges successfully into `main`.
'''

for old, new in [
    (old_p2011, new_p2011),
    (old_p2012, new_p2012),
    (old_p2013, new_p2013),
    (old_p2016, new_p2016),
    (old_p2017, new_p2017),
]:
    if old not in text:
        raise SystemExit(f'Missing detailed tracker block beginning: {old.splitlines()[0]}')
    text = text.replace(old, new)

marker = '| 31 July 2026 | Marked merged P2-010 complete and recorded P2-011 private, expiring, non-indexed draft-preview implementation pending PR #124 merge.'
row = '| 31 July 2026 | Marked merged P2-011, P2-012, P2-013, and P2-016 complete and recorded consented Core Web Vitals monitoring pending PR #127 merge. | [#124](https://github.com/jonathan-hansel-awo/onprez/pull/124) / [#125](https://github.com/jonathan-hansel-awo/onprez/pull/125) / [#126](https://github.com/jonathan-hansel-awo/onprez/pull/126) / [#127](https://github.com/jonathan-hansel-awo/onprez/pull/127) |\n'
if marker not in text:
    raise SystemExit('Missing change-log insertion marker')
if row not in text:
    text = text.replace(marker, row + marker)

if text == original:
    raise SystemExit('Tracker replacements did not apply')

path.write_text(text)
