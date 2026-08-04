# PII Handling Review

## Purpose and status

This is the canonical P2-023 privacy engineering review for OnPrez. It records what personal data
the application processes, where it moves, how every identified database field is protected, who
owns retention/deletion decisions, and which automated controls prevent accidental disclosure.

The machine-readable source of truth is
[`PII_INVENTORY.json`](./PII_INVENTORY.json). `npm run privacy:audit` validates that inventory
against `prisma/schema.prisma` and checks the application boundaries described below.

This review supports, but does not replace, professional legal advice or a formal data protection
impact assessment where one becomes necessary. It follows the ICO's recommendation to base records
of processing on an information audit and data-flow map and to review those records regularly:

- [Documenting processing activities](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/documentation/how-do-we-document-our-processing-activities/)
- [Data protection by design and by default](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/guide-to-accountability-and-governance/data-protection-by-design-and-by-default/)
- [Security outcomes](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/security/a-guide-to-data-security/security-outcomes/)

## Roles and ownership

| Data area                                                          | OnPrez role                                                                                                | Decision owner                                 | Operational responsibility                                                          |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| Accounts, authentication, platform security and optional analytics | Controller                                                                                                 | OnPrez operator / platform privacy             | OnPrez security and privacy operations                                              |
| Business profile, team and published presence content              | Controller for platform operation; the business controls what it publishes                                 | Business owner with OnPrez platform safeguards | Business owner and OnPrez support                                                   |
| Customer, booking, inquiry and review records                      | Usually processor/platform provider; the business is normally the controller for its customer relationship | Business owner                                 | Authorised business users; OnPrez assists with rights requests and verified erasure |
| Deposits, refunds and provider references                          | Split by purpose and applicable payment/accounting duties                                                  | Business owner and OnPrez finance operations   | Stripe plus authorised OnPrez/business operations                                   |
| Incident and lifecycle evidence                                    | Controller                                                                                                 | OnPrez security/privacy operations             | Restricted OnPrez operations                                                        |

No role label should be treated as universal legal advice. A business may have additional duties
based on its sector, services, location or use of customer information.

## Data-flow map

| Source                            | OnPrez boundary                                                    | Permitted destination                                                                        | Prohibited destination/content                                                                  |
| --------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Account/signup and security forms | HTTPS route, validation, rate limit, Neon                          | Purpose-bound Resend message; restricted security record                                     | Query strings, analytics, raw application logs, Sentry user/request bodies                      |
| Business dashboard                | Authenticated tenant boundary, Neon, published-snapshot boundary   | Vercel public rendering only after publish; Cloudinary for selected media                    | Another tenant, public draft data, analytics form values                                        |
| Customer booking/inquiry forms    | HTTPS public route, rate limit, tenant-scoped Neon record          | Relevant business, purpose-bound Resend message, Stripe when a deposit is requested          | Analytics, logs, lock-screen push identity, customer email/name/phone in application URLs       |
| Booking events                    | Durable booking, email-delivery records and notification outboxes  | Authorised business users; coarse push event; connected Google Calendar; transactional email | Customer identity/contact/notes in web-push payloads or third-party calendar-link URLs          |
| Browser performance               | Consent check, coarse page classification                          | Same-origin web-vitals endpoint and optional Google Analytics                                | Raw handle, customer route, query string, full URL or form content                              |
| Runtime exception                 | Structured logger and Sentry scrubber                              | Bounded operational fields and pseudonymous internal IDs                                     | Passwords, tokens, cookies, request bodies, emails, phone/address fields, IP/user-agent fields  |
| Rights request                    | Password-verified lifecycle route                                  | Private no-store export or staged/anonymised processing                                      | Export payload copies in audit logs or immediate destructive cascade                            |
| Resend delivery event             | Signed raw-body verification, provider-message lookup, Neon        | Tenant-scoped masked delivery history and keyed suppression record                           | Webhook recipient, subject, message content or raw provider payload in the database or logs     |
| Plan usage and provider overhead  | Canonical business records, media ledger and stored planning rates | Restricted aggregate platform-admin report                                                   | Customer message content, recipient address, provider secrets or estimates labelled as invoices |

Purpose-bound email and connected calendar events may contain the contact/booking information needed
by the customer or selected business. That is an intentional delivery flow, not permission to copy
the same information into logs, analytics, URLs, push payloads or unrelated provider metadata.

## Protection classification

Every field in the inventory has one of these explicit at-rest decisions:

| Decision                                   | Current use                                                                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One-way password hash                      | `User.passwordHash` uses bcrypt and is never retrievable/exported.                                                                                                                                  |
| Keyed one-way token hash                   | Session, refresh, password-reset, email-verification and temporary MFA credentials are stored as hashes; raw values are short-lived at issuance/use.                                                |
| Application-level authenticated encryption | MFA secrets and the Google Calendar refresh token nested in `Business.settings` are encrypted with keys held outside Neon.                                                                          |
| Plaintext required, tightly scoped         | Contact data, booking/customer records, device/network identifiers and provider IDs must be usable by the product; access controls, TLS, minimisation and lifecycle rules are the primary controls. |
| Public only by explicit action             | Published business contact/profile/page content is intentionally public; draft content remains tenant-private.                                                                                      |
| Derived/pseudonymous                       | Internal IDs and booking request digests are useful operationally but remain personal data when linkable to a person.                                                                               |
| Provider credential pending encryption     | Web-push endpoint/key material is currently plaintext-required by the sender and access-controlled. Application-level encryption is required before paid launch or materially wider push adoption.  |

Database/provider encryption at rest is not described as application-level encryption. The inventory
makes that distinction explicitly so the existence of managed-database encryption does not disguise
plaintext application fields.

## Controls added by this review

- Optional analytics receives only a coarse page group. Query strings, handles, booking IDs and raw
  private paths are not forwarded.
- Signup email and temporary MFA challenge state use current-tab session storage, not URLs.
- MFA setup derives user identity server-side from the authenticated HttpOnly cookie. MFA challenge
  completion also sets HttpOnly cookies instead of returning session credentials for local storage.
- Current booking and payment-status lookups put customer email in a POST body, not a request URL.
  The payment-status GET parser remains temporarily for already-issued checkout redirects only.
- Web-push payloads contain a service, time, event type and internal dashboard link, but no customer
  name, email, phone or notes.
- Google Calendar template links for businesses contain a booking reference and service only;
  customer PII remains in the private email/ICS attachment or connected calendar API flow.
- The structured logger filters identity/contact/network keys and identifiers embedded in strings.
- Every Sentry runtime has `sendDefaultPii: false` and the shared event scrubber removes user data,
  request bodies, cookies, query strings, contact data and network identifiers.
- The audit discovers newly added likely-PII Prisma fields and fails until they receive an explicit
  classification, retention owner and deletion action.
- The usage dashboard derives aggregate business counters from their owning records and labels
  provider-cost calculations as estimates; it does not expose customer message content or recipient
  addresses.

## Retention and deletion matrix

| Category                                      | Default repository rule                                                                          | Owner                                      | Deletion/anonymisation action                                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Active account/profile                        | Active relationship                                                                              | Platform privacy / business owner          | Staged deletion; resolve ownership and provider data first                                                    |
| Profile media/published content               | Active plus up to 90-day orderly recovery window                                                 | Business controller                        | Unpublish, delete Cloudinary asset where appropriate, allow backup expiry                                     |
| Customer/bookings/inquiries/reviews           | Normally up to two years after interaction unless the controller documents another lawful period | Business controller                        | Verified anonymisation removes identity, content and network data while retaining justified transaction facts |
| Session, rate-limit and routine security data | Session/expiry or normally up to 30 days                                                         | Security operations                        | Revoke/delete/expire; preserve only under an incident or legal hold                                           |
| Optional analytics                            | No longer than 12 months                                                                         | Platform privacy                           | Provider deletion/expiry and consent withdrawal controls                                                      |
| Payment/refund facts                          | Applicable accounting, dispute or legal period                                                   | Finance operations and business controller | Remove unnecessary metadata; retain only required provider references/facts                                   |
| Backups/provider logs                         | Provider overwrite/deletion window                                                               | Platform privacy                           | Record provider limitation; do not promise immediate immutable-backup erasure                                 |

The user-facing retention notice remains `src/app/privacy/page.tsx`; the terminal processing contract
remains `docs/product/DATA_EXPORT_AND_DELETION_WORKFLOWS.md`. If these sources disagree, stop the
processing action and reconcile them before making a deletion promise.

## Open hardening decisions

These are explicit review outcomes, not undiscovered data:

1. Encrypt web-push endpoint, `p256dh` and `auth` values at application level before paid launch or
   materially broader push adoption. Owner: security operations.
2. Migrate `TeamInvitation.token` from a random plaintext lookup value to a keyed hash while
   preserving outstanding-invitation compatibility. Owner: security operations; complete before
   expanding team onboarding beyond the initial niche.
3. Confirm provider data-processing terms, regions, retention settings and deletion routes in the
   production accounts for Vercel, Neon, Cloudinary, Resend, Sentry, Stripe, Google and Google
   Analytics. Owner: platform privacy; pre-paid-launch operational check.
4. Keep special-category data out of generic customer custom fields/notes. If a niche genuinely
   requires it, perform a separate lawful-basis, minimisation, access and DPIA review first.

## Recurring review procedure

The `Privacy audit` GitHub workflow runs every Monday and can be triggered manually. The same audit
runs in the normal pull-request quality gate.

At least quarterly, and before adding a provider or personal-data field:

1. Run `npm run privacy:audit`.
2. Compare every Prisma field and JSON sub-schema with `PII_INVENTORY.json`.
3. Trace collection, database, exports, UI, email/calendar/push delivery, diagnostics and deletion.
4. Search logs, analytics events, Sentry contexts, notification payloads and application URLs for
   realistic canary identity values; do not use live customer data.
5. Review provider retention/deletion settings and access lists.
6. Update `reviewedAt`, `nextReviewDue`, decisions and owners in the inventory.
7. Open a pull request with the audit evidence. Never silently advance the due date.

The automated workflow becomes overdue after `nextReviewDue`; that intentional failure requires a
new evidenced review rather than allowing this document to become stale.
