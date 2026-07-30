# OnPrez Critical Action Plan Progress Tracker

**Document type:** Living progress tracker  
**Source plan:** `OnPrez Critical Action Plan`  
**Last repository audit:** 30 July 2026  
**Audited branch:** `main`  
**Audit baseline:** `bdbe514`  
**Current working phase:** Phase 7 — Dashboard UX  
**Next planned item:** P2-010 — Clarify Draft vs Published State

---

## Purpose

This document records implementation progress against every item in the OnPrez Critical Action Plan. It is intended to stay in the repository and be updated in the same pull request that completes an action item.

The status is based on:

- the code currently merged into `main`;
- tests, workflows, migrations, runbooks, and product documentation in the repository;
- merged pull-request history;
- whether the original acceptance criteria can be evidenced from the repository.

It does **not** assume an item is complete merely because work started or a related feature exists.

## Status legend

- [x] **Complete** — the implementation and the material acceptance criteria are evidenced in `main`.
- [ ] **Partial** — meaningful implementation exists, but at least one material acceptance criterion remains.
- [ ] **Not started** — no sufficient implementation or repository evidence was found.

> A checked item means complete in the repository. Provider dashboards, production secrets, live smoke tests, legal review, and other external operational checks must still be maintained separately where applicable.

## Update procedure

Whenever an action item is completed:

1. Complete the implementation and acceptance tests.
2. Link the pull request and important source files under the item below.
3. Change the item to `[x] Complete` only after the PR is merged into `main`.
4. Update the phase summary, overall totals, audit date, current phase, and next planned item.
5. Record any production migration, secret, provider configuration, or manual verification still required.
6. Do not mark an item complete from a draft or open PR.

---

## Progress summary

| Phase | Complete | Partial | Not started | Total |
|---|---:|---:|---:|---:|
| Phase 0 — Stop-the-Bleed Hardening | 6 | 0 | 0 | 6 |
| Phase 1 — Auth, Sessions, and Tenant Isolation | 5 | 0 | 0 | 5 |
| Phase 2 — Booking Correctness and Data Integrity | 4 | 1 | 0 | 5 |
| Phase 3 — Security Hardening | 5 | 0 | 0 | 5 |
| Phase 4 — Deployment, Operations, and Observability | 5 | 0 | 0 | 5 |
| Phase 5 — Product Scope Discipline | 0 | 2 | 1 | 3 |
| Phase 6 — Public Presence Page UX | 5 | 0 | 0 | 5 |
| Phase 7 — Dashboard UX | 1 | 3 | 0 | 4 |
| Phase 8 — Trust, Positioning, and Marketing Integrity | 2 | 2 | 0 | 4 |
| Phase 9 — Performance and Scalability | 0 | 2 | 2 | 4 |
| Phase 10 — Privacy and Data Lifecycle | 1 | 1 | 1 | 3 |
| Phase 11 — Communications | 2 | 1 | 0 | 3 |
| Phase 12 — SEO and Handle Durability | 0 | 1 | 1 | 2 |
| Phase 13 — Testing Maturity | 0 | 2 | 1 | 3 |
| Phase 14 — Documentation and Architecture Discipline | 0 | 0 | 2 | 2 |
| Phase 15 — Monetisation Readiness | 1 | 0 | 1 | 2 |
| **Total** | **37** | **15** | **9** | **61** |

**Strict completion:** 37 of 61 items — approximately **61%**.  
**Items with at least meaningful implementation:** 52 of 61 — approximately **85%**.

### Current priorities from this audit

1. Complete **P2-010**, **P2-011**, and **P2-012** to finish Phase 7.
2. Merge or otherwise resolve [PR #114](https://github.com/jonathan-hansel-awo/onprez/pull/114) before marking **P1-008** complete.
3. Remove or clearly label the remaining fabricated homepage activity and testimonial claims under **P2-013** and **P2-016**.
4. Add public-page caching and measured load tests before growth work under Phase 9.

---

# Detailed checklist

## Phase 0 — Stop-the-Bleed Hardening

- [x] **P0-001 — Fix Route Protection Bug** — **Complete**
  - Exact route matching is implemented in `src/proxy.ts`; `/dashboard`, `/account`, and `/admin` are explicitly protected without treating `/` as a universal prefix.
  - Server layouts and handlers still perform authoritative session validation.

- [x] **P0-002 — Audit Every API Route for Authorization** — **Complete, with ongoing compliance required**
  - Central auth and business-access helpers, route classifications, cross-tenant tests, and server-side access checks were delivered through the Phase 1 security hardening work.
  - Evidence includes [PR #4](https://github.com/jonathan-hansel-awo/onprez/pull/4), [PR #12](https://github.com/jonathan-hansel-awo/onprez/pull/12), and the current `src/lib/auth` utilities.
  - Every new private API must continue using these controls.

- [x] **P0-003 — Remove or Protect Debug and Environment Routes** — **Complete**
  - Production diagnostic access was removed or guarded during the merged security hardening series.
  - Internal and admin functionality now uses database-backed platform roles and server-side validation.

- [x] **P0-004 — Fix CI So It Actually Protects the Project** — **Complete**
  - [PR #1](https://github.com/jonathan-hansel-awo/onprez/pull/1) aligned CI with repository scripts.
  - Current quality gates cover formatting, linting, TypeScript, Prisma validation, Jest, production build, dependency review, and secret scanning.

- [x] **P0-005 — Separate Database Migrations from App Build** — **Complete**
  - `npm run build` runs only `next build`; migrations use `npm run db:migrate:deploy`.
  - [PR #2](https://github.com/jonathan-hansel-awo/onprez/pull/2) separated the workflows and [PR #110](https://github.com/jonathan-hansel-awo/onprez/pull/110) added a guarded manual production migration workflow.

- [x] **P0-006 — Create a Production Readiness Checklist** — **Complete**
  - Delivered by [PR #3](https://github.com/jonathan-hansel-awo/onprez/pull/3).

---

## Phase 1 — Auth, Sessions, and Tenant Isolation

- [x] **P1-001 — Validate Auth Server-Side Everywhere** — **Complete**
  - Protected layouts and route handlers use canonical server-side auth utilities; for example, `src/app/dashboard/layout.tsx` calls `getCurrentUser()` and redirects invalid sessions.
  - Delivered through the merged Phase 1 auth-hardening series, including [PR #12](https://github.com/jonathan-hansel-awo/onprez/pull/12).

- [x] **P1-002 — Hash Refresh Tokens and Session Tokens at Rest** — **Complete**
  - Token hashing, rotation, session invalidation, and related security logging were delivered in the Phase 1 auth-hardening series.

- [x] **P1-003 — Build a Business Context Authorization Layer** — **Complete**
  - Central business-role and business-access helpers are used by tenant-scoped routes.
  - Delivered by [PR #4](https://github.com/jonathan-hansel-awo/onprez/pull/4).

- [x] **P1-004 — Add Role-Based Access Tests** — **Complete**
  - Owner, staff, admin, anonymous, and cross-tenant scenarios are covered across route and business-access tests.
  - Later admin and upload work continues to exercise these boundaries, including [PR #79](https://github.com/jonathan-hansel-awo/onprez/pull/79).

- [x] **P1-005 — Standardise Error Responses** — **Complete**
  - Delivered by [PR #5](https://github.com/jonathan-hansel-awo/onprez/pull/5) and reused by current API error and structured-logging utilities.

---

## Phase 2 — Booking Correctness and Data Integrity

- [x] **P1-006 — Implement Transaction-Safe Booking Conflict Prevention** — **Complete**
  - Transactional conflict protection and locking were delivered by [PR #6](https://github.com/jonathan-hansel-awo/onprez/pull/6).
  - Later booking-protection and approval-lifecycle work preserves the final transactional conflict check.

- [x] **P1-007 — Add Idempotency Keys for Booking Creation** — **Complete**
  - Booking idempotency records, replay handling, and client duplicate-submit protection exist.
  - Production migrations must remain current; [PR #110](https://github.com/jonathan-hansel-awo/onprez/pull/110) provides the controlled deployment path.

- [ ] **P1-008 — Fix Timezone Model and DST Handling** — **Partial**
  - UTC storage, IANA business timezones, local-date serialization, confirmation rendering, and several DST regressions are implemented; see [PR #61](https://github.com/jonathan-hansel-awo/onprez/pull/61).
  - The current `main` branch can still expose a BST-shifted overlapping slot because detailed availability reconciliation mixes server/UTC and business-local time.
  - [PR #114](https://github.com/jonathan-hansel-awo/onprez/pull/114) addresses the remaining defect but is open and therefore is not counted as complete.

- [x] **P1-009 — Add Booking State Machine Rules** — **Complete**
  - Delivered by [PR #7](https://github.com/jonathan-hansel-awo/onprez/pull/7), with later approval, payment, cancellation, reschedule, and refund lifecycle hardening.

- [x] **P1-010 — Add Database Constraints for Critical Business Rules** — **Complete**
  - Delivered by [PR #8](https://github.com/jonathan-hansel-awo/onprez/pull/8), with additional migrations and indexes added as later booking and payment features evolved.

---

## Phase 3 — Security Hardening

- [x] **P1-011 — Rate Limit All Sensitive Endpoints** — **Complete**
  - Sensitive auth, booking, inquiry, handle, upload, and related routes use the shared rate-limit service and return rate-limit metadata.

- [x] **P1-012 — Harden File Uploads** — **Complete**
  - [PR #9](https://github.com/jonathan-hansel-awo/onprez/pull/9) added hardened validation.
  - Current `src/app/api/upload/image/route.ts` verifies business access, purpose, signatures and format through sanitisation, file limits, rate limiting, scoped Cloudinary folders, and safe error handling.

- [x] **P1-013 — Add Security Headers** — **Complete**
  - CSP and the required production security headers are configured and regression-tested through the Phase 1 security hardening work.

- [x] **P1-014 — Add CSRF Protection Where Needed** — **Complete**
  - `src/proxy.ts` rejects unsafe cross-site and same-site state-changing API requests using Origin, Referer, Fetch Metadata, and target-origin checks.

- [x] **P1-015 — Add Dependency and Secret Scanning** — **Complete**
  - Dependency review and secret scanning are part of the repository quality gates and are reported in later merged PR validation results.

---

## Phase 4 — Deployment, Operations, and Observability

- [x] **P1-016 — Add Error Monitoring** — **Complete**
  - Sentry is integrated for production error monitoring and release diagnostics.
  - Repository history includes `chore: add production error monitoring` and `chore: integrate production error monitoring` commits.

- [x] **P1-017 — Add Uptime and Health Monitoring** — **Complete in the repository**
  - Safe health checks and the production uptime workflow are present; the workflow is also reused for authenticated background delivery and lifecycle checks.
  - Live alert destinations and production provider configuration remain operational responsibilities.

- [x] **P1-018 — Add Structured Logging** — **Complete**
  - Delivered by [PR #26](https://github.com/jonathan-hansel-awo/onprez/pull/26).
  - Request and correlation IDs now flow through proxy, API, booking, upload, auth, and notification paths.

- [x] **P1-019 — Create Incident Runbooks** — **Complete**
  - Delivered by [PR #27](https://github.com/jonathan-hansel-awo/onprez/pull/27), with additional payment and booking-protection runbooks added later.

- [x] **P1-020 — Add Backup and Restore Verification** — **Complete in the repository**
  - Delivered by [PR #28](https://github.com/jonathan-hansel-awo/onprez/pull/28).
  - The repository also exposes `npm run db:verify-restore`; restore exercises should continue periodically.

---

## Phase 5 — Product Scope Discipline

- [ ] **P2-001 — Define the First Sellable User Loop** — **Partial**
  - The loop itself now exists in product code: claim handle, create account, configure presence, add services and availability, publish, share, receive a booking, and manage it.
  - The guided checklist from [PR #56](https://github.com/jonathan-hansel-awo/onprez/pull/56) supports the journey.
  - Remaining: a canonical repository document defining the minimum sellable version, explicit event instrumentation for every step, a measured under-ten-minute acceptance test, and evidence that a new professional can complete it without assistance.

- [ ] **P2-002 — Ruthlessly Defer Non-Core Features** — **Not started**
  - No repository-level Core/Support/Later classification or `LATER.md` was found.
  - The product has continued expanding into payments, calendars, PWA push, analytics, inquiries, templates, and admin tooling without the action plan’s requested scope-control document.

- [ ] **P2-003 — Define the First Niche Clearly** — **Partial**
  - Realistic beauty, wellness, barber, therapy, fitness, professional, creative, and education examples now exist.
  - The homepage still positions OnPrez broadly for service professionals rather than committing to one initial niche.
  - Remaining: select one first niche, align primary homepage/onboarding copy to it, and document 3–5 observed onboarding sessions with real professionals from that niche.

---

## Phase 6 — Public Presence Page UX

- [x] **P2-004 — Optimise Public Pages for Conversion, Not Just Beauty** — **Complete**
  - Delivered by [PR #50](https://github.com/jonathan-hansel-awo/onprez/pull/50): sticky mobile CTA, service price/duration/availability, trust signals, direct booking routes, and conversion prompts.

- [x] **P2-005 — Create a Realistic Demo Presence Page** — **Complete**
  - Heavenly Pamper Palace was completed in [PR #51](https://github.com/jonathan-hansel-awo/onprez/pull/51), followed by Crown & Canvas Studio in [PR #52](https://github.com/jonathan-hansel-awo/onprez/pull/52).

- [x] **P2-006 — Improve Empty States** — **Complete**
  - Delivered by [PR #53](https://github.com/jonathan-hansel-awo/onprez/pull/53) for services, bookings, customers, and analytics.

- [x] **P2-007 — Improve Loading, Error, and Success States** — **Complete**
  - Delivered by [PR #54](https://github.com/jonathan-hansel-awo/onprez/pull/54), including duplicate-submit protection and recoverable feedback across core flows.

- [x] **P2-008 — Make Mobile the Primary UX Review Target** — **Complete**
  - Delivered by [PR #55](https://github.com/jonathan-hansel-awo/onprez/pull/55), with further mobile editor, service-dashboard, PWA, and premium-template corrections in later PRs.

---

## Phase 7 — Dashboard UX

- [x] **P2-009 — Add an Onboarding Checklist** — **Complete**
  - Delivered by [PR #56](https://github.com/jonathan-hansel-awo/onprez/pull/56).
  - Progress is derived from tenant-scoped data and links each incomplete step to a real next action.

- [ ] **P2-010 — Clarify Draft vs Published State** — **Partial**
  - The presence dashboard and editor clearly distinguish Draft and Published states, hide the live link for drafts, support publish/unpublish, preserve draft-only template changes, and warn before destructive or unsaved actions.
  - Evidence: [PR #69](https://github.com/jonathan-hansel-awo/onprez/pull/69), [PR #75](https://github.com/jonathan-hansel-awo/onprez/pull/75), `src/app/dashboard/presence/page.tsx`, and `PresenceEditorLayout.tsx`.
  - Remaining: show the last-published timestamp and make the relationship between current draft content and the last live snapshot explicit after further edits.

- [ ] **P2-011 — Add Better Preview Workflows** — **Partial**
  - The editor includes real mobile and desktop rendering modes, and the same canonical renderer is reused across examples, editor previews, saved drafts, and public pages.
  - Remaining: provide a private, non-indexed draft preview URL, a copy-preview-link action, safe expiry/access rules, and explicit draft preview metadata.

- [ ] **P2-012 — Simplify Dashboard Navigation** — **Partial**
  - Mobile and desktop navigation, collapsible sidebar behaviour, accessible touch targets, and breadcrumbs are implemented.
  - The current top-level navigation still exposes Overview, Presence, Services, Bookings, Customers, Inquiries, Analytics, Sharing, and Settings as one flat list.
  - Remaining: group routes by intent, reduce the primary list, and move advanced/low-frequency destinations deeper without breaking discoverability.

---

## Phase 8 — Trust, Positioning, and Marketing Integrity

- [ ] **P2-013 — Remove Unverified Metrics** — **Partial**
  - Several fabricated hero and examples claims were removed in [PR #29](https://github.com/jonathan-hansel-awo/onprez/pull/29) and [PR #95](https://github.com/jonathan-hansel-awo/onprez/pull/95).
  - However, `SocialProofStreamDual` currently says “Join Thousands of Professionals,” “Real activity happening right now,” and “Live activity from professionals worldwide.”
  - `TestimonialsBento` also says OnPrez is loved by and used by thousands of professionals while rendering testimonial fixture data.
  - Remaining: remove these claims or label the whole experience unmistakably as fictional product demonstration content.

- [x] **P2-014 — Sharpen Homepage Positioning** — **Complete**
  - Delivered explicitly by [PR #65](https://github.com/jonathan-hansel-awo/onprez/pull/65) and strengthened by the redesigned product-led hero in [PR #95](https://github.com/jonathan-hansel-awo/onprez/pull/95).

- [x] **P2-015 — Add Trust Pages** — **Complete**
  - Privacy Policy, Terms of Service, Cookie Policy, consent controls, support/security contact routes, and legal metadata were delivered by [PR #62](https://github.com/jonathan-hansel-awo/onprez/pull/62).
  - Formal legal review and final operator address remain pre-paid-launch operational requirements, not missing product routes.

- [ ] **P2-016 — Replace Generic Social Proof with Product Proof** — **Partial**
  - Realistic interactive examples, templates, a client journey scenario, and working booking previews now provide strong product proof.
  - The remaining fabricated activity stream and testimonial language still competes with that proof and prevents completion.

---

## Phase 9 — Performance and Scalability

- [ ] **P2-017 — Add Core Web Vitals Monitoring** — **Partial**
  - The `web-vitals` package is installed, performance-oriented lazy loading exists, and consent-gated GA page-view reporting is implemented.
  - No active Web Vitals reporter, regression dashboard, alert threshold, or release comparison was found in `main`.

- [ ] **P2-018 — Cache Public Presence Pages by Handle** — **Not started**
  - `src/app/[handle]/page.tsx` is currently `force-dynamic` and performs direct Prisma queries on each request.
  - No handle cache, ISR/revalidation policy, or explicit invalidation architecture was found.

- [ ] **P2-019 — Optimise Image Delivery** — **Partial**
  - Cloudinary-backed uploads, image validation, sanitisation, scoped storage, format restrictions, and responsive frontend foundations exist.
  - Remaining: enforce upload-side resizing and quality policies, generate/serve responsive variants consistently, document delivery budgets, and test realistic galleries on slow mobile networks.

- [ ] **P2-020 — Add Load Testing for Critical Paths** — **Not started**
  - No k6, Artillery, Locust, or equivalent load-test suite and no measured capacity baseline was found.
  - Required paths remain public pages, handle availability, login, availability calculation, booking creation, and concurrent booking conflict safety.

---

## Phase 10 — Privacy and Data Lifecycle

- [x] **P2-021 — Define Data Retention Rules** — **Complete**
  - `src/app/privacy/page.tsx` documents retention rules for accounts, media, appointments/customer records, logs, analytics, and backups.
  - Automated enforcement should be added where required, but the action item’s definition and public documentation criteria are met.

- [ ] **P2-022 — Add Export and Deletion Workflows** — **Not started**
  - The Privacy Policy provides an email route for requests, but no self-service account/business export, staged deletion, ownership verification workflow, or deletion audit trail was found.

- [ ] **P2-023 — Review PII Handling** — **Partial**
  - Strong access controls, tenant isolation, token hashing, encrypted Google refresh tokens, restricted logs, cookie consent, and privacy disclosures exist.
  - Remaining: a canonical PII inventory and data-flow map, field-by-field encryption classification, retention/deletion ownership, and a recurring audit confirming no PII enters logs, analytics, errors, notification payloads, or URLs.

---

## Phase 11 — Communications

- [ ] **P2-024 — Add Email Delivery Logging** — **Partial**
  - Transactional booking emails are sent independently of booking success, structured delivery failures are logged, duplicate replay emails are suppressed, and provider outcomes are test-covered.
  - Push delivery has a durable outbox and per-device audit records, but an equivalent persistent business-facing email delivery log, status history, retry interface, and bounce/complaint workflow was not verified.

- [x] **P2-025 — Add Calendar Links** — **Complete**
  - Delivered by [PR #109](https://github.com/jonathan-hansel-awo/onprez/pull/109): Google and Outlook links, `.ics` attachments, stable event IDs, and optional automatic Google Calendar synchronisation.

- [x] **P2-026 — Add Notification Preferences** — **Complete**
  - Delivered by [PR #108](https://github.com/jonathan-hansel-awo/onprez/pull/108), with later PWA push controls and delivery verification.

---

## Phase 12 — SEO and Handle Durability

- [ ] **P2-027 — Improve Presence SEO** — **Partial**
  - Presence pages provide custom metadata, canonical URLs, Open Graph/Twitter data, sitemap integration, robots directives, and `LocalBusiness` structured data.
  - Remaining: owner-controlled indexing settings, verified FAQ schema generation, richer structured data where appropriate, and SEO validation against realistic published businesses.

- [ ] **P2-028 — Add Handle Change Redirects** — **Not started**
  - No durable old-handle mapping, redirect history, conflict rules, or redirect loop protection was verified.

---

## Phase 13 — Testing Maturity

- [ ] **P2-029 — Define and Enforce a Test Pyramid** — **Partial**
  - The repository has a large Jest unit/component/API suite, shared fixtures, security regressions, build gates, migration validation, and extensive focused tests.
  - Remaining: a canonical in-repository testing-strategy document defining the test pyramid, ownership, required layers per feature, database-test policy, and release gates.

- [ ] **P2-030 — Add E2E Tests for the Core Loop** — **Not started**
  - No Playwright, Cypress, or equivalent browser E2E framework is installed in `package.json`.
  - The complete claim-to-book-to-manage journey is therefore not yet proven through a real browser and deployed-like system boundary.

- [ ] **P2-031 — Add Accessibility Testing** — **Partial**
  - Keyboard semantics, ARIA feedback, reduced-motion support, focus behaviour, mobile touch targets, and accessibility regressions exist across components.
  - Remaining: automated axe or equivalent audits, full keyboard/screen-reader checks for core flows, contrast gates, and recurring accessibility CI coverage.

---

## Phase 14 — Documentation and Architecture Discipline

- [ ] **P2-032 — Replace Stale Documentation** — **Not started**
  - Current architecture knowledge exists in project documents outside the repository, but no verified canonical `CURRENT_STATE.md` was found in `main`.
  - The repository needs one source of truth covering current framework versions, Neon/Prisma, custom auth, Cloudinary, Resend, Stripe, Sentry, PWA push, calendars, deployment, data flows, and known limitations.

- [ ] **P2-033 — Add Architecture Decision Records** — **Not started**
  - No ADR directory or decision-log convention was verified.
  - Decisions such as custom auth, Neon, Vercel, Cloudinary, canonical presence rendering, transactional booking locks, migration separation, Stripe Connect, push outbox, and calendar-token encryption should be recorded.

---

## Phase 15 — Monetisation Readiness

- [x] **P3-001 — Define Plans Based on Real Value** — **Complete**
  - [PR #94](https://github.com/jonathan-hansel-awo/onprez/pull/94) implemented Free, Professional, and Business plans at £0, £8, and £20, with explicit service, media, booking, branding, deposit, support, and fair-use boundaries.

- [ ] **P3-002 — Add Usage Tracking Before Enforcing Limits** — **Not started**
  - No verified central usage-ledger or admin overhead dashboard currently measures media storage/delivery, transactional emails, monthly bookings by plan, provider cost estimates, and warning thresholds before enforcement.
  - This should be coordinated with the proposed admin overhead and cost-monitoring work.

---

## Audit notes and known limitations

- This tracker evaluates what is merged into `main`. Open PRs do not count as complete.
- The audit does not prove that every deployment secret, webhook, OAuth consent screen, provider billing alert, email alias, uptime destination, or scheduled workflow is configured correctly in production.
- Legal pages are operational drafts and should receive professional review before paid launch.
- Backup, restore, payment, email, calendar, push, and incident procedures require periodic real-world drills even when their repository action item is checked.
- New features must not silently regress previously completed security, tenancy, booking, privacy, or operational acceptance criteria.

## Change log

| Date | Change | PR |
|---|---|---|
| 30 July 2026 | Created the tracker and audited all 61 action items against current `main` and merged history. | Pending |
