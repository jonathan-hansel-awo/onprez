# Platform Usage and Overhead

P3-002 adds the first platform-admin view of canonical business usage before any plan limit is
enforced. The protected dashboard is available at `/admin/operations`; its JSON representation is
available at `/api/admin/usage` under the same platform-role boundary.

## Access boundary

Only authenticated users whose platform role is `ADMIN` or `SUPERADMIN` may open the page or API.
Business `OWNER`, `ADMIN`, `STAFF`, and `VIEWER` roles do not grant platform access. The report is
read-only and contains aggregate usage rather than customer message contents or recipient addresses.

## Canonical counters

| Counter                        | Source                              | Period / definition                       |
| ------------------------------ | ----------------------------------- | ----------------------------------------- |
| Published pages                | `Page.isPublished`                  | Current state                             |
| Services                       | Active `Service` rows               | Current state                             |
| Bookings                       | `Appointment.createdAt`             | Current UTC calendar month                |
| Media items and original bytes | `MediaAsset` rows                   | Current provider-backed asset ledger      |
| Team seats                     | Owner plus `BusinessMember` rows    | Current state                             |
| Email sends                    | Tracked `EmailDelivery.sentAt` rows | Successful sends in the current UTC month |

These values are derived from the owning records on every read. OnPrez does not increment separate
mutable usage counters, so normal create/update/delete workflows cannot make a counter silently
diverge from the underlying records.

## Media coverage and backfill

New business uploads upsert a `MediaAsset` using Cloudinary's stable public ID. Reusing the same
stored image updates that record instead of increasing the item or byte count.

Assets uploaded before the P3-002 migration are not invented from application URLs. After deploying
the migration, an operator with Cloudinary and database credentials should run:

```bash
npm run usage:backfill-media
```

The script enumerates the `onprez/businesses/` Cloudinary namespace, accepts only the immutable
business-folder shape, ignores missing businesses, and safely upserts provider metadata. It reports
scanned, recorded, and skipped totals and is safe to rerun.

## Plans and thresholds

`src/lib/usage/plan-limits.ts` is the canonical service, media, booking, and published-page allowance
configuration used by both public pricing and the operator report. `Business.planTier` attributes
usage to Free, Professional, or Business without asserting that billing is active.

The report labels usage at:

- 70% as `warning`;
- 95% as `critical`;
- 100% or more as `exceeded`.

These states are observational. P3-002 does not block creation, hide existing data, or charge a
business.

## Cost labels and unavailable data

`ProviderCostRate` stores effective-dated manual fallback rates. The initial Cloudinary storage and
Resend email rates reproduce the 26 July 2026 OnPrez planning snapshot. Calculated values are shown
as **estimated allocation**, not actual spend, provider-reported usage, an invoice, or a price
guarantee.

Cloudinary delivery bytes and transformations are not available from current application-side
metering. The dashboard explicitly shows them as unavailable rather than zero. Connect a reviewed
provider API/export snapshot before using those dimensions for a launch-cost decision.

## Release procedure

1. Deploy `20260804090000_usage_tracking_foundation` through the normal migration workflow.
2. Run `npm run usage:backfill-media` once production application and migration health are green.
3. Compare the script's Cloudinary scan total with the `/admin/operations` tracked-media total.
4. Review active `ProviderCostRate` rows and replace planning rates when invoices or provider pricing
   change.
5. Do not enforce plan limits until the live backfill and provider billing-alert evidence have been
   reviewed.
