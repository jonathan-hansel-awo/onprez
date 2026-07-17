# Backup and Restore Verification

This document defines how OnPrez protects, restores, and verifies PostgreSQL data and uploaded
media. A backup is not considered operationally useful until an isolated restore drill has passed
and produced durable evidence.

Use this procedure with:

- [Incident response runbooks](./INCIDENT_RUNBOOKS.md)
- [Database migrations](../MIGRATIONS.md)
- [Production readiness checklist](../production/PRODUCTION_READINESS_CHECKLIST.md)
- [Neon backup and restore](https://neon.com/docs/guides/backup-restore)
- [Neon instant restore](https://neon.com/docs/introduction/branch-restore)
- [Cloudinary backups and version management](https://cloudinary.com/documentation/backups_and_version_management)

## Recovery objectives

RPO is the maximum acceptable gap between the source state and the selected restore point. RTO is
the time from declaring the recovery drill/incident to a verified usable restore.

| Data or service           |                           RPO target |                                  RTO target | Expected loss at target                                                        | Verification                                                                       |
| ------------------------- | -----------------------------------: | ------------------------------------------: | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Neon PostgreSQL           |                            5 minutes |                                 120 minutes | At most five minutes of committed database changes                             | Quarterly isolated restore and exact schema/migration/table fingerprint comparison |
| Cloudinary original media |   5 minutes from a successful upload | 4 hours for an individual/limited asset set | Assets not accepted by Cloudinary, or changes after the last backed-up version | Quarterly non-PII asset restore and integrity check                                |
| Application code          |               Last pushed Git commit |                                  30 minutes | Uncommitted/unpushed changes                                                   | Vercel rollback rehearsal                                                          |
| Provider configuration    | Last recorded approved configuration |                                  60 minutes | Changes after the last approved configuration record                           | Quarterly access/configuration review                                              |

These are OnPrez targets, not guarantees from a provider plan. Before launch and during every
quarterly review, capture the active Neon restore window and Cloudinary backup setting. If the
provider configuration cannot meet a target, treat that as a launch/reliability gap rather than
silently weakening the target.

## Backup inventory and ownership

### PostgreSQL

Neon is the system of record for users, businesses, services, customers, appointments, sessions,
settings, published content, audit/security records, and references to Cloudinary assets. Database
URLs are credentials and must never be placed in drill reports, logs, screenshots, or tickets.

The production owner must verify:

- The production branch has an active restore window that meets the five-minute RPO.
- Preview/staging and production are distinct branches with distinct credentials.
- Only authorised MFA-protected provider accounts can restore or delete branches.
- A restore operation creates or targets an isolated branch first; a drill never overwrites
  production.
- The current Neon plan's history window covers the intended incident and drill scenarios.

### Cloudinary media

The database stores Cloudinary URLs and metadata; Neon backup does **not** contain the image bytes.
OnPrez upload requests set `backup: true`, and the Cloudinary product environment must also have
automatic backup enabled in **Settings → Upload → Backup**. The provider setting is required even
though the application requests per-upload backup, because it gives operators one visible policy to
audit and covers uploads made through approved provider tools.

Media protection expectations:

- Retain original assets and backed-up versions; derived transformations can be regenerated.
- Do not use customer media as a restore-drill fixture.
- Do not clear backed-up versions during routine asset deletion. Data-erasure requests must follow
  the approved retention/deletion process and propagate to backups when legally required.
- Keep the Cloudinary `public_id`, resource type, version, dimensions, format, and a local SHA-256 of
  the synthetic drill fixture. Do not record customer filenames or image contents in GitHub.
- A database restore can reintroduce an older Cloudinary URL. Reconcile restored database references
  with provider asset/version availability before reopening affected public pages.

## One-time GitHub setup

Create a protected GitHub environment named `restore-verification`. Add exactly these environment
secrets:

- `SOURCE_DATABASE_URL` — pooled, read-capable URL for the frozen preview/staging source.
- `RESTORED_DATABASE_URL` — pooled, read-capable URL for the isolated Neon restore target.

Both should use least-privilege credentials where the current Neon/Prisma setup permits. They must
never point to production for a routine drill. Configure required reviewer approval for the
environment and rotate/remove the restored-branch credential when the drill branch is deleted.

The workflow intentionally has no write step. It reads database metadata and migration history, and
calculates table counts, full-row fingerprints, and identifier fingerprints inside PostgreSQL. It
does not return personal-data fields or include connection URLs in the report.

## Quarterly PostgreSQL restore drill

### 1. Prepare and freeze preview

1. Schedule the drill and name an owner and reviewer.
2. Confirm that the chosen preview/staging branch contains representative **synthetic** data and no
   production personal data.
3. Record `DRILL_STARTED_UTC` in ISO-8601 format, for example `2026-07-17T08:00:00Z`.
4. Stop preview deployments, migrations, seed jobs, and user/test writes.
5. Confirm writes are frozen, then record `SOURCE_FREEZE_UTC`.
6. Do not resume writes until the comparison workflow has captured the source snapshot.

An exact comparison is deliberately used. If the source changes after the restore point, the drill
must fail instead of explaining away missing records.

### 2. Select and inspect the restore point

1. In Neon, open **Backup & Restore / Restore** for the non-production source branch.
2. Use Time Travel Assist/read-only queries to select the newest point at or before the source freeze
   that contains all expected synthetic records.
3. Record the selected `RESTORE_POINT_UTC`. The gap from the source freeze is the measured RPO.
4. If the branch or plan cannot restore to that point, stop and record the provider/plan limitation.
   Do not switch to production to make the drill pass.

### 3. Restore into isolation

1. Create a separate target such as `restore-verification-YYYYMMDD`; never restore over the source.
2. Restore/branch from the selected timestamp using the Neon Console or provider-supported API/CLI.
3. Create a separate connection role/URL for the restored target where possible.
4. Confirm visually that the source and restored endpoints/branch IDs differ.
5. Store the two URLs only in the protected GitHub environment secrets.

If the Neon Console only offers an in-place action for the selected branch type, stop and use a
provider-supported point-in-time branch or a separate non-production root target. A routine drill
must not overwrite its source.

### 4. Run the verification workflow

1. Open **GitHub → Actions → Verify database restore → Run workflow**.
2. Enter the three UTC timestamps recorded above.
3. Enter `VERIFY_PREVIEW_RESTORE` as confirmation.
4. Approve the protected `restore-verification` environment.
5. Wait for the read-only comparison and download the 90-day redacted report artifact.

The workflow fails if:

- Source and restored URLs identify the same host/database target.
- PostgreSQL versions, schemas, or Prisma migration histories differ.
- A table is missing or unexpectedly added.
- Any table row count, server-side content fingerprint, or identifier fingerprint differs.
- Measured RPO exceeds five minutes.
- Measured RTO exceeds 120 minutes.
- Either database cannot be queried.

The content fingerprint hashes each complete row inside PostgreSQL and returns only the aggregate
checksum; personal data is never returned to the workflow. The separate identifier fingerprint uses
only each table's `id` values and aggregate counts. The report contains hashes, counts, and mismatch
labels—not names, email addresses, phone numbers, notes, tokens, or other payload fields.

### 5. Application smoke test

After the comparison passes, create a temporary Vercel preview deployment that points only to the
restored database and verify:

1. `/api/health` returns HTTP 200.
2. A designated synthetic account can sign in.
3. Its business, service, public page, availability, and bookings are visible.
4. A protected route still rejects an unauthenticated request.
5. No email or upload operation is triggered during the read-only drill.

Record the deployment URL and results, then remove its database credentials and deployment when the
drill is complete.

### 6. Close and clean up

1. Record measured RPO/RTO, workflow URL, report artifact, operator, reviewer, and smoke-test result.
2. Resume preview writes only after the source fingerprint has been captured.
3. Delete the temporary Vercel deployment and isolated restore branch after evidence is retained.
4. Remove/rotate the restored-branch secret.
5. Open follow-up issues for every failed target, mismatch, unclear step, or provider limitation.

Do not mark production-readiness item DB-05 complete until both the comparison and application smoke
test pass against a real isolated Neon restore.

## Quarterly Cloudinary media restore drill

1. Confirm automatic backup is enabled in Cloudinary and application uploads still set
   `backup: true`.
2. Generate a small synthetic image containing no person, personal data, secret, or customer
   branding. Record its local SHA-256, dimensions, and format.
3. Upload it into a dedicated `onprez/restore-verification/YYYYMMDD` folder.
4. Confirm the provider marks the asset/version as backed up.
5. Overwrite a designated test version or use the provider's safe restore flow for that asset. Never
   test deletion/restoration on customer media.
6. Download the restored original and compare SHA-256, dimensions, and format with the fixture.
7. Record elapsed time, provider event/version IDs, and pass/fail without attaching the image if the
   evidence location is public.
8. Delete the fixture and, after evidence is complete, apply the expected backup-retention/deletion
   policy to the fixture only.

The media drill passes only when the original—not merely a cached CDN transformation—can be
recovered and matches the fixture.

## Restore drill record

Copy this table into a restricted operational record for every drill:

| Field                                                | Result      |
| ---------------------------------------------------- | ----------- |
| Drill date/owner/reviewer                            | Required    |
| Source environment and safe branch identifier        | Required    |
| Restore target safe branch identifier                | Required    |
| Drill start/source freeze/restore point/verified UTC | Required    |
| Measured database RPO (target ≤ 5 min)               | Required    |
| Measured database RTO (target ≤ 120 min)             | Required    |
| Verification workflow and report artifact            | Required    |
| Restored application smoke test                      | Pass / Fail |
| Cloudinary backup setting captured                   | Pass / Fail |
| Synthetic media restore and checksum                 | Pass / Fail |
| Deviations and follow-up owners/dates                | Required    |
| Final result                                         | Pass / Fail |

## Current verification status

| Control                                     | Status                           |
| ------------------------------------------- | -------------------------------- |
| Read-only restore comparison implementation | Automated and unit tested        |
| Cloudinary per-upload backup request        | Enforced and regression tested   |
| Real Neon isolated restore                  | **Pending first operator drill** |
| Restored Vercel preview smoke test          | **Pending first operator drill** |
| Cloudinary synthetic media restore          | **Pending first operator drill** |

This status is intentionally explicit: repository automation can verify a restore, but it cannot
create a truthful operational test record without access to the configured Neon and Cloudinary
environments.

## Drill cadence and failure handling

- Run database and media restore drills at least quarterly, before public launch, after changing
  providers/backup plans, and after any recovery procedure materially changes.
- Review Neon restore-window coverage and Cloudinary backup settings monthly.
- Treat an untested or failed restore as a launch blocker and open a dated corrective action.
- During a real incident, follow the database outage or failed migration runbook. Do not improvise a
  production overwrite from this drill procedure.
