# Email Delivery Operations

## Scope

P2-024 gives each business a durable, privacy-minimised history for booking confirmations, business
booking alerts, appointment status messages, reminders, inquiry acknowledgements and business
inquiry alerts. Email delivery remains independent of booking/inquiry creation: a provider or audit
failure must not roll back the customer action.

Each record stores only:

- the business and optional booking/inquiry reference;
- a keyed recipient hash and masked dashboard label;
- the message category and customer/business audience;
- bounded send attempts, provider message/event IDs, timestamps, status and scrubbed error detail.

Full recipient addresses, subjects, HTML, text, attachments and raw webhook payloads are never
copied into the delivery tables.

## Resend webhook configuration

1. Deploy the migration `20260801170000_email_delivery_logging`.
2. In Resend, create a webhook whose endpoint is
   `https://<production-host>/api/webhooks/resend`.
3. Subscribe it to `email.sent`, `email.delivered`, `email.delivery_delayed`, `email.bounced`,
   `email.complained`, `email.failed`, and `email.suppressed`.
4. Copy the webhook signing secret into the production and relevant preview environment as
   `RESEND_WEBHOOK_SECRET`; do not use the API key as the signing secret.
5. Redeploy, then send controlled messages to Resend's documented `delivered@resend.dev`,
   `bounced@resend.dev`, `complained@resend.dev`, and `suppressed@resend.dev` test recipients.

The endpoint reads the raw request body and verifies `svix-id`, `svix-timestamp`, and
`svix-signature` with the Resend SDK before processing. The unique `svix-id` makes webhook retries
and manual replays idempotent. Unmatched messages are acknowledged without persisting their
recipient or subject.

## Status and retry contract

| Status       | Meaning                                           | Dashboard retry |
| ------------ | ------------------------------------------------- | --------------- |
| `PENDING`    | Application is preparing or claiming a send       | No              |
| `SENT`       | Resend accepted the API request                   | No              |
| `DELIVERED`  | Recipient mail server accepted the message        | No              |
| `DELAYED`    | Recipient server reported a temporary delay       | Yes, max 3      |
| `FAILED`     | Application/Resend could not send the message     | Yes, max 3      |
| `BOUNCED`    | Recipient server permanently rejected the message | No              |
| `COMPLAINED` | Recipient marked the message as spam              | No              |
| `SUPPRESSED` | Resend or OnPrez suppressed the recipient         | No              |

Retries require an authenticated owner, admin, manager or staff member, a same-origin request and
the existing email rate limit. The email is rebuilt from the current tenant-scoped booking or
inquiry rather than from a stored body. A retry is refused if the recipient or booking status has
changed, another retry claimed the record, or the three-attempt ceiling was reached.

## Bounce and complaint workflow

A matched hard bounce, complaint or provider suppression creates or updates a global keyed
recipient suppression. Future tracked sends to that address stop before Resend is called. The
dashboard shows the masked address and terminal status but deliberately offers no retry button.

Before removing a suppression, the operator must verify the address with the affected business,
review the corresponding Resend suppression and event, confirm that the cause is resolved, and
record the decision. Complaints must not be overridden merely because a business asks to resend.

## Acceptance and periodic checks

- A successful send moves from `PENDING` to `SENT`, then to `DELIVERED` after a verified webhook.
- Replaying the same `svix-id` creates no duplicate event.
- A delayed or failed send can be retried at most twice after the initial attempt.
- A bounce or complaint is visible to the correct tenant, activates suppression and cannot be
  retried.
- Another business cannot list or retry the delivery.
- Stored delivery rows contain no plaintext recipient, subject, body, attachment or raw webhook.
- Review delivery failure/bounce volume at least monthly and before increasing send volume.
- Delete ordinary delivery history after the operational 90-day window; retain active suppressions
  only while necessary to protect sender reputation and honour complaints.
