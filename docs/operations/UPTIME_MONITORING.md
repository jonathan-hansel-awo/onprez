# Production Uptime Monitoring

OnPrez runs an external production probe every five minutes through GitHub Actions. The monitor checks:

- The homepage at the root path.
- The authentication entry point at /login.
- The protected /dashboard route for its expected unauthenticated redirect.
- A real public presence page identified by a public handle.
- /api/health for application and database readiness.
- Resend's /domains API for email-provider reachability.

## Required repository configuration

In **GitHub → Settings → Secrets and variables → Actions → Variables**, set:

- UPTIME_BASE_URL to the canonical production origin. It defaults to https://onprez.com.
- UPTIME_PUBLIC_HANDLE to a stable, published test profile that must remain available.

Optionally add RESEND_HEALTHCHECK_API_KEY as an Actions secret. It must have full API access because Resend's domain-list endpoint is unavailable to sending-only keys. When it is omitted, the monitor expects an unauthenticated HTTP 401 response, which still checks DNS, TLS, and Resend API availability without testing OnPrez credentials.

## Alert and recovery behavior

A failed probe fails the workflow and opens an issue titled **[uptime] Production monitor failed**, assigned to the repository owner. Repeated failures add comments to the same issue rather than opening duplicates. The first successful run after recovery comments on and closes the alert.

Scheduled workflows run from GitHub's default branch, so this monitor becomes active after the workflow is merged. Run it manually once after configuring the public handle, confirm every probe succeeds, and ensure repository notification settings deliver assigned-issue alerts to the operational mailbox.

The health response deliberately contains only a boolean ok field, is never cached, and returns HTTP 503 when the database probe fails. It must not expose dependency names, versions, connection strings, exception messages, or entity counts.

## Incident response

1. Open the failed workflow run linked from the alert issue and identify the failing probe.
2. Check the latest deployment and Sentry release for correlated errors.
3. Roll back or patch the application when OnPrez is at fault; check provider status when Resend or hosting is unreachable.
4. Confirm the recovery run closes the issue, then document impact and follow-up actions.
