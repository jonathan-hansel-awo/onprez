# OnPrez Incident Response Runbooks

These runbooks are the production response procedures for OnPrez. They cover the first response,
safe recovery, communication, and follow-up for the incidents most likely to affect availability,
bookings, authentication, or customer data.

Use them with:

- [Production uptime monitoring](./UPTIME_MONITORING.md)
- [Production error monitoring](./ERROR_MONITORING.md)
- [Database migrations](../MIGRATIONS.md)
- [Environment variables](../ENVIRONMENT_VARIABLES.md)
- [Production readiness checklist](../production/PRODUCTION_READINESS_CHECKLIST.md)

## Operating principles

1. **Protect people and data before restoring convenience.** Contain a suspected security or data
   incident before optimising availability.
2. **Assign one incident commander.** That person coordinates decisions, timestamps, owners, and
   updates. Responders should not make competing production changes.
3. **Prefer reversible changes.** Roll back application code or configuration before attempting an
   untested hotfix. Database recovery is a separate decision from application rollback.
4. **Preserve evidence.** Keep workflow URLs, deployment IDs, commit SHAs, timestamps, request IDs,
   correlation IDs, provider event IDs, and relevant redacted logs. Do not delete or modify evidence.
5. **Do not copy secrets or personal data into incident records.** Never paste access tokens,
   passwords, cookies, reset links, API keys, database URLs, full request bodies, customer notes, or
   email content into GitHub, chat, or tickets.
6. **Use UTC for the incident timeline.** Record the timezone explicitly if a source cannot show UTC.
7. **Make one production change at a time.** Record the change, owner, and result before proceeding.
8. **Do not use destructive Prisma commands in production.** `prisma migrate reset` and
   `prisma db push` are never incident-recovery commands.

## Severity and ownership

| Severity | Definition                                                                                                               | Initial response target | Update rhythm       |
| -------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------- | ------------------- |
| SEV-1    | Confirmed/suspected data exposure, account takeover at scale, or booking integrity failure affecting multiple businesses | Immediately             | Every 30 minutes    |
| SEV-2    | Production unavailable, authentication broadly unavailable, database outage, or active duplicate creation                | Within 15 minutes       | Every 60 minutes    |
| SEV-3    | Degraded non-critical function, isolated email failure, or failed deployment that never reached production               | Same working day        | At material changes |

The incident commander may raise or lower severity as evidence changes. For every incident, assign:

- **Incident commander:** owns severity, decisions, timeline, and closure.
- **Technical responder:** investigates and executes approved recovery actions.
- **Communications owner:** sends internal and customer updates.
- **Privacy/security owner:** required for suspected compromise or data exposure.

When OnPrez has only one available operator, that person holds all roles but must still keep a
timeline and request independent review before destructive database or security actions.

## Standard incident workflow

### First 10 minutes

1. Open an incident record using the template below and assign an incident commander.
2. Record the detection time, first known bad time, affected surface, and current severity.
3. Confirm the symptom from a second signal where possible:
   - GitHub production uptime workflow and `/api/health`
   - Vercel deployment/runtime logs
   - Sentry production events and release SHA
   - Neon metrics and query history
   - Resend status and delivery events
   - OnPrez structured events, joined by `requestId`, `correlationId`, `bookingId`, or `businessId`
4. Identify the latest deployment, migration, configuration, credential, or provider change.
5. Freeze unrelated production deployments, migrations, and secret changes until the incident
   commander lifts the freeze.
6. Choose the relevant runbook and record the next action before executing it.

### Incident record template

```text
Incident ID:
Title:
Severity:
Status: Investigating | Identified | Monitoring | Resolved
Detected at (UTC):
First known impact (UTC):
Incident commander:
Technical responder:
Communications owner:
Privacy/security owner (if applicable):
Affected routes/services:
Affected businesses/users (IDs or counts only):
Latest known-good deployment and commit:
Suspected triggering change:
Evidence links and safe identifiers:
Containment action and time:
Recovery action and time:
Verification results:
Customer communications:
Follow-up owner and due date:
```

### Communication rules

- State what customers can observe, not an unverified cause.
- Give a UTC timestamp and the time of the next update.
- Do not name an affected customer or business publicly.
- Do not promise that data is safe until the privacy/security owner has assessed the evidence.
- Use a single source of truth for updates; link to it rather than starting parallel threads.

Initial update:

```text
We are investigating an issue affecting [capability] from approximately [UTC time].
[Known user impact]. We have contained [what was safely contained, if confirmed] and
will provide another update by [UTC time].
```

Resolution update:

```text
The issue affecting [capability] was resolved at [UTC time]. Service has remained healthy
for [monitoring period]. [Any required customer action]. We are completing a review and
follow-up work to reduce the chance of recurrence.
```

## Runbook 1: Failed deployment

### Detection

- Vercel reports a failed build, failed deployment, or unhealthy production functions.
- GitHub quality gates pass but the production uptime workflow fails after deployment.
- Sentry error rate rises for the new release SHA.
- A public route, `/login`, `/dashboard`, a stable public handle, or `/api/health` returns an
  unexpected response.

### Impact assessment

1. Determine whether the failed deployment ever received production traffic.
2. Compare the production alias and Vercel deployment ID with the latest Git commit.
3. Test the monitored routes and one safe read-only business flow.
4. Check whether the deployment expected a database migration or new environment variable.
5. Classify as SEV-3 if production remained on the known-good deployment; use SEV-2 if customers are
   receiving errors or critical flows are unavailable.

### Immediate response

1. Stop further promotions and deployments.
2. Save the Vercel deployment URL, deployment ID, commit SHA, build/runtime error, and first failure
   timestamp. Redact environment values.
3. If production is unhealthy, select the most recent verified healthy production deployment in
   Vercel and initiate **Instant Rollback**.
4. If the bad deployment was never promoted, leave the current production deployment unchanged and
   fix the failing branch.
5. Do not run a migration to make a failed application build pass. Follow the failed-migration
   runbook if a schema change is involved.

### Rollback and recovery

1. Roll back the production alias to the last known-good Vercel deployment.
2. Verify that the old application remains compatible with the current database schema. If a
   migration has already run, do not reverse it automatically.
3. Confirm all production probes pass, then test login and one booking read path without modifying
   customer data.
4. Create a focused revert or fix PR. Let quality gates and a preview deployment pass before a new
   production release.
5. Monitor uptime and Sentry for at least 30 minutes before resolving a SEV-2 incident.

### Communication

- Internal: announce deployment freeze, affected release SHA, rollback owner, and verification
  status.
- Customer-facing: communicate only if customers saw errors or a critical capability was
  unavailable. Describe the affected capability, not build details.

### Follow-up

- Record why preview/quality gates did not catch the problem.
- Add a regression test or deployment check for the exact failure.
- Confirm every required Vercel variable is documented and scoped to the correct environment.
- Record rollback duration and update this runbook if any step was ambiguous.

## Runbook 2: Failed migration

### Detection

- **Deploy database migrations** fails in preview or production.
- `npm run db:migrate:status` reports a failed, pending, or diverged migration.
- `_prisma_migrations.logs` contains a failure for the selected migration.
- `/api/health` or application routes fail immediately after a migration.

### Impact assessment

1. Record the workflow run, environment, Git SHA, migration directory name, start time, and failure.
2. Determine whether the failure occurred in preview or production.
3. Determine which SQL statements committed and whether rows were modified or removed.
4. Check whether application code requiring the new schema is already serving production traffic.
5. Treat production data loss, corruption, or broad unavailability as SEV-1/SEV-2. A preview-only
   failure with no production effect is SEV-3.

### Immediate response

1. Stop application deployments and all additional migration runs.
2. Preserve the workflow logs and failed `_prisma_migrations` record. Never repeatedly rerun the
   workflow without understanding the partial state.
3. Keep or restore application code that is compatible with the pre-migration and partial schema.
4. Use read-only inspection to compare the database state with the reviewed `migration.sql`.
5. If destructive data change may have occurred, identify a verified Neon restore point before any
   repair and involve a second reviewer.

### Rollback and recovery

Choose exactly one reviewed path:

**Failed migration that can be safely retried**

1. Revert any committed partial SQL with reviewed, explicit SQL.
2. Only after the database is in the pre-migration state, mark the failed migration rolled back:

   ```bash
   npx prisma migrate resolve --rolled-back MIGRATION_NAME
   ```

3. Correct the migration in a new change, test it against an isolated/restored Neon branch, then
   deploy it through the manual workflow (preview first, production approval second).

**Migration completed manually**

1. Verify every statement and constraint matches the migration exactly.
2. An authorised operator may then reconcile history:

   ```bash
   npx prisma migrate resolve --applied MIGRATION_NAME
   ```

**Successful migration that must be reversed**

1. Create a new forward migration that safely reverses the change; do not edit migration history.
2. Use Neon point-in-time recovery only when a forward repair cannot preserve data. Verify the
   timestamp through a read-only restore branch before changing production.

After recovery, run `npm run db:migrate:status`, `/api/health`, and critical application probes.

### Communication

- State whether production data was touched, whether application releases are frozen, and which
  reviewed recovery path was selected.
- If data integrity is uncertain, do not tell customers that no data was lost until verification is
  complete.

### Follow-up

- Document the failing statement and representative data condition.
- Add a preview fixture/test that reproduces the failure.
- Require expand-and-contract for the corrected schema change.
- Record and verify the pre-production backup/restore point for future destructive migrations.

## Runbook 3: Database outage

### Detection

- `/api/health` returns HTTP 503.
- The uptime issue names the database-backed health endpoint.
- Sentry or structured logs show connection, timeout, pool, or Prisma query failures across routes.
- Neon reports an unavailable compute endpoint, connection saturation, or a provider incident.

### Impact assessment

1. Confirm the homepage may still return 200 while database-backed login, booking, and dashboard
   operations fail.
2. Check whether the outage affects all requests, one Neon branch, or only one Vercel environment.
3. Identify the first error time, request volume, active deployment, and recent migration or secret
   changes.
4. Treat a production-wide outage as SEV-2; raise to SEV-1 if writes may be lost or corrupted.

### Immediate response

1. Freeze deployments and migrations.
2. Check Neon project/branch health and provider status, then Vercel runtime logs and connection
   errors.
3. Verify that production `DATABASE_URL` and `DIRECT_URL` still target the intended production
   branch. Compare identifiers without exposing credentials.
4. If a credential or configuration change triggered the incident, restore the last known-good
   value and redeploy once.
5. Avoid retry storms: do not manually loop booking, email, or migration requests while the database
   is unavailable.

### Rollback and recovery

- **Recent application change:** roll back Vercel to the last database-compatible deployment.
- **Recent database configuration change:** restore the previous known-good configuration, then
  redeploy and verify.
- **Provider outage:** do not point production at an unverified branch. Monitor Neon recovery and
  keep customer communication current.
- **Suspected data damage:** stop writes and create/inspect a point-in-time restore branch. Switch or
  restore production only after count, constraint, and critical-record verification with a second
  reviewer.

Recovery requires HTTP 200 from `/api/health`, successful authentication, a safe database read, and
stable error/latency signals for at least 30 minutes. Do not create a synthetic production booking
unless it uses an explicitly designated test business and can be safely cancelled.

### Communication

- Tell customers that booking/account access is unavailable or degraded; do not describe the
  homepage as fully operational if core database functions are down.
- State whether previously confirmed bookings remain valid only after integrity checks.

### Follow-up

- Capture outage duration, failed query/error classes, provider findings, and recovery timeline.
- Review connection limits, timeouts, retry behaviour, Neon history window, and alert thresholds.
- Add a capacity or failure-mode test if saturation contributed.

## Runbook 4: Email delivery outage

### Detection

- The uptime workflow reports Resend reachability/credential failure.
- Resend status, domain, or delivery events show a provider or configuration problem.
- Structured logs show `email.send.failed`, `email.password_reset.failed`, or
  `booking.transition.email_completed` with `sent: false`.
- Users report missing verification, password-reset, invitation, reminder, or appointment emails.

### Impact assessment

1. Identify affected email types and the first/last failure time.
2. Separate API acceptance from delivery outcomes (delivered, bounced, blocked, or delayed).
3. Determine whether bookings/status transitions succeeded in the database even though their email
   failed. A successful booking must not be recreated merely to trigger another email.
4. Record affected message IDs and booking IDs, not recipient addresses or email bodies, in the
   incident record.
5. Use SEV-2 if users cannot verify accounts or reset passwords broadly; otherwise use SEV-3 unless
   booking integrity is also affected.

### Immediate response

1. Check Resend status and the OnPrez domain/API-key state.
2. Verify `RESEND_API_KEY`, `FROM_EMAIL`, `FROM_NAME`, and domain verification in the production
   environment without exposing their values.
3. Freeze email-template and sender-configuration deployments.
4. Tell support not to ask customers to repeat bookings or share password-reset links.
5. Build a safe list of affected operation IDs from structured logs/provider events. OnPrez does not
   currently have a durable email outbox, so do not assume failed messages will retry automatically.

### Rollback and recovery

- Revert the latest sender/domain/application configuration if it caused the outage.
- Roll back the application if a release caused email API errors.
- Rotate the Resend key only if it is invalid or suspected exposed; update Vercel and the optional
  GitHub health-check secret together, then revoke the old key.
- After provider recovery, retry only messages whose underlying action still exists and whose
  content is still valid. Generate fresh verification/password-reset tokens rather than resending
  expired or previously exposed links.
- Do not resend appointment notifications blindly; reconcile booking state first to avoid sending
  contradictory status emails.

Verify one designated test email, the relevant auth flow, and a booking/status notification before
closing. Monitor provider events and failure logs for at least 30 minutes.

### Communication

- State that email delivery is delayed while clarifying whether bookings themselves are still being
  recorded.
- Tell users not to submit duplicate bookings. Provide a safe alternative support route if available.

### Follow-up

- Reconcile every affected operation ID and record whether it was retried, expired, or required no
  action.
- Add a durable transactional outbox/retry mechanism and delivery-state dashboard to the backlog.
- Review bounce handling, provider alerts, domain status, and key-expiry procedures.

## Runbook 5: Booking duplication bug

### Detection

- A customer/business reports two appointments for the same intended booking.
- Logs show repeated `booking.creation.succeeded` events with related correlation IDs.
- Multiple appointments overlap for the same business, service, customer, and time.
- `booking_idempotency_keys` shows unexpected conflicts/replays or appointments were created without
  an idempotency key.

### Impact assessment

1. Declare SEV-2 while duplicate creation may still be active; raise to SEV-1 if multiple businesses
   or automated bulk creation is involved.
2. Identify the earliest/latest affected time and the entry points involved: public booking,
   quick-create, multi-day, reschedule, or API client.
3. Correlate using safe `bookingId`, `businessId`, `requestId`, `correlationId`, and idempotency-key
   record IDs. Do not place customer contact details in the incident record.
4. Determine whether duplicates are exact retries, overlapping but distinct requests, or display
   duplication.
5. Check downstream effects: status transitions, confirmation emails, customer counters, reminders,
   and availability blocking.

### Immediate response

1. Freeze the responsible booking entry point. If no targeted kill switch exists, roll back the
   suspected release; do not disable unrelated read-only access.
2. Preserve application logs and relevant appointment, transition, and idempotency records.
3. Stop bulk reminders/status changes for the affected range until records are reconciled.
4. Produce a candidate list using read-only queries and have a second person verify it. Never delete
   appointments based only on matching name, email, or time.
5. Tell affected businesses not to delete records or ask customers to book again.

### Rollback and recovery

1. Roll back the application change that bypassed locking/idempotency or temporarily keep the entry
   point unavailable until a tested fix is deployed.
2. For each confirmed duplicate, designate one canonical appointment with the business/customer.
3. Cancel the duplicate through the normal appointment transition path with reason **Duplicate
   booking** so audit history remains intact. Do not hard-delete appointments or manually alter
   customer counters.
4. Suppress or reconcile contradictory notifications before resuming reminders.
5. Deploy the fix through preview with concurrency and repeated-request tests.
6. Verify advisory locking, conflict detection, idempotency replay, and same-key/different-payload
   rejection, then monitor creation logs for at least one normal booking cycle.

### Communication

- Contact affected businesses first with booking IDs/times through a secure channel.
- Contact customers only after agreeing which appointment is canonical. Apologise clearly and state
  whether they need to take any action.
- Never expose another customer's or business's booking information.

### Follow-up

- Reconcile appointment transitions, customer counters, reminders, and email outcomes.
- Add the exact race/retry pattern as an automated regression test.
- Add a metric/alert for abnormal same-slot creation and idempotency conflicts.
- Document affected counts and why existing safeguards did not prevent the duplicates.

## Runbook 6: Authentication outage

### Detection

- Login, signup, session refresh, MFA, verification, or password-reset flows fail broadly.
- Sentry/structured logs show elevated auth rejection, session creation, JWT, database, or
  rate-limit failures.
- `/login` may still return 200 while login API calls fail; do not treat page availability as proof
  that authentication works.
- Existing sessions are unexpectedly invalidated or users enter redirect/login loops.

### Impact assessment

1. Test with a designated test account; never request a customer's password, MFA code, backup code,
   cookie, or reset link.
2. Determine whether new login, existing sessions, MFA, email verification, or reset is affected.
3. Segment by environment, account, browser, and route to distinguish isolated lockout from outage.
4. Check recent deployments, migrations, `JWT_SECRET`, cookie settings, database health, and rate
   limits.
5. Use SEV-2 for broad login/session failure. Use the compromise runbook if evidence suggests abuse
   or secret exposure.

### Immediate response

1. Freeze auth, session, MFA, and secret changes.
2. Preserve request/correlation IDs and redacted security events for representative failures.
3. Check database health before changing JWT or cookie configuration.
4. Check whether rate limiting is correctly rejecting abusive traffic or incorrectly blocking
   normal users; do not globally disable brute-force protection without incident-commander approval.
5. Keep logged-in users signed in when safe; avoid rotating `JWT_SECRET` merely to troubleshoot.

### Rollback and recovery

- Roll back a faulty auth deployment to the last known-good database-compatible release.
- Restore the last known-good environment/cookie setting if configuration drift caused the outage.
- If `JWT_SECRET` was unintentionally changed, restore the prior secret if it was not exposed. If it
  may be compromised, rotate it and deliberately revoke all sessions under the compromise runbook.
- If a session migration failed, follow the migration runbook rather than editing session records
  ad hoc.
- Verify login, logout, existing/new session behaviour, refresh, MFA, verification, and password
  reset with test accounts. Confirm protected routes reject unauthenticated access.

Monitor auth error/rejection rates for at least 30 minutes before closure.

### Communication

- Tell users which account actions are unavailable and whether existing sessions are affected.
- Never advise users to email passwords or codes. If sessions must be revoked, state clearly that
  users will need to sign in again.

### Follow-up

- Add a synthetic authentication check that exercises the backend without storing credentials in
  logs.
- Review secret-change controls, rate-limit thresholds, session rotation, and rollback compatibility.
- Add a regression test for the exact failed flow.

## Runbook 7: Suspected account compromise

### Detection

- A user reports an unknown login, session, trusted device, password/MFA change, or business action.
- Security logs show unusual IP/device changes, refresh-token reuse, repeated MFA failures, or
  critical actions inconsistent with the account's history.
- Credentials, session tokens, reset links, or API keys are reported exposed.

### Impact assessment

1. Treat as SEV-1 until scope is known. Assign a privacy/security owner.
2. Verify the reporter through an established channel without requesting passwords, MFA codes,
   backup codes, or session tokens.
3. Record the account/user ID, affected business IDs, UTC window, actions, session IDs, and safe
   security-event metadata.
4. Determine whether this is one account, a shared credential/secret, or platform-wide abuse.
5. Check for changes to email, password, MFA, team membership, bookings, presence content, and
   account sessions.

### Immediate response

1. Preserve security logs, activity records, relevant Sentry events, request IDs, and session/device
   metadata before changing state.
2. Revoke all sessions for the affected user and remove unrecognised trusted devices.
3. Require a password reset through a freshly generated link and require/re-enrol MFA when identity
   has been safely verified.
4. Suspend privileged account actions while ownership is disputed. Do not permanently delete the
   account or evidence.
5. If a platform credential may be exposed, rotate it in the provider and production environment,
   redeploy, verify, and revoke the old credential. Scope rotations carefully to avoid unnecessary
   outages.
6. Begin the data-leak runbook if unauthorised access to personal data may have occurred.

### Rollback and recovery

1. Reverse unauthorised team, profile, presence, booking, or security-setting changes through normal
   audited application paths where possible.
2. Restore content/data from a verified prior version only after preserving current evidence and
   confirming the exact unauthorised changes.
3. Do not restore compromised sessions, trusted devices, passwords, MFA secrets, or API keys.
4. Confirm the legitimate owner can authenticate with a new password/MFA and that all previous
   sessions remain invalid.
5. Monitor the account and related IP/device/security events for recurrence.

### Communication

- Use a verified contact route. Provide facts, containment performed, and required user actions.
- Do not accuse a named person or reveal investigative details to unauthorised contacts.
- If other users may be affected, coordinate messages with the privacy/security owner.

### Follow-up

- Document the likely entry path, actions taken, scope, evidence, and recovery verification.
- Review session duration/revocation, MFA enforcement, trusted-device controls, and security alerts.
- Add detection for the observed compromise pattern and notify the user of final protective actions.

## Runbook 8: Data leak report

### Detection

- A customer, researcher, employee, provider, or automated system reports that personal or business
  data was exposed to an unauthorised party.
- Logs show cross-business access, public object exposure, overly broad API responses, leaked
  credentials, or unauthorised database access.
- Sensitive information appears in logs, Sentry, email, source control, uploads, or a public URL.

Treat every credible report as a potential personal data breach; do not wait for complete proof to
start the incident record and regulatory clock assessment.

### Impact assessment

1. Declare SEV-1 and assign an incident commander plus privacy/security owner.
2. Record when OnPrez became aware of the report. Preserve the original report and acknowledge it
   without requesting the reporter to send more personal data over an insecure channel.
3. Identify the data categories, approximate number of people/records, affected businesses, exposure
   duration, access method, recipients, and whether the data was downloaded or altered.
4. Assess risk to people's rights and freedoms, including identity/account abuse, financial harm,
   safety, discrimination, confidentiality, and loss of control.
5. Keep identifiers and counts in the main incident record; restrict the detailed affected-person
   list to the smallest authorised group.

### Immediate response

1. Preserve evidence before containment where this does not prolong exposure.
2. Remove public access, disable the vulnerable route, revoke exposed credentials/sessions, or roll
   back the responsible deployment. Prefer the narrowest containment that stops ongoing exposure.
3. Freeze log retention changes, data deletion, schema changes, and unrelated deployments.
4. Review access logs to determine whether exposure was possible versus confirmed access.
5. Engage qualified legal/privacy advice. Assess ICO notification immediately: a notifiable UK
   personal data breach must be reported without undue delay and, where feasible, within 72 hours of
   awareness. High risk to people may also require direct notification without undue delay.
6. Contact relevant providers through their security channels if their system or logs are involved.

### Rollback and recovery

1. Roll back the vulnerable application/configuration or deploy a narrowly reviewed containment fix.
2. Rotate exposed credentials and revoke affected sessions/tokens. Do not restore old credentials.
3. Correct overly broad permissions or queries and add tenant-isolation tests before re-enabling the
   affected capability.
4. If data was altered or deleted, restore only from a verified point and reconcile legitimate
   changes made after that point.
5. Independently verify that the original access path no longer exposes data and that unrelated
   tenants remain isolated.
6. Continue monitoring for access attempts using the old path or credentials.

### Communication

- Acknowledge the reporter promptly and provide a secure route for evidence.
- Only the assigned privacy/security and communications owners approve regulatory, affected-person,
  provider, or public messages.
- State what happened, likely consequences, containment, protective steps, and contact route without
  revealing another person's data or details that enable exploitation.
- Record the reasoning and evidence if the incident is assessed as not notifiable.

### Follow-up

- Complete a documented breach assessment and regulatory/affected-person notifications where
  required.
- Produce a blameless post-incident review with root cause, control gaps, timeline, scope, and
  corrective actions.
- Add tests and monitoring for the exact exposure path; review route access controls, log scrubbing,
  retention, provider permissions, and secret scanning.
- Track every corrective action to an owner and due date, then independently verify closure.

## Recovery verification and closure

An incident may move to **Resolved** only when:

- The triggering condition is contained and no longer reproducible.
- All affected uptime/health probes pass.
- Sentry and structured error rates have returned to baseline.
- Database migration status and data-integrity checks pass when relevant.
- Affected bookings, sessions, messages, and records have been reconciled.
- Required customer, provider, legal, privacy, or regulatory communications are complete or assigned
  with explicit deadlines.
- Monitoring has remained stable for the period specified by the runbook.
- Follow-up work has owners, priorities, and due dates.

For SEV-1 and SEV-2 incidents, schedule a blameless review within five working days. The review must
cover detection, customer impact, timeline, root cause, contributing factors, response quality,
recovery, and prevention. Update these runbooks whenever the actual response differs from the
documented process.

## Authoritative external recovery references

- [Vercel: Rolling back a production deployment](https://vercel.com/docs/deployments/rollback-production-deployment)
- [Prisma: Patching and hotfixing failed production migrations](https://www.prisma.io/docs/orm/prisma-migrate/workflows/patching-and-hotfixing)
- [Neon: Backup and restore](https://neon.com/docs/guides/backup-restore)
- [ICO: Personal data breaches guide](https://ico.org.uk/for-organisations/report-a-breach/personal-data-breach/personal-data-breaches-a-guide/)
