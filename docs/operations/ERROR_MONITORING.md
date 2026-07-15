# Production Error Monitoring

OnPrez uses Sentry for browser, server, and edge-runtime exception monitoring. Monitoring is disabled unless a production deployment has a DSN, so local development and tests do not send events.

## Deployment configuration

Create a Sentry Next.js project and configure these environment variables in Vercel Production:

- `NEXT_PUBLIC_SENTRY_DSN`: browser event ingestion DSN.
- `SENTRY_DSN`: server/edge DSN; it may use the same value.
- `SENTRY_ORG` and `SENTRY_PROJECT`: source-map upload destination.
- `SENTRY_AUTH_TOKEN`: secret build token with release/source-map upload access. Never expose it to the browser or commit it.
- `SENTRY_ENVIRONMENT`: normally `production`.
- `SENTRY_RELEASE`: optional explicit release ID. On Vercel, `VERCEL_GIT_COMMIT_SHA` is used automatically when this is omitted.

Redeploy after adding the variables. Source-map upload is skipped safely when the auth token is absent, but stack traces will then be less useful.

## Privacy controls

- Default PII collection is disabled.
- User identity and request bodies, cookies, and query strings are removed before events leave the application.
- Credential, token, password, session, customer-note, contact, and authorization fields are filtered recursively.
- Session replay and Sentry log capture are intentionally not enabled.
- Production API logging records only a safe error type; raw error details remain available only outside production.

Before each release, send a controlled test exception that contains fake credentials and fake customer data. Confirm the event arrives, the release matches the deployed commit, and every fake sensitive value appears as `[Filtered]`. Remove the test exception immediately afterward.

## Alerts

Sentry alert rules are project configuration and must be activated after the project exists:

1. Create an issue alert for a new issue or regression in the `production` environment and notify the on-call email/channel immediately.
2. Create a metric alert for **Number of Errors**, filtered to `environment:production`:
   - Warning: at least 10 errors in 5 minutes.
   - Critical: at least 30 errors in 5 minutes.
   - Resolve: fewer than 3 errors in 5 minutes.
3. Review thresholds after two weeks of production baseline data and tune them to avoid alert fatigue.

When an alert fires, inspect the first affected release and route, assess customer impact, roll back or patch as appropriate, and document the resolution. Do not paste raw event payloads into tickets or chat.
