# Security Policy

## Supported version

OnPrez is under active development. Security fixes are applied to the current `main` branch.

## Reporting a vulnerability

Do not open a public issue containing an unpatched vulnerability, credential, token, customer
record, or exploit details.

Use the repository's **Security** tab to submit a private vulnerability report. If private
reporting is unavailable, contact the repository owner through their GitHub profile without
including sensitive details in a public message.

Include:

- the affected route, component, or dependency;
- clear reproduction steps;
- the expected and observed behaviour;
- the likely impact;
- any suggested remediation, if known.

## Automated dependency controls

- Dependabot checks npm dependencies and GitHub Actions every week.
- Pull requests are reviewed for newly introduced high or critical dependency vulnerabilities.
- `npm audit --audit-level=high` runs on pull requests, pushes to `main`, and every Monday.
- Security workflow actions are pinned to immutable commit SHAs. Dependabot maintains those pins.

Do not merge a failing dependency review or dependency audit without documenting why the alert
is not exploitable and creating a follow-up remediation item.

When updating a vulnerable package:

1. Confirm whether the vulnerable code path is used by OnPrez.
2. Prefer the smallest non-breaking patched version.
3. Update both `package.json` and `package-lock.json`.
4. Run the full Quality Gates and production build.
5. Avoid `npm audit fix --force` unless the breaking upgrades have been reviewed and tested.

Target remediation times:

- Critical: immediately, before further deployment.
- High: within 7 days.
- Moderate: within 30 days.
- Low: in the next routine dependency cycle.

## Secret handling and incident response

GitHub secret scanning runs automatically because this is a public repository. Gitleaks also
scans pull requests, pushes to `main`, the full Git history, and the weekly security schedule.

Never commit real values for database URLs, JWT secrets, email credentials, Cloudinary keys,
deployment tokens, or third-party API credentials. Keep local secrets in ignored environment
files and provide placeholders only in `.env.example`.

If a secret is detected or may have been committed:

1. Revoke or rotate it immediately. Removing it from the latest file is not sufficient.
2. Check provider and application logs for unauthorized use.
3. Replace the secret in the deployment environment.
4. Remove it from source and, where appropriate, rewrite Git history.
5. Re-run secret scanning and the full Quality Gates.
6. Resolve the GitHub alert only after recording what was rotated and when.
7. Notify affected users and follow applicable breach-reporting obligations if customer data
   may have been exposed.
