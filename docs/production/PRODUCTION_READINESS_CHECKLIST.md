# OnPrez Production Readiness Checklist

## Readiness Decision

**Current status: NOT READY FOR PUBLIC ONBOARDING**

OnPrez may be developed and tested with synthetic data, but it must not onboard unrestricted real
customers or rely on this checklist as complete until every **Launch Blocker** is checked with current
evidence and the final approval record is signed.

This document is the authoritative launch gate. Passing CI alone does not mean the platform is
production-ready.

| Review field          | Value                                                        |
| --------------------- | ------------------------------------------------------------ |
| Target launch phase   | _Set before review: internal / closed pilot / public_        |
| Release or commit     | _Required_                                                   |
| Review owner          | _Required_                                                   |
| Security reviewer     | _Required_                                                   |
| Privacy owner         | _Required_                                                   |
| Review started        | _YYYY-MM-DD_                                                 |
| Evidence frozen       | _YYYY-MM-DD HH:MM UTC_                                       |
| Next mandatory review | _Before every launch phase and material architecture change_ |

## How to Use This Checklist

1. Copy or reset this checklist for the release under review; never inherit checkmarks without
   revalidating their evidence.
2. Link durable evidence for every checked item: workflow run, test report, screenshot, runbook,
   provider setting, ticket, query result, or signed decision.
3. Mark an item complete only when its stated verification succeeds in the target environment.
4. Record every exception in the exception register. A Launch Blocker cannot be waived for public
   onboarding merely because a workaround exists.
5. Stop the release if evidence is missing, stale, contradictory, or cannot be reproduced.

### Gate Definitions

- **Launch Blocker:** must pass before public onboarding or storage of real customer booking data.
- **Pilot Gate:** must pass before inviting any external pilot user.
- **Follow-up Safeguard:** may follow a tightly controlled pilot only when it has an owner and due
  date; it must pass before public launch unless explicitly reclassified by the security and privacy
  owners.

## Verified Engineering Baseline

These repository controls have already been implemented, but must still be reconfirmed for the launch
commit and target environment.

- [x] CI runs formatting, lint, type-check, Prisma validation, tests, and production build on pull
      requests (`.github/workflows/test.yml`).
- [x] Application builds do not run migrations, and a regression test protects this separation
      (`__tests__/deployment-safety.test.ts`).
- [x] Preview and production migrations use a separate, manually triggered workflow with preview
      verification before production (`.github/workflows/migrate.yml`).
- [x] Restore drills have a read-only comparison workflow and redacted evidence report
      (`.github/workflows/restore-verification.yml`). This control does not satisfy DB-05 until a
      real isolated Neon restore run passes.
- [x] Public debug/environment endpoints have been removed or reduced to a minimal health response.
- [x] API route access expectations and the completed authorisation audit are recorded in
      `docs/security/API_ROUTE_ACCESS_MATRIX.md`.

These checkmarks describe source controls, not the final production configuration.

# Launch Blockers

## 1. Release Integrity and Change Control

- [ ] **REL-01 — Protected release branch.** `main` requires the named **Quality gates** check and
      prevents direct pushes or merging when it fails.  
       **Evidence:** screenshot/export of the active GitHub ruleset plus a deliberately failing PR blocked
      from merge.
- [ ] **REL-02 — Reproducible clean build.** The launch commit completes `npm ci`, formatting, lint,
      type-check, Prisma validation, all tests, and `npm run build` from a clean checkout.  
       **Evidence:** successful GitHub Actions URL for the exact commit.
- [ ] **REL-03 — Dependency review.** Production and development dependencies have been scanned;
      every critical/high finding is fixed or blocks launch.  
       **Evidence:** dated dependency/security scan attached to the release.
- [ ] **REL-04 — Release scope recorded.** User-visible changes, schema changes, feature flags,
      known limitations, rollback trigger, and release owner are documented.  
       **Evidence:** approved release record linked here.
- [ ] **REL-05 — Rollback rehearsed.** The previous application release can be restored without
      reversing an incompatible database migration.  
       **Evidence:** staging rollback exercise with timings and outcome.

## 2. Authentication and Session Security

- [ ] **AUTH-01 — Server-side authentication.** Every protected page, route handler, and server
      action rejects missing, expired, revoked, malformed, and fabricated sessions.  
       **Evidence:** automated negative-path tests plus manual API checks in preview.
- [ ] **AUTH-02 — Session secrets protected at rest.** Session and refresh tokens are stored only as
      non-reversible hashes, refresh tokens rotate on use, and reuse is detected.  
       **Evidence:** schema/service review and database sample showing no reusable raw tokens.
- [ ] **AUTH-03 — Cookie policy verified.** Authentication cookies are `HttpOnly`, `Secure` in
      production, appropriately scoped, use the intended `SameSite` policy, expire correctly, and are
      cleared on logout.  
       **Evidence:** browser and response-header capture from production-like preview.
- [ ] **AUTH-04 — Credential flows tested.** Signup, verification, login, MFA, backup codes, password
      reset, logout, session termination, and account lockout work end to end without account
      enumeration or token replay.  
       **Evidence:** passing end-to-end test report and replay/expiry cases.
- [ ] **AUTH-05 — Password controls verified.** Password policy, hashing cost, reset invalidation,
      brute-force controls, and breached/common-password decision are documented and tested.  
       **Evidence:** security test results and approved password-policy decision.
- [ ] **AUTH-06 — Privileged account protection.** Production owners/admins use MFA, unique accounts,
      and least privilege; shared production credentials do not exist.  
       **Evidence:** access review signed by the production owner.

## 3. Authorisation and Tenant Isolation

- [ ] **TEN-01 — Canonical tenant authorisation.** Business-scoped reads and writes use the canonical
      server-side business-access layer; client-supplied business or user identifiers are never trusted
      alone.  
       **Evidence:** route inventory with no unresolved or “needs review” entries.
- [ ] **TEN-02 — Cross-tenant tests pass.** Users cannot read, mutate, infer, upload into, or enumerate
      another business's appointments, customers, services, staff, settings, media, inquiries, or private
      notes.  
       **Evidence:** owner/admin/manager/member/non-member matrix tests for every scoped resource.
- [ ] **TEN-03 — Role boundaries pass.** Each role can perform only its approved operations, including
      invitation, membership, ownership, billing, MFA, and destructive settings actions.  
       **Evidence:** automated role tests and signed role-permission matrix.
- [ ] **TEN-04 — Object identifiers are non-authoritative.** Changing path, query, or body IDs never
      bypasses ownership checks, including nested resources.  
       **Evidence:** IDOR/BOLA security test report.
- [ ] **TEN-05 — Public/private fields separated.** Public presence and booking APIs return an
      explicit allowlist and expose no private customer, staff, configuration, security, or unpublished
      data.  
       **Evidence:** response snapshots and schema review.

## 4. Booking and Data Integrity

- [ ] **BOOK-01 — Atomic conflict prevention.** Concurrent requests cannot create overlapping or
      duplicate bookings; enforcement is transaction-safe and not dependent on an earlier availability
      check.  
       **Evidence:** concurrency test demonstrating one accepted booking for one slot.
- [ ] **BOOK-02 — Time correctness.** Booking, availability, reminders, rescheduling, cancellation,
      daylight-saving transitions, time zones, minimum notice, and advance limits are verified.  
       **Evidence:** automated boundary tests covering UK DST changes and configured business zones.
- [ ] **BOOK-03 — State transitions constrained.** Appointment and payment/status transitions reject
      impossible or repeated operations and remain idempotent on retry.  
       **Evidence:** state-transition test matrix.
- [ ] **BOOK-04 — Referential integrity verified.** Services, variants, staff, customers, and bookings
      cannot be combined across businesses; deletion behaviour is intentional and tested.  
       **Evidence:** database constraints plus negative-path integration tests.
- [ ] **BOOK-05 — Failure communication safe.** A failed email, analytics event, or optional
      integration does not corrupt a successful booking, and users receive an accurate outcome.  
       **Evidence:** injected-failure integration tests.

## 5. Database, Migrations, and Recovery

- [ ] **DB-01 — Environment separation.** Development, preview, and production use distinct Neon
      branches and environment-scoped credentials; preview cannot mutate production.  
       **Evidence:** redacted provider configuration and connection-identity query from each environment.
- [ ] **DB-02 — Controlled migrations.** Production migration secrets exist only in the protected
      `production` GitHub environment, production runs only from `main`, and approval is enforced.  
       **Evidence:** GitHub environment configuration and successful no-op/status workflow run.
- [ ] **DB-03 — Migration rehearsed.** Every pending production migration has been reviewed as SQL,
      applied to representative preview data, timed, and checked for locking/data-loss risk.  
       **Evidence:** approved migration review and preview workflow run.
- [ ] **DB-04 — Backup policy verified.** Production backup/PITR coverage, retention, region, access,
      encryption, and responsible owner are recorded.  
       **Evidence:** current Neon plan/settings capture and written recovery point objective (RPO).
- [ ] **DB-05 — Restore drill passed.** A production-like backup has been restored into an isolated
      branch, validated, and timed without altering production.  
       **Evidence:** dated restore report, validation queries, and recovery time objective (RTO) result.
- [ ] **DB-06 — Recovery runbook approved.** Failed, partially applied, and successfully applied but
      harmful migrations have distinct recovery procedures; `migrate reset` is prohibited in
      production.  
       **Evidence:** reviewed `docs/MIGRATIONS.md` and named incident owner.

## 6. Secrets, Infrastructure, and Third Parties

- [ ] **SEC-01 — Production secret inventory complete.** Every required environment variable has an
      owner, purpose, location, rotation method, and failure behaviour; no production secret exists in
      source, logs, screenshots, or client bundles.  
       **Evidence:** redacted inventory and secret scan.
- [ ] **SEC-02 — Secrets are strong and independent.** JWT, MFA encryption/pepper, token peppers,
      database, Resend, Cloudinary, and provider secrets are production-specific and are not reused
      across environments.  
       **Evidence:** rotation record confirming identifiers—not secret values.
- [ ] **SEC-03 — Least-privilege provider access.** GitHub, Vercel, Neon, domain/DNS, Resend, and
      Cloudinary accounts have MFA, least privilege, recovery contacts, and no stale collaborators or
      tokens.  
       **Evidence:** dated provider access review.
- [ ] **SEC-04 — Domain and transport security verified.** Production uses valid HTTPS, safe redirects,
      intended canonical host, secure DNS ownership, and appropriate security headers without mixed
      content.  
       **Evidence:** automated header/TLS scan and browser capture.
- [ ] **SEC-05 — File upload controls verified.** Authentication/tenant permissions, byte signatures,
      MIME allowlists, size limits, non-executable delivery, unpredictable names, deletion, and abuse
      limits are tested.  
       **Evidence:** upload security tests and Cloudinary delivery settings.
- [ ] **SEC-06 — Processor register complete.** Hosting, database, email, media, analytics, support,
      and any other processors have an approved purpose, data categories, location/transfer basis,
      retention, and contract/DPA status.  
       **Evidence:** signed processor/subprocessor register.

## 7. Abuse Prevention and Application Security

- [ ] **APPSEC-01 — Sensitive endpoints rate-limited.** Login, signup, verification, password reset,
      MFA, booking, inquiry, invitation, search, uploads, and email-triggering actions have tested limits
      that work across multiple application instances.  
       **Evidence:** endpoint inventory and limit/bypass tests.
- [ ] **APPSEC-02 — Input and output boundaries enforced.** Server-side schemas constrain size, type,
      format, enum values, dates, URLs, pagination, and rich content; responses reveal no stack traces,
      secrets, SQL, or internal configuration.  
       **Evidence:** fuzz/negative tests and production error-response samples.
- [ ] **APPSEC-03 — Browser attack controls verified.** XSS, CSRF, open redirect, clickjacking,
      unsafe rich content, CORS, and cache-control decisions are tested for authenticated and public
      pages.  
       **Evidence:** focused security test report and header configuration.
- [ ] **APPSEC-04 — Dependency and platform versions supported.** Node, Next.js, Prisma, database, and
      critical libraries are supported and have no unaddressed critical/high advisories.  
       **Evidence:** version inventory and vulnerability review.
- [ ] **APPSEC-05 — Security testing completed.** Automated tests cover OWASP-relevant risks and an
      independent manual review or penetration test has no unresolved launch-blocking finding.  
       **Evidence:** signed test report with remediation links.

## 8. Observability and Incident Response

- [ ] **OBS-01 — Production error monitoring active.** Unhandled server/client failures are captured
      with release/environment context, alerting, and personal-data scrubbing.  
       **Evidence:** synthetic production-like exception received and alerted.
- [ ] **OBS-02 — Critical journey monitoring active.** Signup, login, booking creation, email delivery,
      database health, migration failure, and elevated 5xx/latency have measurable signals and owners.  
       **Evidence:** dashboard and alert inventory with thresholds.
- [ ] **OBS-03 — Logs are safe and useful.** Structured logs include request/correlation context and
      security events while excluding passwords, raw tokens, MFA secrets/codes, cookies, connection
      strings, and unnecessary personal data.  
       **Evidence:** sampled production-like logs and redaction tests.
- [ ] **OBS-04 — Alerts reach a human.** At least two contact routes are tested; alert ownership,
      escalation, quiet hours, and acknowledgement expectations are recorded.  
       **Evidence:** dated alert drill.
- [ ] **IR-01 — Incident runbook approved.** Severity, triage, containment, evidence preservation,
      credential rotation, provider escalation, recovery, communications, and post-incident review are
      documented.  
       **Evidence:** linked runbook and tabletop exercise.
- [ ] **IR-02 — Privacy breach process timed.** The team can assess risk, record every breach decision,
      and notify the ICO within the applicable 72-hour window when required.  
       **Evidence:** tabletop timeline, decision template, ICO contact route, and named privacy owner.
- [ ] **IR-03 — Emergency access controlled.** Break-glass access is minimal, logged, MFA-protected,
      tested, and reviewed after use.  
       **Evidence:** access procedure and drill record.

## 9. Privacy, Legal, and User Rights

- [ ] **PRIV-01 — Data map and lawful basis approved.** Every personal-data field and event has a
      purpose, lawful basis, source, recipient, storage location, retention period, and deletion method.
      Optional marketing/analytics is separated from service delivery.  
       **Evidence:** current record of processing/data-flow map approved by the privacy owner.
- [ ] **PRIV-02 — Privacy notice is complete and reachable.** It identifies the controller, purposes,
      lawful bases, recipients/processors, international transfers, retention, rights, complaint route,
      ICO route, and contact details, and matches actual processing.  
       **Evidence:** legal review and production URL.
- [ ] **PRIV-03 — Terms and business responsibilities approved.** Terms explain platform scope,
      acceptable use, availability, user/business responsibilities, suspension, liability, and booking
      relationship; placeholder links are removed.  
       **Evidence:** approved terms URL and link crawl.
- [ ] **PRIV-04 — User rights work end to end.** Identity-verified access, correction, deletion,
      restriction/objection, and portability requests have owners, deadlines, processor propagation,
      audit records, and tested procedures.  
       **Evidence:** completed synthetic access and deletion requests.
- [ ] **PRIV-05 — Retention and deletion enforced.** Retention schedules cover accounts, sessions,
      security logs, customers, bookings, inquiries, uploads, emails, backups, and abandoned/unverified
      accounts; expiry is automated or operationally scheduled.  
       **Evidence:** approved schedule and deletion-job/test output.
- [ ] **PRIV-06 — Cookie/analytics consent correct.** A current cookie audit classifies storage;
      non-essential cookies or analytics do not run before valid consent, and withdrawal is as easy as
      acceptance. If none exist, that finding is documented.  
       **Evidence:** browser storage/network audit and consent test.
- [ ] **PRIV-07 — Data minimisation verified.** Forms, logs, analytics, exports, and provider payloads
      collect only necessary data; sensitive/free-text fields have explicit need and handling rules.  
       **Evidence:** field-by-field review.
- [ ] **PRIV-08 — ICO obligations assessed.** UK controller/processor roles, registration or fee,
      DPIA triggers, international transfers, age/children risk, and DPO requirement have documented
      decisions.  
       **Evidence:** dated assessment by a competent privacy owner/adviser.

## 10. Email, Notifications, and External Integrations

- [ ] **EXT-01 — Transactional email authenticated.** Production sending domain has valid SPF, DKIM,
      DMARC, verified sender, monitored delivery/bounce behaviour, and no secret exposed to the client.
      **Evidence:** provider verification and DNS checks.
- [ ] **EXT-02 — Email content and links verified.** Verification, reset, security, invitation,
      booking, cancellation, and reminder messages use the production domain, expire safely, avoid
      leaking private data, and render accessibly.  
       **Evidence:** inbox tests across representative clients.
- [ ] **EXT-03 — Failure and retry policy safe.** Provider timeouts, retries, duplicate delivery,
      bounce, and outage behaviour cannot duplicate bookings or misstate success.  
       **Evidence:** injected provider-failure tests.
- [ ] **EXT-04 — Webhooks/jobs authenticated and idempotent.** Every scheduled task or webhook
      validates origin/signature, resists replay, records outcomes, and can be safely retried.  
       **Evidence:** integration tests and replay cases, or documented “not currently used.”

## 11. Reliability, Performance, and Capacity

- [ ] **RELIA-01 — Critical user journeys pass in production-like preview.** Signup, verification,
      login/MFA, business setup, service publication, public discovery, booking, reschedule/cancel, and
      account security are tested on desktop and mobile.  
       **Evidence:** dated release smoke-test report.
- [ ] **RELIA-02 — Load target defined and met.** Expected launch traffic, booking concurrency,
      database connections, API latency, error rate, and provider quotas have thresholds and test
      results.  
       **Evidence:** load/capacity report with headroom.
- [ ] **RELIA-03 — Degraded dependencies handled.** Database, email, media, DNS, and hosting failures
      yield safe errors, timeouts, and recovery without corrupting state or exposing internals.  
       **Evidence:** fault-injection results.
- [ ] **RELIA-04 — Health checks are minimal and actionable.** Public health output leaks no
      configuration; internal checks and provider monitoring distinguish app, database, and dependency
      failures.  
       **Evidence:** response samples and monitor configuration.
- [ ] **RELIA-05 — Operational limits documented.** Neon, Vercel, Resend, Cloudinary, domain, and any
      analytics quotas/cost alerts have owners and escalation thresholds.  
       **Evidence:** quota inventory and alert screenshots.

## 12. User Safety, Accessibility, and Support

- [ ] **UX-01 — Accessibility review passed.** Keyboard navigation, focus, labels, errors, status
      announcements, contrast, zoom, reduced motion, and screen-reader journeys meet the chosen WCAG
      target with no critical/high issue.  
       **Evidence:** automated and manual accessibility report.
- [ ] **UX-02 — Mobile and browser support verified.** Defined supported browsers/devices complete
      critical journeys without clipped controls, inaccessible modals, or data loss.  
       **Evidence:** browser/device matrix.
- [ ] **UX-03 — Destructive actions are recoverable or explicit.** Cancellation, deletion, member
      removal, MFA changes, and session termination communicate scope and require suitable confirmation
      or re-authentication.  
       **Evidence:** UX/security review and tests.
- [ ] **SUP-01 — Support route operational.** Users can report account, privacy, booking, abuse, and
      accessibility issues; ownership, expected response, identity verification, and escalation are
      documented.  
       **Evidence:** successful test enquiry and support runbook.
- [ ] **SUP-02 — Launch communications ready.** Status/outage, security, privacy, and materially
      changed terms notices have approved templates and authorised senders.  
       **Evidence:** template set and communications owner.

# Pilot Gates

The following must also pass before any external closed pilot. A pilot does not waive Launch
Blockers involving security, privacy, data loss, or tenant isolation.

- [ ] Pilot users, businesses, duration, data types, support channel, and exit criteria are explicitly
      bounded.
- [ ] Pilot participants understand the product is pre-release and know how to report problems.
- [ ] Daily error, abuse, booking-integrity, email, and capacity review has a named owner.
- [ ] A stop condition exists for data exposure, cross-tenant access, booking corruption, security
      control failure, or unrecoverable user impact.
- [ ] Pilot data can be exported, corrected, and deleted using the approved privacy process.

# Follow-up Safeguards

These require an owner and due date before pilot approval and must be completed before public launch
unless formally promoted to a Launch Blocker by risk review.

- [ ] Automated dependency-update workflow with controlled review.
- [ ] Scheduled restore drills and incident/tabletop exercises.
- [ ] Security-header, accessibility, and broken-link regression monitoring.
- [ ] Automated retention/deletion reporting and processor compliance review.
- [ ] Capacity and cost trend dashboards with forecast thresholds.
- [ ] Independent penetration test cadence based on product risk and launch scale.

# Exception Register

No exception is valid without an owner, expiry date, compensating control, and security/privacy
approval. Public-launch blockers cannot be accepted solely by the feature author.

| Gate ID | Risk and reason | Compensating control | Owner | Expiry | Security approval | Privacy approval |
| ------- | --------------- | -------------------- | ----- | ------ | ----------------- | ---------------- |
| _None_  |                 |                      |       |        |                   |                  |

# Final Launch Approval

- [ ] Every Launch Blocker is checked with evidence for the exact release and target environment.
- [ ] Every exception is unexpired and has all required approvals.
- [ ] Pilot findings classified critical/high are resolved and retested.
- [ ] Release, rollback, incident, support, security, and privacy owners confirm availability.
- [ ] The production migration and application deployment order is approved.

| Approval                 | Name | Decision         | Date/time UTC | Evidence/signature |
| ------------------------ | ---- | ---------------- | ------------- | ------------------ |
| Engineering owner        |      | Approve / Reject |               |                    |
| Security reviewer        |      | Approve / Reject |               |                    |
| Privacy owner            |      | Approve / Reject |               |                    |
| Product/operations owner |      | Approve / Reject |               |                    |

**Final decision:** `NOT REVIEWED / APPROVED / REJECTED`

# Review History

Update this table before each launch phase and after any material change to authentication,
authorisation, data model, processors, deployment, monitoring, privacy scope, or recovery strategy.

| Date         | Release | Phase | Decision | Reviewer | Summary/link |
| ------------ | ------- | ----- | -------- | -------- | ------------ |
| _YYYY-MM-DD_ |         |       |          |          |              |

# Reference Standards and Guidance

- [OWASP Application Security Verification Standard](https://owasp.org/www-project-application-security-verification-standard/)
- [ICO data protection self-assessment](https://ico.org.uk/for-organisations/advice-and-services/data-protection-self-assessment/)
- [ICO personal data breach guidance](https://ico.org.uk/for-organisations/report-a-breach/personal-data-breach/)
- [UK National Cyber Security Centre backup guidance](https://www.ncsc.gov.uk/collection/small-business-guide/backing-your-data-up)
- [Prisma production migration guidance](https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production)
- [GitHub deployment environments](https://docs.github.com/actions/deployment/targeting-different-environments/managing-environments-for-deployment)

These references support the review but do not replace legal advice, provider-specific verification,
or an independent security assessment appropriate to the launch risk.
