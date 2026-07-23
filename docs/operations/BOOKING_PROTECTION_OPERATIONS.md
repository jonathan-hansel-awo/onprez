# Booking Protection Operations Runbook

## Purpose

This runbook covers the production operation of Stripe-backed booking deposits: webhook delivery, cancellation decisions, refunds, reconciliation, failure recovery, and release checks.

## Required Stripe webhook events

Configure the production endpoint at:

```text
https://onprez.com/api/webhooks/stripe
```

Subscribe to:

- `account.updated`
- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.expired`
- `checkout.session.async_payment_failed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `refund.created`
- `refund.updated`
- `refund.failed`
- `charge.refunded`

The webhook secret must be stored as `STRIPE_WEBHOOK_SECRET`. Never log the secret or raw signed payload.

## Cancellation and refund rules

- A business-caused cancellation always refunds the remaining deposit.
- A no-show cancellation retains the deposit.
- A customer-requested cancellation outside the configured late-cancellation window defaults to a refund.
- A customer-requested cancellation inside the late-cancellation window defaults to retention, but an owner or authorised team member may waive the charge.
- Cancellation completes before the refund request. This releases the appointment slot even if Stripe is temporarily unavailable.
- A failed refund remains recorded as `FAILED` and is visible in the booking dashboard for retry.

## Manual reconciliation

The command is dry-run by default:

```bash
npm run payments:reconcile
```

Limit the scan or change the stale-payment threshold:

```bash
npm run payments:reconcile -- --limit=25 --older-than-minutes=30
```

Apply reconciliation against Stripe:

```bash
npm run payments:reconcile -- --apply --limit=25 --older-than-minutes=30
```

Reconciliation retrieves the connected account's Checkout Session, PaymentIntent, charge and refunds, then updates OnPrez records. Run the dry-run first and retain the JSON output with the incident record.

## Dashboard recovery actions

The booking detail view provides:

- **Reconcile with Stripe** — refreshes payment and refund state from Stripe.
- **Retry refund** — available after a recorded refund failure.

Before retrying a refund, reconcile first when the outcome is uncertain. This reduces the risk of requesting a second refund after a delayed Stripe response.

## Duplicate webhook protection

Each Stripe event ID is stored in `stripe_webhook_events`. Successfully processed event IDs are acknowledged without running their handler again. Failed or stale processing records may be retried. The event table must not contain payloads or customer payment credentials.

## Incident checks

### Payment received in Stripe but booking is pending

1. Find the booking by confirmation number.
2. Use **Reconcile with Stripe**.
3. Check the latest `booking_payments` record and `stripe_webhook_events` failures.
4. Confirm the connected Stripe account ID matches the business.
5. Re-deliver the relevant Stripe event if reconciliation does not resolve the state.

### Booking cancelled but refund failed

1. Confirm the appointment remains `CANCELLED`.
2. Reconcile the payment.
3. Review the recorded refund failure code/message.
4. Retry the refund from the dashboard.
5. Verify the refund in the connected Stripe account and confirm OnPrez shows `SUCCEEDED`.
6. Contact the customer if resolution is delayed.

### Repeated webhook failures

1. Check signature configuration and endpoint health.
2. Inspect structured logs using the Stripe event ID and object ID.
3. Fix the underlying handler or database issue.
4. Re-deliver failed Stripe events.
5. Run reconciliation for affected payments.

## Deployment checklist

1. Apply the migration to the Neon preview branch using the direct connection.
2. Run Prisma validation, type-check, tests and production build.
3. Exercise the full flow in Stripe test mode:
   - successful deposit
   - expired Checkout Session
   - failed payment
   - business cancellation and refund
   - customer late cancellation and retained deposit
   - duplicate webhook delivery
   - failed refund and retry
4. Verify dashboard payment visibility and reconciliation.
5. Apply the migration to production as a controlled release step.
6. Confirm all required production webhook subscriptions and secrets.
7. Perform one low-value live-mode booking/refund with an approved test business before enabling wider access.

Do not run Prisma migrations through the application build command.
