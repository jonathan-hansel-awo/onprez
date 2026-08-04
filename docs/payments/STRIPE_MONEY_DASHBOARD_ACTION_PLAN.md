# OnPrez Stripe Money Dashboard Action Plan

**Status:** Implemented in the accompanying pull request  
**Primary user:** Business owner receiving booking fees through Stripe Connect  
**Core principle:** OnPrez displays and explains payment information but never receives, holds, splits or controls merchant funds.

## Problem

Business owners currently have to rely on the standalone Stripe app to understand what happened to booking fees. A Stripe available balance can fall to £0 when funds move into a payout, which can look as though the money disappeared. Stripe app outages or authentication problems make that trust problem worse.

OnPrez already stores independently verified booking-payment records. It also has a connected Stripe account for each enabled business. The missing product layer is an owner-facing view that combines:

- durable OnPrez booking-fee history;
- Stripe's current pending and available balances;
- Stripe payout history and status;
- plain-English explanations of each state;
- a degraded mode when Stripe is temporarily unavailable.

## Scope of this PR

### 1. Owner-only Money API

Add `GET /api/dashboard/money`.

The endpoint:

- requires an authenticated business owner;
- scopes every database query to the resolved business;
- loads Stripe booking-payment records from OnPrez;
- returns verified, pending and failed payment totals;
- retrieves the connected account's live Stripe balance;
- retrieves recent Stripe payouts;
- masks provider identifiers;
- returns local booking-payment history even when Stripe API calls fail;
- never returns bank details, account tokens or full provider payloads.

### 2. Money dashboard

Add `/dashboard/money` under **Daily work**.

The page shows:

- verified booking fees recorded by OnPrez;
- pending Stripe balance;
- available Stripe balance;
- latest payout and Stripe-provided arrival date;
- recent booking-fee payments linked to customer, service and appointment;
- recent payout history;
- warnings when live Stripe information cannot be refreshed;
- an explanation that an available balance can become £0 after Stripe creates a payout;
- a clear statement that OnPrez never receives or holds the money.

### 3. Payment settings handoff

Update Payments & Booking Protection settings so:

- **View booking fees & payouts** opens the OnPrez Money page;
- the Stripe Dashboard is presented only for advanced identity, bank and account settings;
- stale copy claiming customer payments are not active is removed;
- users understand which information belongs in OnPrez and which remains with Stripe.

### 4. Navigation

Add **Money** beside Bookings and Customers in the primary dashboard navigation. The page is intended for daily operational use, not as an advanced settings tool.

## Data-source rules

### OnPrez is the durable source for booking-linked proof

OnPrez payment records answer:

- Did this customer pay the required booking fee?
- Which booking did the payment secure?
- What amount was verified?
- Was it refunded or unsuccessful?

This history remains visible when Stripe is temporarily unavailable.

### Stripe is the live source for balances and payouts

Stripe answers:

- How much is still pending?
- How much is currently available?
- Has Stripe created a payout?
- Is the payout preparing, in transit, paid, failed or cancelled?
- What arrival date is Stripe currently reporting?

OnPrez must label the arrival date as Stripe-provided and must not guarantee bank arrival.

## User-facing terminology

Use:

- **Verified booking fees**
- **Pending at Stripe**
- **Available at Stripe**
- **Latest payout**
- **On the way**
- **Sent to bank**
- **Stripe arrival date**

Avoid:

- OnPrez balance
- OnPrez payout
- OnPrez is sending your money
- Guaranteed bank arrival
- Funds held by OnPrez

## Failure behaviour

### Stripe API unavailable

- Return HTTP 200 with local payment records.
- Set live balance to unavailable.
- Return an empty or last-known payout view according to the current implementation.
- Show a warning explaining that verified OnPrez history is still available.
- Never convert the outage into a false zero balance.

### No connected Stripe account

- Show a setup state linking to Payments & Booking Protection.
- Do not call connected-account balance or payout endpoints.

### Restricted or incomplete Stripe account

- Keep historical booking-payment records visible.
- Direct account remediation to payment settings.

## Security requirements

- Owner-only business context.
- Cross-tenant access rejected server-side.
- Connected account ID used only server-side.
- No bank details, tokens, card details or unrestricted Stripe payloads returned.
- Provider references masked before rendering.
- Stripe failures logged without customer or financial secrets.

## Test requirements

Automated route tests must prove:

1. unauthenticated requests are rejected;
2. business access is resolved through the owner-only context;
3. verified booking fees are converted to integer minor units correctly;
4. a £0 available balance and an in-transit payout are represented independently;
5. Stripe outages preserve local booking-payment history;
6. Stripe is not called when no connected account exists.

Existing Stripe booking, webhook, reconciliation, refund and tenant-isolation tests must remain green.

## Manual preview checks

- Test at 375 px mobile width.
- Confirm Money is reachable from the collapsed and expanded sidebar.
- Confirm £5.00 is formatted correctly.
- Confirm a £0 available balance does not hide an in-transit payout.
- Confirm empty payment and payout states are understandable.
- Confirm the Money page still renders when mocked Stripe requests fail.
- Confirm Payments settings make OnPrez the primary everyday view.
- Confirm external Stripe navigation is described as advanced account settings.

## Rollout

1. Merge after CI and preview checks pass.
2. Deploy to production.
3. Open Louise's Money page and refresh once.
4. Confirm her historic £5 booking payment appears in OnPrez.
5. Confirm Stripe's balance and payout responses are available to the platform account.
6. If Stripe does not permit either connected-account endpoint for the current Standard-account configuration, keep the OnPrez history live and replace the unsupported live section with an embedded Stripe Connect component in a follow-up PR.
7. Ask Louise to use OnPrez for everyday booking-fee checks and reserve Stripe for identity, bank-account or compliance changes.

## Follow-up improvements

These are deliberately outside this first PR:

- webhook-cached payout records;
- downloadable booking-fee statements;
- date filtering and pagination;
- payout failure push notifications;
- embedded Stripe identity/bank settings;
- provider-neutral SumUp support;
- accounting exports.

## Definition of done

The feature is successful when Louise can answer all of the following inside OnPrez:

- Which customers paid booking fees?
- How much did each customer pay?
- Is money still pending at Stripe?
- Is money currently available?
- Did Stripe start a bank payout?
- What status and arrival date is Stripe reporting?

She should no longer need the Stripe app for routine booking-fee monitoring.
