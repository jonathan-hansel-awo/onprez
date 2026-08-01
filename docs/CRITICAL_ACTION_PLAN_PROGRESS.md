# OnPrez Critical Action Plan Progress Tracker

**Document type:** Living progress tracker  
**Source plan:** `OnPrez Critical Action Plan`

**Last repository audit:** 1 August 2026

**Audited branch:** `main`

**Audit baseline:** `50f6b1f` plus the current implementation pull request

**Current working phase:** Phase 12 — SEO and Handle Durability

**Next planned item:** P2-028 — Add Handle Change Redirects

---

## Purpose

This document records implementation progress against every item in the OnPrez Critical Action Plan. It is intended to stay in the repository and be updated in the same pull request that completes an action item.

The status is based on:

- the code currently merged into `main` and the action item's current implementation pull request;
- tests, workflows, migrations, runbooks, and product documentation in the repository;
- merged pull-request history;
- whether the original acceptance criteria can be evidenced from the repository.

It does **not** assume an item is complete merely because work started or a related feature exists.

## Status legend

- [x] **Complete** — the implementation and material acceptance criteria are evidenced in `main` or in the current implementation pull request after its local acceptance checks pass.
- [ ] **Partial** — meaningful implementation exists, but at least one material acceptance criterion remains.
- [ ] **Not started** — no sufficient implementation or repository evidence was found.

> A checked item means implementation-complete and ready to merge. The next “next item” pass must still confirm that the preceding pull request merged successfully. Provider dashboards, production secrets, live smoke tests, legal review, and other external operational checks remain separate where applicable.

## Update procedure

Whenever an action item is completed:

1. Complete the implementation and acceptance tests.
2. Link the pull request and important source files under the item below.
3. Change the item to `[x] Complete` in the same implementation PR after the material acceptance checks pass.
4. Update the phase summary, overall totals, audit date, current phase, and next planned item.
5. Record any production migration, secret, provider configuration, or manual verification still required.
6. If the implementation PR fails acceptance checks, is closed without merge, or loses material scope during review, revert the item to Partial or Not started as appropriate.
7. When the user says “next item”, first confirm that the preceding implementation PR merged, reconcile other merged work against this tracker, skip every Complete item, and select the earliest Partial or Not started item.

---

## Progress summary

| Phase                                                 | Complete | Partial | Not started |  Total |
| ----------------------------------------------------- | -------: | ------: | ----------: | -----: |
| Phase 0 — Stop-the-Bleed Hardening                    |        6 |       0 |           0 |      6 |
| Phase 1 — Auth, Sessions, and Tenant Isolation        |        5 |       0 |           0 |      5 |
| Phase 2 — Booking Correctness and Data Integrity      |        5 |       0 |           0 |      5 |
| Phase 3 — Security Hardening                          |        5 |       0 |           0 |      5 |
| Phase 4 — Deployment, Operations, and Observability   |        5 |       0 |           0 |      5 |
| Phase 5 — Product Scope Discipline                    |        3 |       0 |           0 |      3 |
| Phase 6 — Public Presence Page UX                     |        5 |       0 |           0 |      5 |
| Phase 7 — Dashboard UX                                |        4 |       0 |           0 |      4 |
| Phase 8 — Trust, Positioning, and Marketing Integrity |        4 |       0 |           0 |      4 |
| Phase 9 — Performance and Scalability                 |        4 |       0 |           0 |      4 |
| Phase 10 — Privacy and Data Lifecycle                 |        3 |       0 |           0 |      3 |
| Phase 11 — Communications                             |        3 |       0 |           0 |      3 |
| Phase 12 — SEO and Handle Durability                  |        1 |       0 |           1 |      2 |
| Phase 13 — Testing Maturity                           |        0 |       2 |           1 |      3 |
| Phase 14 — Documentation and Architecture Discipline  |        0 |       0 |           2 |      2 |
| Phase 15 — Monetisation Readiness                     |        1 |       0 |           1 |      2 |
| **Total**                                             |   **54** |   **2** |       **5** | **61** |

**Strict completion:** 54 of 61 items — approximately **89%**.

**Items with at least meaningful implementation:** 56 of 61 — approximately **92%**.

### Current priorities from this audit

1. Keep the **P2-020** isolated capacity baseline green when public, authentication, availability, or booking critical paths change, and review its retained report before releases.
2. Preserve old presence links safely when owners change handles under **P2-028**.
3. Complete the remaining testing-maturity and canonical architecture documentation gaps before paid scale.
4. Complete the P2-023 provider-account privacy checks and recorded credential-encryption follow-ups before paid scale. Add usage and provider-cost tracking before enforcing paid-plan limits.

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

- [x] **P1-008 — Fix Timezone Model and DST Handling** — **Complete**
  - UTC storage, IANA business timezones, local-date serialization, confirmation rendering, and DST regression coverage are implemented; see [PR #61](https://github.com/jonathan-hansel-awo/onprez/pull/61).
  - [PR #114](https://github.com/jonathan-hansel-awo/onprez/pull/114) completed the remaining availability reconciliation by comparing appointments in the business timezone, preventing BST and server-timezone offsets from exposing overlapping slots.
  - The final transactional conflict validation remains the race-condition safety net.

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

- [x] **P2-001 — Define the First Sellable User Loop** — **Complete**
  - Merged [PR #116](https://github.com/jonathan-hansel-awo/onprez/pull/116) defines the canonical loop as claim handle, add service, set availability, publish page, share link, receive booking, and manage booking.
  - `docs/product/FIRST_SELLABLE_USER_LOOP.md` defines the minimum sellable version, a strict 8 minute 45 second target budget, the mobile acceptance-session protocol, and an evidence log for fresh users.
  - `GET /api/dashboard/first-sellable-loop` provides authenticated, tenant-scoped milestone analytics from durable OnPrez records without sending customer PII to a third-party analytics provider.
  - Stable event names and regression tests cover milestone order, progress, elapsed time, the under-ten-minute target, authentication, tenant scoping, and the requirement for a real `USER` booking transition before the final milestone completes.
  - The existing guided checklist from [PR #56](https://github.com/jonathan-hansel-awo/onprez/pull/56) continues to support the setup journey. Merged [PR #117](https://github.com/jonathan-hansel-awo/onprez/pull/117) restored the repository quality-gate formatting without changing behaviour.
  - Fresh-account mobile sessions remain part of launch validation and ongoing product evidence, but the repository definition, target, instrumentation, and regression acceptance criteria are now complete in `main`.

- [x] **P2-002 — Ruthlessly Defer Non-Core Features** — **Complete**
  - Merged [PR #118](https://github.com/jonathan-hansel-awo/onprez/pull/118) classifies all 141 source-roadmap micro-milestones as Core, Support, or Later in `docs/product/MVP_SCOPE.md`.
  - `docs/product/LATER.md` captures deferred ideas with evidence-based revisit triggers and preserves already shipped non-core behaviour while freezing material expansion.
  - Team invitations, secure acceptance, member management, owner/admin/staff roles, tenant-safe permissions, and the multi-member booking loop are explicitly Core and are not deferred.
  - The next ten work sessions are committed to the usable presence-and-booking loop, including team-member acceptance auditing and mobile hardening.

- [x] **P2-003 — Define the First Niche Clearly** — **Complete**
  - Merged [PR #119](https://github.com/jonathan-hansel-awo/onprez/pull/119) selects independent beauty and wellness professionals and small teams as the first launch niche without restricting other supported service categories.
  - Homepage hero copy, SEO metadata, signup metadata, and featured examples lead with hair, makeup, nails, massage, spas, salons, barbering, and mobile beauty.
  - `docs/product/FIRST_LAUNCH_NICHE.md` defines the target user, problem, value proposition, product assumptions, realistic-demo standard, and a 3–5 participant onboarding protocol that includes at least one multi-member business.
  - Aurelia Wellness House, Crown & Canvas Studio, and Regent Barber provide niche-specific demo and template evidence, while regression tests lock the intended audience and concrete presence-plus-booking journey. The real Heavenly Pamper Palace identity is no longer used as fictional demo content.
  - Genuine participant sessions remain ongoing launch validation and must not be fabricated, but the repository niche decision, product alignment, research protocol, examples, and regression acceptance criteria are complete in `main`.

---

## Phase 6 — Public Presence Page UX

- [x] **P2-004 — Optimise Public Pages for Conversion, Not Just Beauty** — **Complete**
  - Merged [PR #50](https://github.com/jonathan-hansel-awo/onprez/pull/50) delivered the sticky mobile CTA, clear service price/duration/live availability, genuine trust signals, direct booking routes, and repeated desktop conversion prompts.
  - Merged [PR #120](https://github.com/jonathan-hansel-awo/onprez/pull/120) revalidates the original acceptance criteria, makes persistent conversion controls theme-aware, reserves safe-area-aware mobile content space, adds Testimonials to the high-intent desktop prompt points, and fixes Regent Barber contrast.
  - `docs/product/PUBLIC_PAGE_CONVERSION_ACCEPTANCE.md` records the durable conversion contract and a repeatable manual comprehension check without fabricating participant results.
  - Focused regression coverage protects genuine trust claims, direct hero/service/section/sticky booking links, accessible mobile touch height, safe-area behaviour, and the renderer's non-obstruction spacing.

- [x] **P2-005 — Create a Realistic Demo Presence Page** — **Complete**
  - Merged [PR #51](https://github.com/jonathan-hansel-awo/onprez/pull/51) delivered the original detailed wellness demonstration, followed by the Crown & Canvas Studio sector example in merged [PR #52](https://github.com/jonathan-hansel-awo/onprez/pull/52).
  - Merged [PR #121](https://github.com/jonathan-hansel-awo/onprez/pull/121) applies the privacy-safe interactive service-and-time booking journey to every public example and catalogue template.
  - The fictional flagship wellness example is now Aurelia Wellness House and the visible template name is Golden Serenity; the legacy `heavenly-pamper-palace` slug remains only for backwards-compatible links.
  - `docs/product/REALISTIC_DEMO_ACCEPTANCE.md` and catalogue-wide regression tests protect fictional identity separation, services, hours, policies, sample availability, booking review, signup handoff, and the no-PII/no-record safety boundary.

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

- [x] **P2-010 — Clarify Draft vs Published State** — **Complete**
  - Merged [PR #123](https://github.com/jonathan-hansel-awo/onprez/pull/123) defines explicit Draft, Live and up to date, Live with unpublished changes, and legacy published-without-snapshot states.
  - The state is derived from the saved draft, published snapshot, visibility, and publication timestamp rather than trusting a client-only flag.
  - The Presence dashboard and editor show what customers currently see, the last-published date and time, whether changes remain unpublished, and a direct live-page link when one exists.
  - Unpublishing preserves the historical published snapshot and timestamp while correctly removing public visibility.
  - `docs/product/PRESENCE_PUBLICATION_STATE_ACCEPTANCE.md` and focused regression tests protect the state transitions and snapshot relationship.

- [x] **P2-011 — Add Better Preview Workflows** — **Complete**
  - Merged [PR #124](https://github.com/jonathan-hansel-awo/onprez/pull/124) adds an authenticated copy-preview-link action and a private route that renders the latest saved draft through the canonical presence renderer.
  - Preview links are signed to one business, page, and publication version, expire after 24 hours, and become invalid automatically when publishing increments the page version.
  - The private preview preserves real services, theme, contact data, and genuine trust signals while disabling booking and inquiry creation.
  - Private responses use no-cache, no-index, and no-referrer controls, and focused tests cover authorization, expiry, invalidation, and response headers.
  - `docs/product/PRIVATE_DRAFT_PREVIEW_ACCEPTANCE.md` distinguishes immediate editor preview, shareable saved-draft preview, and the live customer snapshot.

- [x] **P2-012 — Simplify Dashboard Navigation** — **Complete**
  - Merged [PR #125](https://github.com/jonathan-hansel-awo/onprez/pull/125) reduces the always-visible navigation to five core destinations grouped under Daily work and Your presence.
  - Inquiries, Analytics, Sharing, and Settings remain available behind one accessible More tools disclosure that automatically opens for an active advanced route.
  - The mobile drawer, desktop collapse behaviour, breadcrumbs, 44-pixel touch targets, `aria-current`, and disclosure semantics remain intact.
  - Exact route matching prevents Overview from appearing active on every nested dashboard route while preserving nested ownership for routes such as Settings and Presence.
  - `docs/product/DASHBOARD_NAVIGATION_ACCEPTANCE.md` and focused tests protect the information architecture, route preservation, and active-route rules.

---

## Phase 8 — Trust, Positioning, and Marketing Integrity

- [x] **P2-013 — Remove Unverified Metrics** — **Complete**
  - Merged [PR #126](https://github.com/jonathan-hansel-awo/onprez/pull/126) removes the fabricated live-activity stream, fictional testimonials, booking and visit counts, upgrades, ratings, time-saving claims, and before/after outcome metrics from the public homepage.
  - The underlying fictional activity and testimonial fixtures and rendering components were deleted rather than merely relabelled.
  - `docs/product/MARKETING_CLAIMS_POLICY.md` requires durable evidence, an owner, a measurement window, appropriately scoped wording, consent where relevant, and a review date before future quantitative or testimonial claims are published.
  - Regression coverage prevents the deleted sources and known unsupported claims from returning.

- [x] **P2-014 — Sharpen Homepage Positioning** — **Complete**
  - Delivered explicitly by [PR #65](https://github.com/jonathan-hansel-awo/onprez/pull/65) and strengthened by the redesigned product-led hero in [PR #95](https://github.com/jonathan-hansel-awo/onprez/pull/95).

- [x] **P2-015 — Add Trust Pages** — **Complete**
  - Privacy Policy, Terms of Service, Cookie Policy, consent controls, support/security contact routes, and legal metadata were delivered by [PR #62](https://github.com/jonathan-hansel-awo/onprez/pull/62).
  - Formal legal review and final operator address remain pre-paid-launch operational requirements, not missing product routes.

- [x] **P2-016 — Replace Generic Social Proof with Product Proof** — **Complete**
  - Realistic interactive examples, catalogue templates, the client journey scenario, working booking previews, feature walkthroughs, and transparent pricing provide inspectable product proof.
  - Merged [PR #126](https://github.com/jonathan-hansel-awo/onprez/pull/126) removes the remaining fabricated activity and testimonial system so unsupported social proof no longer competes with demonstrable product behaviour.
  - Future customer evidence must satisfy the repository marketing-claims policy before it can replace or supplement product proof.

---

## Phase 9 — Performance and Scalability

- [x] **P2-017 — Add Core Web Vitals Monitoring** — **Complete**
  - Merged [PR #127](https://github.com/jonathan-hansel-awo/onprez/pull/127) adds consent-gated production reporting for LCP, INP, CLS, FCP, and TTFB through Next.js `useReportWebVitals`.
  - Measurements use coarse page groups and separate mobile and desktop classes without sending business handles, customer routes, query strings, full URLs, or form data.
  - A strict same-origin endpoint recomputes ratings server-side, records structured metrics with environment and release data, and creates grouped Sentry warnings for poor results.
  - Public and dashboard thresholds are explicit, Google Analytics receives the same dimensions when configured, and `docs/product/WEB_VITALS_MONITORING.md` defines 75th-percentile, release-comparison, and major-UI-change review procedures.
  - Focused tests protect metric coverage, segmentation, thresholds, privacy-safe payloads, server-side rating, validation, and alert behaviour.

- [x] **P2-018 — Cache Public Presence Pages by Handle** — **Complete**
  - Merged [PR #128](https://github.com/jonathan-hansel-awo/onprez/pull/128) replaces per-request public-route Prisma reads with one handle-scoped cache shared by page rendering and metadata.
  - The cache contains only published business fields, the protected published page snapshot, and published-review aggregates; services and next availability remain live through their public APIs.
  - A five-minute fallback lifetime is paired with immediate tag and rendered-route invalidation after publication, assisted live saves, profile/settings/branding/social updates, and theme changes.
  - Ordinary editor saves remain draft-only and do not invalidate or replace the customer-visible published snapshot.
  - `docs/product/PUBLIC_PRESENCE_CACHE_ACCEPTANCE.md` defines the cache identity, mutation matrix, privacy boundary, operational checks, and future invalidation rule.
  - Focused tests cover key construction, publication filtering, TTL, invalidation, assisted saves, publication changes, and architecture regressions.

- [x] **P2-019 — Optimise Image Delivery** — **Complete**
  - Merged [PR #129](https://github.com/jonathan-hansel-awo/onprez/pull/129) enforces purpose-specific upload dimensions and quality, strips metadata, and reuses exact tenant-scoped duplicate assets before compression or upload.
  - Customer-facing and upload-preview image components use responsive sizing and the configured modern-format delivery path without opting out of optimisation.
  - `docs/product/IMAGE_DELIVERY_ACCEPTANCE.md` records mobile image budgets, responsive delivery rules, and the repeatable slow-mobile verification procedure.
  - Focused tests protect resize policies, duplicate lookup and race handling, user feedback, responsive sizing, and the delivery contract.

- [x] **P2-020 — Add Load Testing for Critical Paths** — **Complete**
  - Implemented by [PR #130](https://github.com/jonathan-hansel-awo/onprez/pull/130).
  - The `Critical path load tests` workflow builds the selected revision against disposable PostgreSQL 16, seeds synthetic `.invalid` fixtures, and refuses remote application or database targets.
  - The baseline measures a warmed cached public page, availability calculation, handle checking, login, and five simultaneous booking attempts for one slot.
  - Release gates cover error rate, throughput, p95 latency, database-backed rate-limit ceilings, and the non-negotiable result of exactly one `201` booking winner plus four `409` conflicts.
  - JSON and Markdown reports retain per-scenario request counts, status counts, throughput, p50, p95, p99, and failures as workflow artifacts for 90 days.
  - `docs/product/CRITICAL_PATH_LOAD_TESTING.md` documents the launch baseline, known bottlenecks, interpretation procedure, and the distinction between isolated measurements and production capacity.

---

## Phase 10 — Privacy and Data Lifecycle

- [x] **P2-021 — Define Data Retention Rules** — **Complete**
  - `src/app/privacy/page.tsx` documents retention rules for accounts, media, appointments/customer records, logs, analytics, and backups.
  - Automated enforcement should be added where required, but the action item’s definition and public documentation criteria are met.

- [x] **P2-022 — Add Export and Deletion Workflows** — **Complete**
  - Implemented by [PR #131](https://github.com/jonathan-hansel-awo/onprez/pull/131).
  - `/account/data` provides password-verified, rate-limited account and owner-only business JSON exports with private no-store downloads and explicit authentication-secret exclusions.
  - Account deletion is a durable 14-day staged request that can be cancelled and moves owned businesses, future bookings, or payment records into retention and ownership review instead of cascading them.
  - Owners, admins, and managers can anonymise customer PII from the Customers page while retaining booking, service, status, policy, payment, and aggregate facts that may remain legally or operationally required.
  - Lifecycle actions are recorded in persistent security audit events whose account relation uses `ON DELETE SET NULL`; exported payloads, passwords, tokens, and customer identity are not copied into those events.
  - `docs/product/DATA_EXPORT_AND_DELETION_WORKFLOWS.md` defines export boundaries, the retention matrix, safe terminal-processing procedure, provider and backup limitations, and acceptance evidence.

- [x] **P2-023 — Review PII Handling** — **Complete**
  - Implemented by [PR #132](https://github.com/jonathan-hansel-awo/onprez/pull/132).
  - `docs/privacy/PII_INVENTORY.json` is the machine-readable source of truth for 129 identified database fields across five processing activities, including protection/encryption decisions, retention, deletion action, and named ownership.
  - `docs/privacy/PII_HANDLING_REVIEW.md` records the controller/processor boundaries, source-to-provider data-flow map, allowed/prohibited destinations, retention matrix, open hardening decisions, and quarterly review procedure.
  - `npm run privacy:audit` validates the inventory against Prisma, discovers likely new PII fields, verifies analytics/logging/Sentry/push/calendar URL safeguards, and becomes overdue automatically after the recorded review date.
  - The audit runs in every pull-request quality gate and in a scheduled Monday workflow.
  - Current flows no longer send optional-analytics query strings, signup email or MFA challenge data in URLs, current booking-lookup email in GET URLs, customer identity in push payloads, or customer contact data in Google Calendar template URLs.
  - Structured logging and Sentry scrubbing now filter contact and network identifiers, and MFA completion returns HttpOnly session cookies instead of browser-stored tokens.
  - Provider-account configuration checks, application-level encryption for web-push credentials, and keyed hashing for invitation tokens are explicit pre-scale operational/hardening decisions with owners; they are no longer undocumented PII handling gaps.

---

## Phase 11 — Communications

- [x] **P2-024 — Add Email Delivery Logging** — **Complete**
  - Implemented by [PR #133](https://github.com/jonathan-hansel-awo/onprez/pull/133).
  - Booking, appointment, reminder and inquiry emails now create tenant-scoped delivery records with append-only application and Resend provider events.
  - Signed raw-body Resend webhooks idempotently reconcile sent, delivered, delayed, bounced, complained, failed and suppressed outcomes by provider message ID.
  - Dashboard notification settings show masked delivery history and allow authorised, same-origin, rate-limited retries only for failed or delayed messages, with a three-attempt ceiling and current-recipient/status checks.
  - Hard bounces, complaints and provider suppressions create keyed global recipient suppressions that block future tracked sends and cannot be bypassed from the business dashboard.
  - Delivery records retain no plaintext recipient, subject, body, attachments or raw webhook payload; the PII inventory now classifies 142 fields and the recurring privacy audit protects this boundary.
  - `docs/product/EMAIL_DELIVERY_OPERATIONS.md` defines Resend setup, webhook events, retry rules, bounce/complaint handling, test recipients, 90-day operational retention and acceptance checks.

- [x] **P2-025 — Add Calendar Links** — **Complete**
  - Delivered by [PR #109](https://github.com/jonathan-hansel-awo/onprez/pull/109): Google and Outlook links, `.ics` attachments, stable event IDs, and optional automatic Google Calendar synchronisation.

- [x] **P2-026 — Add Notification Preferences** — **Complete**
  - Delivered by [PR #108](https://github.com/jonathan-hansel-awo/onprez/pull/108), with later PWA push controls and delivery verification.

---

## Phase 12 — SEO and Handle Durability

- [x] **P2-027 — Improve Presence SEO** — **Complete**
  - Implemented by [PR #134](https://github.com/jonathan-hansel-awo/onprez/pull/134).
  - Business Profile now exposes bounded search title, description, keywords, and an owner-only search-engine visibility control; non-owners are blocked in both the UI and API.
  - Opted-out pages remain shareable by direct link but emit `noindex, nofollow` and are excluded from the sitemap; sitemap membership also requires an active, published business and published home page.
  - Presence JSON-LD is generated server-side from the cached published snapshot with conservative `LocalBusiness` subtypes, structured addresses, geo coordinates, opening hours, published-review aggregates, active service offers, web-page and breadcrumb entities, and injection-safe serialization.
  - FAQ schema now includes only complete, de-duplicated questions from visible published FAQ sections; hidden, empty, duplicate, and draft-only FAQ content cannot enter the markup, and the duplicate client-side script was removed.
  - `npm run seo:validate` runs in CI against realistic spa and consultancy fixtures, while focused tests cover metadata, sitemap filtering, owner authorization, JSON-LD richness, FAQ fidelity, safe URLs, and script escaping.
  - `docs/product/PRESENCE_SEO_ACCEPTANCE.md` records the indexing, metadata, structured-data, release-validation, and no-guaranteed-rich-result contract.
  - Deploy migration `20260801180000_presence_seo_controls` before relying on the new setting in production; no new environment variable is required.

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

- This tracker counts the current action item's implementation PR as complete after its material acceptance checks pass; the next “next item” reconciliation must confirm that it merged.
- The audit does not prove that every deployment secret, webhook, OAuth consent screen, provider billing alert, email alias, uptime destination, or scheduled workflow is configured correctly in production.
- Legal pages are operational drafts and should receive professional review before paid launch.
- Backup, restore, payment, email, calendar, push, and incident procedures require periodic real-world drills even when their repository action item is checked.
- New features must not silently regress previously completed security, tenancy, booking, privacy, or operational acceptance criteria.

## Change log

| Date          | Change                                                                                                                                                                                              | PR                                                                                                                                                                                                                                                                |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 August 2026 | Completed P2-027 with owner-controlled indexing, published-snapshot FAQ and local-business JSON-LD, sitemap filtering, and realistic recurring SEO validation.                                      | [#134](https://github.com/jonathan-hansel-awo/onprez/pull/134)                                                                                                                                                                                                    |
| 1 August 2026 | Completed P2-024 with privacy-minimised email delivery history, signed Resend event reconciliation, safe dashboard retries, and bounce/complaint suppression.                                       | [#133](https://github.com/jonathan-hansel-awo/onprez/pull/133)                                                                                                                                                                                                    |
| 1 August 2026 | Completed P2-023 with the canonical PII inventory/data-flow map, field protection and lifecycle ownership, privacy-boundary fixes, and recurring automated audit.                                   | [#132](https://github.com/jonathan-hansel-awo/onprez/pull/132)                                                                                                                                                                                                    |
| 1 August 2026 | Completed P2-022 with password-verified account/business exports, staged account deletion, customer anonymisation, durable lifecycle auditing, and the retention-safe processing contract.          | [#131](https://github.com/jonathan-hansel-awo/onprez/pull/131)                                                                                                                                                                                                    |
| 1 August 2026 | Reconciled merged P2-018 and P2-019 work, completed P2-020 with isolated critical-path capacity and concurrent-booking correctness tests, and aligned the tracker with one-item implementation PRs. | [#128](https://github.com/jonathan-hansel-awo/onprez/pull/128) / [#129](https://github.com/jonathan-hansel-awo/onprez/pull/129) / [#130](https://github.com/jonathan-hansel-awo/onprez/pull/130)                                                                  |
| 31 July 2026  | Marked merged P2-011, P2-012, P2-013, and P2-016 complete and recorded consented Core Web Vitals monitoring pending PR #127 merge.                                                                  | [#124](https://github.com/jonathan-hansel-awo/onprez/pull/124) / [#125](https://github.com/jonathan-hansel-awo/onprez/pull/125) / [#126](https://github.com/jonathan-hansel-awo/onprez/pull/126) / [#127](https://github.com/jonathan-hansel-awo/onprez/pull/127) |
| 31 July 2026  | Marked merged P2-010 complete and recorded P2-011 private, expiring, non-indexed draft-preview implementation pending PR #124 merge.                                                                | [#123](https://github.com/jonathan-hansel-awo/onprez/pull/123) / [#124](https://github.com/jonathan-hansel-awo/onprez/pull/124)                                                                                                                                   |
| 31 July 2026  | Reconciled all successfully merged P2-001 through P2-005 work, recorded PR #121’s catalogue-wide booking demos and fictional identity separation, and formalised the “next item” selection rule.    | [#116](https://github.com/jonathan-hansel-awo/onprez/pull/116)–[#121](https://github.com/jonathan-hansel-awo/onprez/pull/121)                                                                                                                                     |
| 31 July 2026  | Marked P2-003 complete after PR #119 merged and revalidated P2-004 conversion, safe-area, theme, documentation, and regression guarantees.                                                          | [#119](https://github.com/jonathan-hansel-awo/onprez/pull/119) / [#120](https://github.com/jonathan-hansel-awo/onprez/pull/120)                                                                                                                                   |
| 31 July 2026  | Marked P2-002 complete after PR #118 merged and recorded the P2-003 beauty-and-wellness niche decision, product copy, demos, tests, and real-user validation protocol.                              | [#118](https://github.com/jonathan-hansel-awo/onprez/pull/118) / [#119](https://github.com/jonathan-hansel-awo/onprez/pull/119)                                                                                                                                   |
| 30 July 2026  | Recorded the P2-001 canonical loop, tenant-scoped milestone analytics, 8:45 target, regression coverage, and the remaining observed-user validation requirement.                                    | [#116](https://github.com/jonathan-hansel-awo/onprez/pull/116)                                                                                                                                                                                                    |
| 30 July 2026  | Marked P1-008 complete after the timezone-aware availability fix merged; updated totals, audit baseline, and chronological next step.                                                               | [#114](https://github.com/jonathan-hansel-awo/onprez/pull/114) / [#115](https://github.com/jonathan-hansel-awo/onprez/pull/115)                                                                                                                                   |
| 30 July 2026  | Created the tracker and audited all 61 action items against current `main` and merged history.                                                                                                      | [#115](https://github.com/jonathan-hansel-awo/onprez/pull/115)                                                                                                                                                                                                    |
