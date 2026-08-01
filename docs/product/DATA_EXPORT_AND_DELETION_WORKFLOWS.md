# Data Export and Deletion Workflows

## Purpose

This document is the operational and acceptance contract for P2-022. It separates data access,
account deletion, and business-controlled customer erasure so that privacy requests do not destroy
records that OnPrez or a business must retain.

## User-facing workflows

### Account export

- Available at `/account/data` to an authenticated account holder.
- Requires the current password and uses the sensitive-auth rate limit.
- Produces a private, non-cacheable JSON download.
- Includes account profile, owned-business summaries, memberships, notification preferences,
  session/device history, authentication activity, security activity, and lifecycle requests.
- Excludes password hashes, session/refresh tokens, MFA secrets, backup-code hashes, and push
  authentication keys.

### Business export

- Available to the business owner only; team roles cannot export the whole business dataset.
- Requires the current password and uses the sensitive-auth rate limit.
- Includes business configuration, team membership, pending invitation metadata without tokens,
  hours, special dates, services, pages, FAQs, customers, bookings, transitions, inquiries, reviews,
  and payment records.
- The response is private, non-cacheable JSON and excludes provider credentials and authentication
  secrets.

### Account deletion request

- Requires the current password.
- Creates one active, durable `DataLifecycleRequest` for the account.
- Applies a 14-day cooling-off period and remains cancelable while it is Requested, Scheduled, or
  Review Required.
- Accounts without owned-business records can be scheduled for processing. Owned businesses,
  future bookings, or payment records force Review Required.
- Creating a request does not cascade-delete a business, bookings, payments, or audit evidence.

### Customer personal-data removal

- Available to the owner, admin, or manager from the Customers page.
- Requires the acting user's current password.
- Replaces customer identity and contact details with a non-routable `.invalid` identity.
- Removes customer notes, preferences, marketing consent, inquiry content, review content, IP data,
  and related message content.
- Retains appointment timing, service, status, policy snapshots, payment facts, and aggregate counts
  needed for business operations, disputes, accounting, or legal obligations.

## Audit contract

Every successful account export, business export, deletion request, deletion cancellation, and
customer anonymisation writes a `SecurityLog` lifecycle event. Logs contain actor and target IDs,
counts, export version, status, and retention categories; they must never contain passwords,
authentication tokens, downloaded payloads, customer names, customer email addresses, or message
content. The user relation uses `ON DELETE SET NULL` so lifecycle evidence survives account removal.

## Processing an account deletion request

1. Confirm the request remains active and the cooling-off date has passed.
2. Recalculate owned businesses, future bookings, payments/refunds, disputes, legal holds, and
   required tax/accounting retention.
3. Resolve ownership before deleting or anonymising an owner account. Never cascade-delete an owned
   business merely because the account requested deletion.
4. Delete authentication secrets and active sessions once processing begins.
5. Delete unnecessary account PII and anonymise retained identifiers.
6. Remove or schedule deletion of media and provider-held data where the provider lifecycle permits.
7. Mark the request Completed or Rejected, set the completion time or reason, and record a lifecycle
   audit event.
8. Allow backup expiry to follow the published retention window; do not promise immediate removal
   from immutable backup snapshots.

The 14-day cooling-off period leaves time to complete the review and respond within the ICO's normal
[one-calendar-month rights-request window](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/right-to-erasure/).
The right to erasure is not absolute, so every retained category still needs a documented lawful
reason and proportional scope.

Automated terminal deletion is intentionally not enabled until ownership transfer, provider media
cleanup, legal-hold, and paid-subscription behaviour are implemented and exercised. The staged
request is the safe boundary for the current product.

## Acceptance evidence

- Account and business JSON exports are authenticated, password-verified, rate-limited, and
  non-cacheable.
- Only an owner can export the complete business dataset.
- Account deletion is durable, cancelable, and prevented from silently cascading retained records.
- Customer PII can be anonymised without deleting retained booking/payment facts.
- Lifecycle actions are persisted without logging exported PII or secrets.
- Route, tenancy, password, retention, response-header, and anonymisation tests remain green.
