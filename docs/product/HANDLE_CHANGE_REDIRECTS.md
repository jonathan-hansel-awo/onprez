# Handle Change and Redirect Contract

## Purpose

An OnPrez handle is a business’s public identity and may already appear in bookmarks, messages, emails, QR codes, search indexes, and booking links. Changing it must not silently break those links or let another business impersonate the old address.

P2-028 therefore treats the current handle and every retired handle as one durable namespace.

## Ownership and user experience

- Only the business owner can change the handle. Admin and manager membership does not grant this authority.
- The Business Profile page shows the current URL, validates the proposed handle, and requires an explicit confirmation step.
- Handles are normalised to lowercase and must contain 3–30 lowercase letters, numbers, or hyphens.
- Platform-reserved handles remain unavailable.
- The endpoint is protected by authenticated business scope, same-origin mutation controls, and a five-attempt daily rate limit.
- A successful change is recorded in the security log with the business ID and bounded old/new handles.

## Redirect behaviour

Each historical row stores only:

- the retired `sourceHandle`;
- a direct foreign key to the owning business;
- creation and update timestamps.

It does not store a target handle. The destination is always read from the related business’s current `slug`, so a sequence such as `alpha → beta → gamma` produces two direct redirects to `gamma`, never an `alpha → beta → gamma` chain.

The presence route and these booking routes issue permanent `308` redirects:

- `/{old}` → `/{current}`;
- `/{old}/book` → `/{current}/book`;
- `/{old}/book/{serviceId}` → `/{current}/book/{serviceId}`;
- `/{old}/book/success` → `/{current}/book/success`, preserving the existing non-PII confirmation/payment parameters.

An inactive business does not redirect. An unpublished active business may redirect to its canonical URL, whose existing publication rules then decide whether content is available.

## Conflict and reservation rules

- A handle cannot exist as both a current business handle and a retired handle.
- Retired handles remain reserved to their original business and are unavailable during signup or public handle checks.
- An owner may return to one of their own previous handles. That alias is removed before it becomes current, and the handle being replaced becomes the new alias.
- PostgreSQL triggers use transaction-scoped advisory locks before cross-table checks. This closes the concurrency race that separate unique indexes cannot prevent.
- Database format checks and unique constraints remain the final protection if an application path is bypassed.

## Cache behaviour

Ordinary current-handle presence requests retain their existing single cached business lookup. A redirect-history query occurs only after no current business matches.

After a successful change, OnPrez invalidates the old handle, the new handle, and every earlier alias. This removes cached page shells, missing-handle results, and prior redirect destinations immediately rather than waiting for the five-minute fallback.

## Failure and rollback behaviour

- Validation failures return `400`.
- Current or historical namespace conflicts return `409` without exposing database details.
- Non-owner changes return `403`.
- Rate-limited changes return `429` with `Retry-After`.
- A failed transaction changes neither the canonical handle nor redirect history.
- Returning to the previous handle uses the same owner flow; no manual database deletion is required.

## Release verification

After deploying migration `20260802000000_business_handle_redirects`:

1. As a business owner, change a published test business from `first-handle` to `second-handle`.
2. Confirm `/{first-handle}` returns a permanent redirect to `/{second-handle}`.
3. Confirm old booking index and service links preserve their suffixes and reach the current business.
4. Confirm the dashboard lists `first-handle` as a redirecting previous handle.
5. Confirm signup and handle availability reject `first-handle` for another business.
6. Change the same business to `third-handle`; confirm both earlier URLs redirect directly to `third-handle`.
7. Return to `first-handle`; confirm `second-handle` and `third-handle` redirect directly to it without a loop.
8. Confirm an admin or manager cannot change the handle through the UI or API.

No new environment variable or provider configuration is required.
