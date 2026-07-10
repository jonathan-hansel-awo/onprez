# OnPrez API Route Access Matrix

**Status:** Living document
**Purpose:** Ensure every API route has an explicit access classification and security expectation.
**Rule:** No route should exist with unclear access rules.

## Access Levels

| Access Level       | Meaning                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------- |
| Public             | Can be called without login, but must be intentionally public and usually rate-limited. |
| Public token-based | Can be called without login only with a valid, time-limited token.                      |
| Authenticated      | Requires a valid logged-in user session.                                                |
| Business-scoped    | Requires a valid user session and access to the relevant business.                      |
| Owner/Admin-only   | Requires business access plus elevated role such as OWNER or ADMIN.                     |
| Internal-only      | Should not be exposed publicly.                                                         |
| Removed            | Route should not exist in production.                                                   |
| Needs review       | Access cannot be safely determined from route name alone.                               |

---

# P0 Findings

| Route            | Access Level | Required Checks                                                               | Status   | Notes                                                        |
| ---------------- | ------------ | ----------------------------------------------------------------------------- | -------- | ------------------------------------------------------------ |
| `/api/debug`     | Removed      | N/A                                                                           | Removed  | Public debug endpoint removed under P0-003.                  |
| `/api/check-env` | Removed      | N/A                                                                           | Removed  | Public environment diagnostic endpoint removed under P0-003. |
| `/api/health`    | Public       | Return minimal `{ ok: true }` or `{ ok: false }`; no raw errors/counts/config | Hardened | Safe only if response remains minimal.                       |

---

# Authentication Routes

| Route                               | Access Level       | Required Checks                                                      | Rate Limit | Status       | Notes                                           |
| ----------------------------------- | ------------------ | -------------------------------------------------------------------- | ---------- | ------------ | ----------------------------------------------- |
| `/api/auth/check-handle`            | Public             | Validate handle format; reserved handles; uniqueness only            | Strict     | Needs review | Must not allow enumeration abuse.               |
| `/api/auth/login`                   | Public             | Validate credentials; brute-force protection; account lockout        | Strict     | Needs review | Must not leak sensitive account details.        |
| `/api/auth/logout`                  | Authenticated      | Validate session; revoke current session; clear cookies              | Normal     | Needs review | Should be safe if session missing too.          |
| `/api/auth/me`                      | Authenticated      | Validate session; return safe user profile only                      | Normal     | Needs review | Must not expose password hash, secrets, tokens. |
| `/api/auth/signup`                  | Public             | Validate input; rate limit; create user/business safely              | Strict     | Needs review | Must handle duplicate email/handle safely.      |
| `/api/auth/verify-email`            | Public token-based | Verify token; check expiry; single-use token                         | Strict     | Needs review | Should not expose unnecessary account details.  |
| `/api/auth/resend-verification`     | Public             | Rate limit; avoid account enumeration                                | Strict     | Needs review | Response should be generic.                     |
| `/api/auth/password-reset/request`  | Public             | Rate limit; generic response; create reset token if account exists   | Strict     | Needs review | Must not reveal whether email exists.           |
| `/api/auth/password-reset/complete` | Public token-based | Validate reset token; expiry; password strength; invalidate sessions | Strict     | Needs review | Token should be single-use.                     |

---

# MFA Routes

| Route                            | Access Level       | Required Checks                                           | Rate Limit | Status       | Notes                                         |
| -------------------------------- | ------------------ | --------------------------------------------------------- | ---------- | ------------ | --------------------------------------------- |
| `/api/auth/mfa/challenge`        | Public token-based | Validate login challenge/session; rate limit attempts     | Strict     | Needs review | Should not allow arbitrary user MFA attempts. |
| `/api/auth/mfa/setup`            | Authenticated      | Validate session; generate setup secret safely            | Normal     | Needs review | Secret must be stored encrypted or securely.  |
| `/api/auth/mfa/verify-setup`     | Authenticated      | Validate session; verify TOTP before enabling MFA         | Strict     | Needs review | Must not enable MFA before valid code.        |
| `/api/auth/mfa/status`           | Authenticated      | Validate session                                          | Normal     | Needs review | Return only safe MFA status.                  |
| `/api/auth/mfa/disable`          | Authenticated      | Validate session; require password or strong confirmation | Strict     | Needs review | High-risk route.                              |
| `/api/auth/mfa/backup-codes`     | Authenticated      | Validate session; require password/re-auth                | Strict     | Needs review | Backup codes must not be casually exposed.    |
| `/api/auth/mfa/regenerate-codes` | Authenticated      | Validate session; require password/re-auth                | Strict     | Needs review | Old backup codes must be invalidated.         |

---

# Account Security Routes

| Route                                 | Access Level  | Required Checks                                                | Status       | Notes                                                    |
| ------------------------------------- | ------------- | -------------------------------------------------------------- | ------------ | -------------------------------------------------------- |
| `/api/account/activity`               | Authenticated | Validate session; return only current user's security activity | Needs review | Must not expose other users' activity.                   |
| `/api/account/sessions`               | Authenticated | Validate session; return only current user's sessions          | Needs review | Must not return raw tokens.                              |
| `/api/account/sessions/terminate-all` | Authenticated | Validate session; revoke current user's other sessions         | Needs review | Should usually keep or carefully handle current session. |
| `/api/account/sessions/[id]`          | Authenticated | Validate session; ensure session belongs to current user       | Needs review | Prevent deleting/viewing another user's session.         |
| `/api/account/trusted-devices`        | Authenticated | Validate session; return only current user's devices           | Needs review | Must not expose device fingerprints unnecessarily.       |
| `/api/account/trusted-devices/[id]`   | Authenticated | Validate session; ensure device belongs to current user        | Needs review | Cross-user access must be rejected.                      |

---

# Business Settings Routes

| Route                              | Access Level    | Required Checks                                                  | Status       | Notes                                                          |
| ---------------------------------- | --------------- | ---------------------------------------------------------------- | ------------ | -------------------------------------------------------------- |
| `/api/business/current`            | Business-scoped | Validate session; resolve current business for user              | Needs review | Must not assume one business forever.                          |
| `/api/business/features`           | Business-scoped | Validate session; require business access                        | Needs review | Write operations may require owner/admin.                      |
| `/api/business/hours`              | Business-scoped | Validate session; require business access                        | Needs review | Mutations should require owner/admin or configured staff role. |
| `/api/business/settings`           | Business-scoped | Validate session; require business access                        | Needs review | Sensitive settings may require owner/admin.                    |
| `/api/business/settings/booking`   | Business-scoped | Validate session; require business access                        | Needs review | Booking rules affect public availability.                      |
| `/api/business/special-dates`      | Business-scoped | Validate session; require business access                        | Needs review | Mutations should be owner/admin or staff with permission.      |
| `/api/business/special-dates/[id]` | Business-scoped | Validate session; ensure special date belongs to user's business | Needs review | ID tampering risk.                                             |
| `/api/business/[businessId]`       | Business-scoped | Validate session; require access to `businessId`                 | Needs review | High cross-tenant risk.                                        |
| `/api/business/[businessId]/theme` | Business-scoped | Validate session; require access to `businessId`                 | Needs review | Mutations should be owner/admin or permitted staff.            |

---

# Dashboard Routes

| Route                                     | Access Level    | Required Checks                                             | Status       | Notes                                                |
| ----------------------------------------- | --------------- | ----------------------------------------------------------- | ------------ | ---------------------------------------------------- |
| `/api/dashboard/stats`                    | Business-scoped | Validate session; require business access                   | Needs review | Must not aggregate other businesses.                 |
| `/api/dashboard/recent-bookings`          | Business-scoped | Validate session; require business access                   | Needs review | Customer data risk.                                  |
| `/api/dashboard/upcoming-appointments`    | Business-scoped | Validate session; require business access                   | Needs review | Customer data risk.                                  |
| `/api/dashboard/services`                 | Business-scoped | Validate session; require business access                   | Needs review | Mutations must check ownership.                      |
| `/api/dashboard/settings/reminders`       | Business-scoped | Validate session; require business access                   | Needs review | Notification settings.                               |
| `/api/dashboard/customers/search`         | Business-scoped | Validate session; require business access                   | Needs review | High privacy risk.                                   |
| `/api/dashboard/bookings`                 | Business-scoped | Validate session; require business access                   | Needs review | Must prevent cross-business appointment access.      |
| `/api/dashboard/bookings/day`             | Business-scoped | Validate session; require business access                   | Needs review | Date range must be scoped.                           |
| `/api/dashboard/bookings/week`            | Business-scoped | Validate session; require business access                   | Needs review | Date range must be scoped.                           |
| `/api/dashboard/bookings/quick-create`    | Business-scoped | Validate session; require business access                   | Needs review | Should require owner/admin/staff booking permission. |
| `/api/dashboard/bookings/[id]/cancel`     | Business-scoped | Validate session; ensure booking belongs to user's business | Needs review | ID tampering risk.                                   |
| `/api/dashboard/bookings/[id]/notes`      | Business-scoped | Validate session; ensure booking belongs to user's business | Needs review | Private note privacy risk.                           |
| `/api/dashboard/bookings/[id]/reminder`   | Business-scoped | Validate session; ensure booking belongs to user's business | Needs review | Can trigger customer communication.                  |
| `/api/dashboard/bookings/[id]/reschedule` | Business-scoped | Validate session; ensure booking belongs to user's business | Needs review | Must validate conflicts/timezone.                    |
| `/api/dashboard/bookings/[id]/status`     | Business-scoped | Validate session; ensure booking belongs to user's business | Needs review | Should enforce status state machine.                 |

---

# Public Presence Routes

| Route                                      | Access Level | Required Checks                               | Rate Limit | Status       | Notes                                      |
| ------------------------------------------ | ------------ | --------------------------------------------- | ---------- | ------------ | ------------------------------------------ |
| `/api/public/businesses/[handle]/faqs`     | Public       | Published business only; active FAQs only     | Normal     | Needs review | Must not expose draft/private content.     |
| `/api/public/businesses/[handle]/services` | Public       | Published business only; active services only | Normal     | Needs review | Must not expose inactive/private services. |
| `/api/public/inquiries`                    | Public       | Validate input; rate limit; spam protection   | Strict     | Needs review | Abuse target.                              |

---

# Availability and Public Booking Routes

| Route                     | Access Level              | Required Checks                                                           | Rate Limit | Status       | Notes                                            |
| ------------------------- | ------------------------- | ------------------------------------------------------------------------- | ---------- | ------------ | ------------------------------------------------ |
| `/api/availability`       | Public or business-scoped | If public, return availability only for published business/service        | Normal     | Needs review | Must not expose private business data.           |
| `/api/availability/next`  | Public or business-scoped | Same as above                                                             | Normal     | Needs review | Validate handle/service scope.                   |
| `/api/availability/slots` | Public or business-scoped | Same as above                                                             | Normal     | Needs review | Timezone/DST correctness required.               |
| `/api/bookings`           | Public or business-scoped | If public booking creation, validate business/service/slot and rate limit | Strict     | Needs review | Must prevent duplicate and conflicting bookings. |

---

# Appointment Routes

| Route                               | Access Level    | Required Checks                                                 | Status       | Notes                                                                |
| ----------------------------------- | --------------- | --------------------------------------------------------------- | ------------ | -------------------------------------------------------------------- |
| `/api/appointments`                 | Needs review    | Determine public vs dashboard use                               | Needs review | Potential duplicate of `/api/bookings` and dashboard booking routes. |
| `/api/appointments/check-conflicts` | Business-scoped | Validate session; require business access                       | Needs review | Should not be public unless carefully constrained.                   |
| `/api/appointments/multi-day`       | Business-scoped | Validate session; require business access                       | Needs review | Booking integrity risk.                                              |
| `/api/appointments/[id]`            | Business-scoped | Validate session; ensure appointment belongs to user's business | Needs review | ID tampering risk.                                                   |
| `/api/appointments/[id]/reschedule` | Business-scoped | Validate session; ensure appointment belongs to user's business | Needs review | Must validate conflicts.                                             |
| `/api/appointments/[id]/series`     | Business-scoped | Validate session; ensure appointment belongs to user's business | Needs review | Recurring/multi-day integrity risk.                                  |

---

# FAQ Routes

| Route               | Access Level    | Required Checks                           | Status       | Notes                                   |
| ------------------- | --------------- | ----------------------------------------- | ------------ | --------------------------------------- |
| `/api/faqs`         | Business-scoped | Validate session; require business access | Needs review | Mutations must be scoped.               |
| `/api/faqs/bulk`    | Business-scoped | Validate session; require business access | Needs review | Bulk operations high risk.              |
| `/api/faqs/reorder` | Business-scoped | Validate session; require business access | Needs review | Ensure all IDs belong to same business. |

---

# Presence Editor Routes

| Route                          | Access Level    | Required Checks                                                     | Status       | Notes                                              |
| ------------------------------ | --------------- | ------------------------------------------------------------------- | ------------ | -------------------------------------------------- |
| `/api/presence/apply-template` | Business-scoped | Validate session; require business access                           | Needs review | Template application mutates public/draft content. |
| `/api/presence/pages`          | Business-scoped | Validate session; require business access                           | Needs review | Must not expose another business's draft pages.    |
| `/api/presence/pages/publish`  | Business-scoped | Validate session; require business access; publish readiness checks | Needs review | High product trust risk.                           |

---

# Service Routes

| Route                                     | Access Level    | Required Checks                                                        | Status       | Notes                                                   |
| ----------------------------------------- | --------------- | ---------------------------------------------------------------------- | ------------ | ------------------------------------------------------- |
| `/api/services`                           | Business-scoped | Validate session; require business access                              | Needs review | Public services should use `/api/public/...`, not this. |
| `/api/services/bulk`                      | Business-scoped | Validate session; require business access                              | Needs review | Ensure all IDs belong to user's business.               |
| `/api/services/reorder`                   | Business-scoped | Validate session; require business access                              | Needs review | Ensure all IDs belong to same business.                 |
| `/api/services/stats`                     | Business-scoped | Validate session; require business access                              | Needs review | Must not aggregate other businesses.                    |
| `/api/services/[id]`                      | Business-scoped | Validate session; ensure service belongs to user's business            | Needs review | ID tampering risk.                                      |
| `/api/services/[id]/duplicate`            | Business-scoped | Validate session; ensure service belongs to user's business            | Needs review | New duplicate must remain in same business.             |
| `/api/services/[id]/toggle`               | Business-scoped | Validate session; ensure service belongs to user's business            | Needs review | Can affect public page.                                 |
| `/api/services/[id]/variants`             | Business-scoped | Validate session; ensure service belongs to user's business            | Needs review | Variant IDs must be scoped.                             |
| `/api/services/[id]/variants/[variantId]` | Business-scoped | Validate session; ensure service and variant belong to user's business | Needs review | Nested ID tampering risk.                               |

---

# Service Category Routes

| Route                          | Access Level    | Required Checks                                              | Status       | Notes                     |
| ------------------------------ | --------------- | ------------------------------------------------------------ | ------------ | ------------------------- |
| `/api/service-categories`      | Business-scoped | Validate session; require business access                    | Needs review | Mutations must be scoped. |
| `/api/service-categories/[id]` | Business-scoped | Validate session; ensure category belongs to user's business | Needs review | ID tampering risk.        |

---

# Team Routes

| Route                                  | Access Level       | Required Checks                                                     | Status       | Notes                                                  |
| -------------------------------------- | ------------------ | ------------------------------------------------------------------- | ------------ | ------------------------------------------------------ |
| `/api/team/invitations`                | Owner/Admin-only   | Validate session; require business owner/admin role                 | Needs review | Invitation abuse and privilege escalation risk.        |
| `/api/team/invitations/[id]`           | Owner/Admin-only   | Validate session; ensure invitation belongs to user's business      | Needs review | ID tampering risk.                                     |
| `/api/team/invitations/accept/[token]` | Public token-based | Validate invitation token; expiry; single-use; safe account linking | Needs review | Should not leak invitation details.                    |
| `/api/team/members`                    | Owner/Admin-only   | Validate session; require business owner/admin role                 | Needs review | Staff list privacy/permissions.                        |
| `/api/team/members/[id]`               | Owner/Admin-only   | Validate session; ensure member belongs to user's business          | Needs review | Prevent removing/changing users from another business. |

---

# Upload Routes

| Route               | Access Level    | Required Checks                                                                    | Rate Limit | Status       | Notes                                             |
| ------------------- | --------------- | ---------------------------------------------------------------------------------- | ---------- | ------------ | ------------------------------------------------- |
| `/api/upload/image` | Business-scoped | Validate session; require business access; verify file signature; size/type checks | Strict     | Needs review | High abuse route. Must not trust MIME type alone. |

---

# Required Shared Guards

Every route should use one of these patterns:

```ts
requireAuth(request)
requireBusinessAccess(userId, businessId)
requireBusinessRole(userId, businessId, ['OWNER', 'ADMIN'])
publicRateLimit(request, key)
```

## Rules

1. Private API routes must never rely on client-side auth.
2. Business-scoped routes must not trust `businessId` from the client without checking membership.
3. Routes using `[id]` must confirm the record belongs to the authenticated user's business.
4. Public routes must be intentionally public and rate-limited where abuse is possible.
5. Debug, environment, and diagnostic routes must not exist publicly in production.
6. Error responses must not leak raw database, environment, token, or provider details.
   | `/api/auth/me` | Authenticated | Validate session; return safe user profile only | Reviewed | Explicit safe response shape required. |
   | `/api/auth/logout` | Authenticated | Validate session where possible; revoke current session; always clear cookies | Reviewed | Clears stale cookies even if session is invalid. |
   | `/api/account/sessions` | Authenticated | Validate session; return only current user's sessions; never return raw tokens | Reviewed | Uses `isCurrent` instead of exposing token. |
   | `/api/account/sessions/terminate-all` | Authenticated | Validate session; revoke only current user's sessions | Reviewed | Keeps current session by default. |
   | `/api/account/sessions/[id]` | Authenticated | Validate session; ensure session belongs to current user | Reviewed | Uses `id + userId` ownership check. |
   | `/api/account/activity` | Authenticated | Validate session; return only current user's security activity | Reviewed | User-scoped and bounded pagination/filtering. |
   | `/api/account/trusted-devices` | Authenticated | Validate session; return only current user's non-revoked trusted devices; safe selected fields only | Reviewed | Does not return full DB row. |
   | `/api/account/trusted-devices/[id]` | Authenticated | Validate session; ensure device belongs to current user before revoking | Reviewed | Soft-revokes with `revokedAt`; rejects cross-user IDs. |
   | `/api/auth/mfa/challenge` | Public token-based | Validate temp token; rate limit attempts; consume backup codes once; create DB-backed session only after successful MFA | Needs service review | Route shape reviewed; inspect `mfa-challenge` service next. |
   | `/api/auth/mfa/setup` | Authenticated | Validate current session; use current user only; rate limit; do not trust client userId/email | Reviewed | Converted to session-based identity. |
   | `/api/auth/mfa/verify-setup` | Authenticated | Validate current session; verify TOTP for current user only; rate limit | Reviewed | Does not accept userId from client. |
   | `/api/auth/mfa/status` | Authenticated | Validate current session; return safe MFA metadata only | Reviewed | Confirm `getMfaStatus()` does not return secrets. |
   | `/api/auth/mfa/disable` | Authenticated | Validate current session; require password; rate limit; delete only current user's MFA data | Reviewed | Requires MFA to be enabled first. |
   | `/api/auth/mfa/backup-codes` | Authenticated | Validate current session; require password; rate limit; return metadata only, never hashes or raw codes | Reviewed | Actual backup codes shown only on regeneration/setup. |
   | `/api/auth/mfa/regenerate-codes` | Authenticated | Validate current session; require password; rate limit; invalidate old codes and return new codes once | Reviewed | Check service stores only hashed codes. |
   | `/api/auth/login` | Public | Validate credentials; rate limit; generic failures; if MFA required, return raw temp token once and store only hashed temp token | Reviewed | Login route and service reviewed; raw MFA temp token is not stored. |
   | `/api/auth/check-handle` | Public | Validate handle format; rate limit; no raw error leakage | Reviewed | Public by design; safe error response only. |
   | `/api/auth/signup` | Public | Validate input; rate limit; safe failure messages; no internal IDs in response | Reviewed | Uses signup schema and sanitized service errors. |
   | `/api/auth/resend-verification` | Public | Validate email; rate limit by IP+email hash; generic response | Reviewed | Does not reveal whether account exists or needs verification. |
   | `/api/auth/verify-email` | Public token-based | Validate token; rate limit; safe token failure response | Reviewed | Does not return raw service failure. |
   | `/api/auth/password-reset/request` | Public | Validate email; rate limit by IP+email hash; generic response | Reviewed | Does not reveal account existence. |
   | `/api/auth/password-reset/complete` | Public token-based | Validate token and new password; rate limit by IP+token hash; safe token failure response | Reviewed | Does not return raw service failure. |
   | `/api/auth/signup` | Public | Validate input; rate limit; safe failure messages; store hashed verification token | Reviewed | Service stores verification token hash; raw token sent only by email. |
   | `/api/auth/resend-verification` | Public | Validate email; rate limit by IP+email hash; generic response; store hashed verification token | Reviewed | Does not reveal account state. |
   | `/api/auth/verify-email` | Public token-based | Validate token; rate limit; look up hashed token with legacy fallback; consume once | Reviewed | Atomic token consumption prevents replay races. |
   | `/api/auth/password-reset/request` | Public | Validate email; rate limit by IP+email hash; generic response; store hashed reset token | Reviewed | Raw reset token only appears in email link. |
   | `/api/auth/password-reset/complete` | Public token-based | Validate token/password; rate limit; look up hashed token with legacy fallback; consume once; delete sessions | Reviewed | Atomic token consumption and session invalidation. |
   | `/api/business/current` | Business-scoped | Validate DB-backed session; resolve default owned/member business context | Reviewed | No longer assumes owner-only access; returns selected business fields. |
   | `/api/business/settings` | Business-scoped | GET requires business access; PUT/PATCH requires owner/admin/manager access | Reviewed | Supports explicit `businessId` with centralized authorization. |
   | `/api/business/features` | Business-scoped | GET requires business access; PUT requires owner/admin/manager access | Reviewed | Uses selected settings only. |
   | `/api/business/hours` | Business-scoped | GET requires business access; PUT requires owner/admin/manager access | Reviewed | Updates hours transactionally for authorized business only. |
   | `/api/business/settings/booking` | Business-scoped | GET requires business access; PUT requires owner/admin/manager access; uses DB-backed session auth | Reviewed | Replaced direct `verifyToken()` usage. |
   | `/api/business/special-dates` | Business-scoped | GET requires business access; POST requires owner/admin/manager access; scope all reads/writes to authorized business | Reviewed | Uses centralized business authorization and handles duplicate dates safely. |
   | `/api/business/[businessId]` | Business-scoped | Validate DB-backed session; require access to exact `businessId`; return selected fields only | Reviewed | Uses centralized business authorization and no owner-only assumption. |
   | `/api/business/[businessId]/theme` | Business-scoped | Validate DB-backed session; require owner/admin/manager access to exact `businessId`; validate theme payload | Reviewed | Updates scoped business settings only and returns selected fields. |
   | `/api/dashboard/stats` | Business-scoped | Validate session; resolve readable default business context | Reviewed | Supports owner/member access consistently. |
   | `/api/dashboard/recent-bookings` | Business-scoped | Validate session; resolve readable default business context | Reviewed | Appointment reads scoped to authorized business. |
   | `/api/dashboard/upcoming-appointments` | Business-scoped | Validate session; resolve readable default business context | Reviewed | Appointment reads scoped to authorized business. |
   | `/api/dashboard/bookings` | Business-scoped | Validate session; resolve readable default business context; paginate/filter within business scope | Reviewed | Customer data remains scoped to authorized business. |
   | `/api/dashboard/bookings/day` | Business-scoped | Validate session; resolve readable default business context | Reviewed | Day view scoped to authorized business. |
   | `/api/dashboard/bookings/week` | Business-scoped | Validate session; resolve readable default business context | Reviewed | Week view scoped to authorized business. |
   | `/api/dashboard/customers/search` | Business-scoped | Validate session; resolve readable default business context; minimum query length | Reviewed | Customer search scoped to authorized business. |
   | `/api/dashboard/services` | Business-scoped | Validate session; resolve readable default business context | Reviewed | Dashboard service picker scoped to authorized business. |
   | `/api/dashboard/settings/reminders` | Business-scoped | GET requires business access; PUT requires writable business role | Reviewed | Reminder settings updated only for authorized business. |
   | `/api/dashboard/bookings/quick-create` | Business-scoped | Validate session; require owner/admin/manager/staff; create booking only for authorized business | Reviewed | Manual booking creation scoped to authorized business. |
   | `/api/dashboard/bookings/[id]/notes` | Business-scoped | GET requires appointment access; PUT requires writable appointment role | Reviewed | Fixes incorrect membership check against appointment ID. |

   | `/api/appointments` | Business-scoped read/write | GET requires readable business context; POST requires owner/admin/manager/staff | Reviewed | Replaced owner-only lookup; service creation scoped to authorized business. |
   | `/api/appointments/[id]` | Appointment-scoped read/write | GET requires appointment business access; PUT/DELETE require owner/admin/manager/staff | Reviewed | Replaced owner-only lookup with appointment-scoped authorization. |
   | `/api/appointments/[id]/reschedule` | Appointment-scoped mutation | Requires owner/admin/manager/staff access to appointment's business | Reviewed | Uses appointment businessId from authorization helper. |
   | `/api/appointments/check-availability` | Public availability check with protected exclusions | Public for normal checks; excludeAppointmentId requires business access | Reviewed | Service must be active and belong to business. |
   | `/api/appointments/multi-day` | Business-scoped read/write | Requires authenticated business access; create requires owner/admin/manager/staff | Reviewed | Removed raw verifyToken usage. |
   | `/api/appointments/[id]/series` | Appointment-scoped read/write | GET requires appointment access; DELETE requires owner/admin/manager/staff | Reviewed | Fixed public series data exposure. |
   | `/api/service-categories` | Business-scoped read/write | GET requires business access; POST requires owner/admin/manager | Reviewed | Replaced owner-only lookup with shared business authorization. |
   | `/api/service-categories/[id]` | Category-scoped read/write | GET requires access to category business; PUT/DELETE require owner/admin/manager | Reviewed | Authorizes through category.businessId and uses scoped deleteMany. |
   | `/api/public/businesses/[handle]/faqs` | Public read | Public, published business only, active FAQs only | Reviewed | Added published-business check and safe field selection. |
   | `/api/public/businesses/[handle]/services` | Public read | Public, published business only, active services only | Reviewed | Bounded ids filter and kept active-service filtering. |
   | `/api/public/inquiries` | Public write | Public, rate-limited, published business only | Reviewed | Added zod validation, normalized email, safe response, and published-business check. |
   | `/api/presence/apply-template` | Business-scoped mutation | Requires owner/admin/manager | Reviewed | Replaced owner-only check with shared business role authorization and scoped page upsert. |
   | `/api/presence/pages` | Business-scoped draft page read/write | GET requires business access; PUT requires owner/admin/manager | Reviewed | Fixed pageId/businessId mismatch risk by verifying the page belongs to the authorized business before update. |
   | `/api/presence/pages/publish` | Business-scoped publish mutation | Requires owner/admin | Reviewed | Fixed pageId/businessId mismatch risk and scoped publish/unpublish to the authorized business. |
